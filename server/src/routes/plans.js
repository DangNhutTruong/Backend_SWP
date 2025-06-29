// Routes cho Quit Smoking Plan API
import express from 'express';
import {
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getUserPlans,
  getPlanTemplates,
  completeMilestone,
  getActivePlan,
  togglePlanStatus
} from '../controllers/planController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/templates', getPlanTemplates);               // GET /api/quit-plans/templates

// Protected routes (cần đăng nhập)
router.post('/', protect, createPlan);                    // POST /api/quit-plans
router.get('/user', protect, getUserPlans);               // GET /api/quit-plans/user
router.get('/active', protect, getActivePlan);            // GET /api/quit-plans/active
router.get('/:id', protect, getPlanById);                 // GET /api/quit-plans/:id
router.put('/:id', protect, updatePlan);                  // PUT /api/quit-plans/:id
router.patch('/:id/toggle', protect, togglePlanStatus);   // PATCH /api/quit-plans/:id/toggle
router.delete('/:id', protect, deletePlan);               // DELETE /api/quit-plans/:id
router.patch('/:planId/milestones/:milestoneId/complete', protect, completeMilestone); // PATCH /api/quit-plans/:planId/milestones/:milestoneId/complete

export default router;
