import express from 'express';
import {
  createAppointment,
  getUserAppointments,
  getCoachAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  getAvailableSlots
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (all appointment routes require authentication)
router.post('/', protect, createAppointment);                           // POST /api/appointments
router.get('/', protect, getUserAppointments);                          // GET /api/appointments
router.get('/coach/:id', protect, getCoachAppointments);                // GET /api/appointments/coach/:id
router.get('/available-slots/:coachId', protect, getAvailableSlots);    // GET /api/appointments/available-slots/:coachId
router.get('/:id', protect, getAppointmentById);                        // GET /api/appointments/:id
router.put('/:id', protect, updateAppointment);                         // PUT /api/appointments/:id
router.patch('/:id/cancel', protect, cancelAppointment);                // PATCH /api/appointments/:id/cancel
router.patch('/:id/complete', protect, completeAppointment);            // PATCH /api/appointments/:id/complete

export default router;
