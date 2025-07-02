import express from 'express';
import {
  createAppointment,
  getUserAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  cancelAppointment,
  rateAppointment
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticate);

router.post('/', createAppointment);
router.get('/user', getUserAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.put('/:id/cancel', cancelAppointment);
router.post('/:id/rating', rateAppointment);

export default router;
