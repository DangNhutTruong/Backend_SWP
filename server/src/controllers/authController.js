import { User } from '../models/index.js';
import { generateToken, generateRefreshToken, hashPassword, comparePassword } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    console.log('🔍 Starting registration process...');
    const { username, email, password, full_name, phone, gender, date_of_birth, role } = req.body;
    console.log('📝 Registration data:', { username, email, full_name });

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
    const user = await User.create({
      username: username || full_name || 'user',
      email: email,
      password: password_hash  // Store hashed password
    });
    console.log('✅ User created successfully:', user.toJSON());

    // Generate tokens
    console.log('🔑 Generating tokens...');
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    console.log('✅ Tokens generated successfully');

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
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
    // This would typically involve email verification logic
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Email verification endpoint - to be implemented'
    });
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
    // This would typically involve sending reset email
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Forgot password endpoint - to be implemented'
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
    // This would typically involve password reset logic
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Reset password endpoint - to be implemented'
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
