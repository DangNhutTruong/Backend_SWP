import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  logoutUser,
  deleteAccount,
  forgotPassword,
  resetPassword,
  verifyEmail
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { 
  registerValidation, 
  loginValidation, 
  changePasswordValidation 
} from '../middleware/validators.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting cho auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 attempts mỗi 15 phút
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 3, // Tối đa 3 lần đăng ký mỗi giờ
  message: {
    success: false,
    message: 'Quá nhiều lần đăng ký, vui lòng thử lại sau 1 giờ'
  }
});

// Public routes
router.post('/register', registerValidation, handleValidationErrors, registerUser);
router.post('/login', loginValidation, handleValidationErrors, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (cần authentication)
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePasswordValidation, handleValidationErrors, changePassword);
router.post('/logout', protect, logoutUser);
router.delete('/delete-account', protect, deleteAccount);

export default router;
