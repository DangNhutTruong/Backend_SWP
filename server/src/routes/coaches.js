import express from 'express';
import {
  getAllCoaches,
  getCoachById,
  getCoachAvailability,
  getCoachReviews,
  submitFeedback
} from '../controllers/coachController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllCoaches);
router.get('/:id', getCoachById);
router.get('/:id/availability', getCoachAvailability);
router.get('/:id/reviews', getCoachReviews);

// Protected routes
router.use(authenticate);
router.post('/:id/feedback', submitFeedback);

export default router;
