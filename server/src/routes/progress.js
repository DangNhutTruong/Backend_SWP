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
  getMonthlySummary,
  checkinProgress,
  getUserProgressByDate,
  updateCheckinByDate,
  deleteCheckinByDate,
  getProgressChartData
} from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (cần đăng nhập)
router.post('/checkin', protect, checkinProgress);                    // POST /api/progress/checkin
router.get('/user', protect, getUserProgress);                        // GET /api/progress/user  
router.get('/user/:date', protect, getUserProgressByDate);            // GET /api/progress/user/:date
router.put('/checkin/:date', protect, updateCheckinByDate);           // PUT /api/progress/checkin/:date
router.delete('/checkin/:date', protect, deleteCheckinByDate);        // DELETE /api/progress/checkin/:date
router.get('/stats', protect, getProgressStats);                      // GET /api/progress/stats
router.get('/chart-data', protect, getProgressChartData);             // GET /api/progress/chart-data

// Legacy routes (for backward compatibility)
router.get('/', protect, getAllProgress);                            // GET /api/progress
router.get('/today', protect, getTodayProgress);                     // GET /api/progress/today
router.get('/weekly-chart', protect, getWeeklyChart);                // GET /api/progress/weekly-chart
router.get('/monthly-summary', protect, getMonthlySummary);          // GET /api/progress/monthly-summary
router.post('/', protect, createProgress);                           // POST /api/progress
router.put('/:id', protect, updateProgress);                         // PUT /api/progress/:id
router.delete('/:id', protect, deleteProgress);                      // DELETE /api/progress/:id

export default router;
