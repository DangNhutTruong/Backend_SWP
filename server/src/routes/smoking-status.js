import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserSmokingStatus,
  recordSmokingStatus,
  updateSmokingStatusRecord,
  deleteSmokingStatusRecord,
  getSmokingStatusAnalytics
} from '../controllers/smokingStatusController.js';

const router = express.Router();

// All smoking status routes require authentication
router.use(authenticate);

// GET /api/smoking-status/user
router.get('/user', getUserSmokingStatus);

// POST /api/smoking-status/record
router.post('/record', recordSmokingStatus);

// PUT /api/smoking-status/record/:date
router.put('/record/:date', updateSmokingStatusRecord);

// DELETE /api/smoking-status/record/:date
router.delete('/record/:date', deleteSmokingStatusRecord);

// GET /api/smoking-status/analytics
router.get('/analytics', getSmokingStatusAnalytics);

export default router;
