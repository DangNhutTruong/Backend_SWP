import { User, Appointment, Feedback } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// GET /api/coaches
export const getAllCoaches = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const coaches = await User.findAll({
      where: { role: 'coach' },
      attributes: { exclude: ['password_hash'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: coaches
    });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coaches',
      error: error.message
    });
  }
};

// GET /api/coaches/:id
export const getCoachById = async (req, res) => {
  try {
    const { id } = req.params;

    const coach = await User.findOne({
      where: {
        id,
        role: 'coach'
      },
      attributes: { exclude: ['password_hash'] }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Get coach statistics
    const totalAppointments = await Appointment.count({
      where: { coach_id: id }
    });

    const completedAppointments = await Appointment.count({
      where: {
        coach_id: id,
        status: 'completed'
      }
    });

    const averageRating = await Feedback.findOne({
      where: { coach_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        ...coach.toJSON(),
        stats: {
          totalAppointments,
          completedAppointments,
          averageRating: parseFloat(averageRating?.avgRating || 0).toFixed(1)
        }
      }
    });
  } catch (error) {
    console.error('Get coach error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coach',
      error: error.message
    });
  }
};

// GET /api/coaches/:id/availability
export const getCoachAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Verify coach exists
    const coach = await User.findOne({
      where: {
        id,
        role: 'coach'
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Get appointments for the specified date
    const appointments = await Appointment.findAll({
      where: {
        coach_id: id,
        appointment_time: {
          [Op.gte]: new Date(date + ' 00:00:00'),
          [Op.lt]: new Date(date + ' 23:59:59')
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      },
      attributes: ['appointment_time', 'duration_minutes'],
      order: [['appointment_time', 'ASC']]
    });

    // Generate available time slots (this is a simplified version)
    // In a real app, you would have coach's working hours and preferences
    const workingHours = [
      '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
    ];

    const bookedTimes = appointments.map(apt =>
      new Date(apt.appointment_time).toTimeString().substring(0, 5)
    );

    const availableSlots = workingHours.filter(time =>
      !bookedTimes.includes(time)
    );

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots: bookedTimes
      }
    });
  } catch (error) {
    console.error('Get coach availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coach availability',
      error: error.message
    });
  }
};

// GET /api/coaches/:id/reviews
export const getCoachReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Verify coach exists
    const coach = await User.findOne({
      where: {
        id,
        role: 'coach'
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    const reviews = await Feedback.findAll({
      where: { coach_id: id },
      include: [{
        model: User,
        as: 'smoker',
        attributes: ['id', 'username', 'full_name', 'avatar_url']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get coach reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get coach reviews',
      error: error.message
    });
  }
};

// POST /api/coaches/:id/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params; // coach_id
    const { rating, content } = req.body;
    const smoker_id = req.user.id;

    // Verify coach exists
    const coach = await User.findOne({
      where: {
        id,
        role: 'coach'
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check if user has had an appointment with this coach
    const hasAppointment = await Appointment.findOne({
      where: {
        coach_id: id,
        smoker_id,
        status: 'completed'
      }
    });

    if (!hasAppointment) {
      return res.status(400).json({
        success: false,
        message: 'You can only leave feedback for coaches you have had completed appointments with'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      where: {
        coach_id: id,
        smoker_id
      }
    });

    if (existingFeedback) {
      // Update existing feedback
      await existingFeedback.update({
        rating,
        content
      });

      res.json({
        success: true,
        message: 'Feedback updated successfully',
        data: existingFeedback
      });
    } else {
      // Create new feedback
      const feedback = await Feedback.create({
        coach_id: id,
        smoker_id,
        rating,
        content
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: feedback
      });
    }
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};
