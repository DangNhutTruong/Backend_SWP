import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Tạo JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Middleware bảo vệ routes cần authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không có token, quyền truy cập bị từ chối'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Tìm user trong database
    const user = await User.findOne({
      where: { 
        UserID: decoded.id,
        IsActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc user không tồn tại'
      });
    }

    // Thêm user vào request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      error: error.message
    });
  }
};

// Middleware kiểm tra role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập'
      });
    }

    if (!roles.includes(req.user.RoleName)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập tính năng này'
      });
    }

    next();
  };
};

// Alias for protect function  
export const authenticateToken = protect;
export const authenticate = protect;
