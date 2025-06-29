import express from 'express';
import {
  getDashboardStats,
  getHealthImprovements,
  getWeeklyChart
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/health-improvements', getHealthImprovements);
router.get('/weekly-chart', getWeeklyChart);

export default router;
