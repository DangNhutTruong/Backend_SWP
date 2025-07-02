import express from 'express';
import {
  createCheckin,
  getUserProgress,
  getProgressByDate,
  updateCheckin,
  deleteCheckin,
  getProgressStats,
  getChartData
} from '../controllers/progressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All progress routes require authentication
router.use(authenticate);

router.post('/checkin', createCheckin);
router.get('/user', getUserProgress);
router.get('/user/:date', getProgressByDate);
router.put('/checkin/:date', updateCheckin);
router.delete('/checkin/:date', deleteCheckin);
router.get('/stats', getProgressStats);
router.get('/chart-data', getChartData);

export default router;
