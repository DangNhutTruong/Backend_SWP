import { User } from '../models/index.js';
import { generateToken, generateRefreshToken, hashPassword, comparePassword } from '../middleware/auth.js';
import { 
  generateEmailVerificationToken, 
  generateEmailVerificationOTP,
  sendVerificationOTP,
  sendPasswordResetOTP
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

    // Generate email verification OTP
    console.log('📧 Generating email verification OTP...');
    const verificationOTP = generateEmailVerificationOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    await user.update({ 
      email_verification_otp: verificationOTP,
      email_verification_otp_expires: otpExpires
    });

    // Send verification OTP email
    try {
      await sendVerificationOTP(user, verificationOTP);
      console.log('✅ Verification OTP email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Return user without password and tokens (require email verification first)
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      requiresVerification: true,
      data: {
        user: userWithoutPassword
        // Don't include token and refreshToken until email is verified
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

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true
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

// POST /api/auth/forgot-password - Send OTP for password reset
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
        message: 'Nếu email tồn tại, mã xác thực đã được gửi'
      });
    }

    // Generate 6-digit OTP for password reset
    const resetOTP = generateEmailVerificationOTP();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save reset OTP
    await user.update({
      password_reset_token: resetOTP,
      password_reset_expires: resetExpires
    });

    // Send password reset OTP email
    await sendPasswordResetOTP(user, resetOTP);
    
    res.json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn'
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

// POST /api/auth/reset-password - Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP và mật khẩu mới là bắt buộc'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Find user by email and reset OTP
    const user = await User.findOne({
      where: { 
        email: email,
        password_reset_token: otp 
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ'
      });
    }

    // Check if OTP is expired
    if (user.password_reset_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset OTP
    await user.update({
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
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

// POST /api/auth/verify-otp
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find user by email
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

    // Check if OTP is valid and not expired
    if (!user.email_verification_otp || user.email_verification_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code'
      });
    }

    if (!user.email_verification_otp_expires || new Date() > user.email_verification_otp_expires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Mark email as verified and clear OTP
    await user.update({
      email_verified: true,
      email_verification_otp: null,
      email_verification_otp_expires: null
    });

    return res.json({
      success: true,
      message: 'Email verified successfully',
      data: { verified: true }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
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

    // Generate new OTP
    const verificationOTP = generateEmailVerificationOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    await user.update({ 
      email_verification_otp: verificationOTP,
      email_verification_otp_expires: otpExpires
    });

    // Send new OTP email
    try {
      await sendVerificationOTP(user, verificationOTP);
      
      return res.json({
        success: true,
        message: 'New OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/auth/check-email-exists
export const checkEmailExists = async (req, res) => {
  try {
    console.log('🔍 Checking email existence...');
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email: email }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    res.json({
      success: true,
      message: 'Email found',
      exists: true
    });
  } catch (error) {
    console.error('❌ Check email exists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
