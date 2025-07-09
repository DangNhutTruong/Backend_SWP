import express from 'express';
import {
  createDailyCheckin,
  getDailyCheckins,
  getTodayCheckin,
  updateTodayCheckin,
  getCheckinStats,
  deleteCheckin
} from '../controllers/dailyCheckinController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All daily check-in routes require authentication
router.use(authenticate);

// Daily check-in routes
router.post('/', createDailyCheckin);                    // POST /api/daily-checkins
router.get('/', getDailyCheckins);                       // GET /api/daily-checkins
router.get('/today', getTodayCheckin);                   // GET /api/daily-checkins/today
router.put('/today', updateTodayCheckin);                // PUT /api/daily-checkins/today
router.get('/stats', getCheckinStats);                   // GET /api/daily-checkins/stats
router.delete('/:date', deleteCheckin);                  // DELETE /api/daily-checkins/:date

export default router;
