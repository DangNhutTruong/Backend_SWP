import express from 'express';
import {
  getUserAchievements,
  getAllAchievements,
  checkAchievements,
  shareAchievement,
  getAchievementById
} from '../controllers/achievementController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/all', getAllAchievements);
router.get('/:id', getAchievementById);

// Protected routes
router.use(authenticate);
router.get('/user', getUserAchievements);
router.post('/check', checkAchievements);
router.post('/share/:id', shareAchievement);

export default router;
