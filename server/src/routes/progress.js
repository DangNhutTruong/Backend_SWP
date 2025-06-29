// Routes cho Progress Tracking API
import express from 'express';
import {
  getAllProgress,
  getUserProgress,
  createProgress,
  updateProgress,
  deleteProgress,
  getProgressStats,
  getTodayProgress,
  getWeeklyChart,
  getMonthlySummary
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (cần đăng nhập)
router.get('/', protect, getAllProgress);                      // GET /api/progress
router.get('/stats', protect, getProgressStats);               // GET /api/progress/stats
router.get('/today', protect, getTodayProgress);               // GET /api/progress/today
router.get('/weekly-chart', protect, getWeeklyChart);          // GET /api/progress/weekly-chart
router.get('/monthly-summary', protect, getMonthlySummary);    // GET /api/progress/monthly-summary
router.get('/user/:userId', protect, getUserProgress);         // GET /api/progress/user/:userId
router.post('/', protect, createProgress);                     // POST /api/progress
router.put('/:id', protect, updateProgress);                   // PUT /api/progress/:id
router.delete('/:id', protect, deleteProgress);                // DELETE /api/progress/:id

export default router;
