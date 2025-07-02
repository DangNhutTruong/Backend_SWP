import { User } from '../models/index.js';
import { generateToken, generateRefreshToken, hashPassword, comparePassword } from '../middleware/auth.js';
import { 
  generateEmailVerificationToken, 
  generatePasswordResetToken, 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} from '../utils/emailService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    console.log('🔍 Starting registration process...');
    const { username, name, email, password, full_name, phone, gender, date_of_birth, role } = req.body;
    console.log('📝 Registration data received:', { username, name, email, full_name });

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await User.findOne({
      where: {
        email: email
      }
    });
    console.log('✅ User existence check completed');

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const password_hash = await hashPassword(password);
    console.log('✅ Password hashed successfully');

    // Create user
    console.log('👤 Creating user...');
    
    // Determine username priority: username > name > full_name > email prefix
    let finalUsername = username || name || full_name;
    if (!finalUsername || finalUsername.trim() === '') {
      // Extract name from email if no username provided
      finalUsername = email.split('@')[0];
    }
    
    console.log('📝 Final username will be:', finalUsername);
    
    const user = await User.create({
      username: finalUsername,
      email: email,
      password: password_hash  // Store hashed password
    });
    console.log('✅ User created successfully:', user.toJSON());

    // Generate email verification token
    console.log('📧 Generating email verification token...');
    const verificationToken = generateEmailVerificationToken();
    await user.update({ email_verification_token: verificationToken });

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    console.log('🔑 Generating tokens...');
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log('✅ Tokens generated successfully');

    // Store refresh token
    await user.update({ refresh_token: refreshToken });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password - support both hashed and plain text for existing users
    let isPasswordValid = false;
    
    // Try hashed password first
    try {
      isPasswordValid = await comparePassword(password, user.password);
    } catch (error) {
      console.log('Hash comparison failed, trying plain text...');
    }
    
    // If hash comparison failed, try plain text comparison for old users
    if (!isPasswordValid && user.password === password) {
      isPasswordValid = true;
      console.log('⚠️  Plain text password matched - consider updating to hashed password');
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login (if you add this field later)
    // await user.update({ last_login: new Date() });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just send success response
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET + '_refresh');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token - user not found'
      });
    }

    // Check if stored refresh token matches (optional security layer)
    if (user.refresh_token && user.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token - token mismatch'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update stored refresh token
    await user.update({ refresh_token: newRefreshToken });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          email_verified: user.email_verified
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email or verification token is required'
      });
    }

    // Case 1: Verify with token (user clicks email link)
    if (token) {
      const user = await User.findOne({
        where: { email_verification_token: token }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      if (user.email_verified) {
        return res.json({
          success: true,
          message: 'Email already verified'
        });
      }

      // Mark email as verified
      await user.update({
        email_verified: true,
        email_verification_token: null
      });

      return res.json({
        success: true,
        message: 'Email verified successfully',
        data: { verified: true }
      });
    }

    // Case 2: Resend verification email
    if (email) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.email_verified) {
        return res.json({
          success: true,
          message: 'Email already verified'
        });
      }

      // Generate new verification token
      const verificationToken = generateEmailVerificationToken();
      await user.update({ email_verification_token: verificationToken });

      // Send verification email
      await sendVerificationEmail(user, verificationToken);

      return res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    }

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token
    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetExpires
    });

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);

    // In development, return token for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      // Only show token in development mode for testing
      ...(isDevelopment && { 
        devToken: resetToken,
        devMessage: 'Development mode: Use this token to reset password' 
      })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Forgot password failed',
      error: error.message
    });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by reset token
    const user = await User.findOne({
      where: { password_reset_token: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if token is expired
    if (user.password_reset_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: { passwordReset: true }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Reset password failed',
      error: error.message
    });
  }
};
