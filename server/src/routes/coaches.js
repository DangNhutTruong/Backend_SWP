import express from 'express';
import {
  getAllCoaches,
  getCoachById,
  updateCoachProfile,
  getCoachAvailability,
  updateCoachAvailability,
  getCoachStats
} from '../controllers/coachController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCoaches);                           // GET /api/coaches
router.get('/:id', getCoachById);                         // GET /api/coaches/:id
router.get('/:id/availability', getCoachAvailability);    // GET /api/coaches/:id/availability

// Protected routes
router.put('/:id/profile', protect, updateCoachProfile);        // PUT /api/coaches/:id/profile
router.put('/:id/availability', protect, updateCoachAvailability); // PUT /api/coaches/:id/availability
router.get('/:id/stats', protect, getCoachStats);              // GET /api/coaches/:id/stats

export default router;
