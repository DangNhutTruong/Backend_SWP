import express from 'express';
import { 
    getCoachStats, 
    getAppointmentStats, 
    getAllCoachesDetails, 
    updateCoach,
    createCoach,
    updateCoachAvailability,
    getCoachAssignments,
    createCoachAssignment,
    deleteCoachAssignment,
    getPremiumUsers,
    getCoachSessionHistory
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication and admin role check
router.use(requireAuth, requireAdmin);

// Coach management
router.get('/coaches/stats', getCoachStats);
router.get('/coaches', getAllCoachesDetails);
router.post('/coaches', createCoach);
router.put('/coaches/:id', updateCoach);
router.put('/coaches/:id/availability', updateCoachAvailability);
router.get('/coaches/:id/sessions', getCoachSessionHistory);

// Coach assignments
router.get('/coach-assignments', getCoachAssignments);
router.post('/coach-assignments', createCoachAssignment);
router.delete('/coach-assignments/:id', deleteCoachAssignment);

// User management
router.get('/users/premium', getPremiumUsers);

// Appointment statistics
router.get('/appointments/stats', getAppointmentStats);

export default router;
