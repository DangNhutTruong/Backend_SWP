import { Appointment, User, Feedback } from '../models/index.js';
import { Op } from 'sequelize';

// POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    const { coach_id, appointment_time, duration_minutes, notes } = req.body;
    const smoker_id = req.user.id;

    // Verify coach exists
    const coach = await User.findOne({
      where: {
        id: coach_id,
        role: 'coach'
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check if coach is available at the requested time
    const conflictingAppointment = await Appointment.findOne({
      where: {
        coach_id,
        appointment_time,
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Coach is not available at the requested time'
      });
    }

    const appointment = await Appointment.create({
      coach_id,
      smoker_id,
      appointment_time,
      duration_minutes: duration_minutes || 30,
      notes,
      status: 'pending'
    });

    // Include coach and smoker details in response
    const appointmentWithDetails = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: User,
          as: 'smoker',
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointmentWithDetails
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

// GET /api/appointments/user
export const getUserAppointments = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let whereClause = {
      [Op.or]: [
        { coach_id: user_id },
        { smoker_id: user_id }
      ]
    };

    if (status) {
      whereClause.status = status;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'coach',
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: User,
          as: 'smoker',
          attributes: { exclude: ['password_hash'] }
        }
      ],
      order: [['appointment_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id,
        [Op.or]: [
          { coach_id: user_id },
          { smoker_id: user_id }
        ]
      },
      include: [
        {
          model: User,
          as: 'coach',
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: User,
          as: 'smoker',
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_time, duration_minutes, notes, status } = req.body;
    const user_id = req.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id,
        [Op.or]: [
          { coach_id: user_id },
          { smoker_id: user_id }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only coach can confirm appointments, only participants can update other details
    if (status === 'confirmed' && appointment.coach_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Only the coach can confirm appointments'
      });
    }

    await appointment.update({
      appointment_time,
      duration_minutes,
      notes,
      status
    });

    // Return updated appointment with details
    const updatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: User,
          as: 'coach',
          attributes: { exclude: ['password_hash'] }
        },
        {
          model: User,
          as: 'smoker',
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

// DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id,
        [Op.or]: [
          { coach_id: user_id },
          { smoker_id: user_id }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Don't allow deletion of completed appointments
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed appointments'
      });
    }

    await appointment.destroy();

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message
    });
  }
};

// PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id,
        [Op.or]: [
          { coach_id: user_id },
          { smoker_id: user_id }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${appointment.status} appointment`
      });
    }

    await appointment.update({
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// POST /api/appointments/:id/rating
export const rateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, content } = req.body;
    const smoker_id = req.user.id;

    const appointment = await Appointment.findOne({
      where: {
        id,
        smoker_id,
        status: 'completed'
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Completed appointment not found'
      });
    }

    // Check if rating already exists
    const existingFeedback = await Feedback.findOne({
      where: {
        coach_id: appointment.coach_id,
        smoker_id
      }
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this coach'
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      coach_id: appointment.coach_id,
      smoker_id,
      rating,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
};
