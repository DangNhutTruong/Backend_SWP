import express from 'express';
import {
  getAllAchievements,
  getUserAchievements,
  checkAchievements,
  shareAchievement,
  getAchievementById
} from '../controllers/achievementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllAchievements);
router.get('/:id', getAchievementById);

// Protected routes
router.use(protect);
router.get('/user/:userId', getUserAchievements);
router.post('/check', checkAchievements);
router.post('/:id/share', shareAchievement);

export default router;
