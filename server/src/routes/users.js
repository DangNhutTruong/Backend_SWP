import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getSmokingStatus,
  updateSmokingStatus,
  deleteAccount
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// User management routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.get('/smoking-status', getSmokingStatus);
router.put('/smoking-status', updateSmokingStatus);
router.delete('/account', deleteAccount);

export default router;
