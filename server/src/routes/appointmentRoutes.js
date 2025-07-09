import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/appointments
 * @desc Create a new appointment
 * @access Private - Requires authentication
 */
router.post('/', requireAuth, appointmentController.createAppointment);

/**
 * @route GET /api/appointments/user
 * @desc Get all appointments for the authenticated user
 * @access Private - Requires authentication
 */
router.get('/user', requireAuth, appointmentController.getUserAppointments);

/**
 * @route GET /api/appointments/:id
 * @desc Get a specific appointment by ID
 * @access Private - Requires authentication and authorization
 */
router.get('/:id', requireAuth, appointmentController.getAppointmentById);

/**
 * @route PUT /api/appointments/:id
 * @desc Update an appointment
 * @access Private - Requires authentication and authorization
 */
router.put('/:id', requireAuth, appointmentController.updateAppointment);

/**
 * @route DELETE /api/appointments/:id
 * @desc Delete an appointment
 * @access Private - Requires authentication and authorization
 */
router.delete('/:id', requireAuth, appointmentController.deleteAppointment);

/**
 * @route PUT /api/appointments/:id/cancel
 * @desc Cancel an appointment
 * @access Private - Requires authentication and authorization
 */
router.put('/:id/cancel', requireAuth, appointmentController.cancelAppointment);

/**
 * @route POST /api/appointments/:id/rate
 * @desc Rate and give feedback for an appointment
 * @access Private - Requires authentication and authorization
 */
router.post('/:id/rate', requireAuth, appointmentController.rateAppointment);

export default router;
