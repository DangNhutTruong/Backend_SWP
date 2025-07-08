import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmailOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  checkEmailExists
} from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../middleware/validators.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/verify-otp', verifyEmailOTP);
router.post('/resend-otp', resendOTP);
router.post('/check-email-exists', checkEmailExists);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
