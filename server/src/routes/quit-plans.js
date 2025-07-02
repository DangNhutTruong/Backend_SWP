import express from 'express';
import {
  createQuitPlan,
  getUserQuitPlans,
  getQuitPlanById,
  updateQuitPlan,
  deleteQuitPlan,
  getQuitPlanTemplates
} from '../controllers/quitPlanController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/templates', getQuitPlanTemplates);

// Protected routes
router.use(authenticate);
router.post('/', createQuitPlan);
router.get('/user', getUserQuitPlans);
router.get('/:id', getQuitPlanById);
router.put('/:id', updateQuitPlan);
router.delete('/:id', deleteQuitPlan);

export default router;
