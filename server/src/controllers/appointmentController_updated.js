import { Appointment, Coach } from '../models/index.js';
import { Op } from 'sequelize';

// Get all appointments for a user
export const getAllAppointments = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { status, upcoming = false, page = 1, limit = 20 } = req.query;

    let whereCondition = { user_id: userId };
    
    if (status) {
      whereCondition.status = status;
    }

    if (upcoming === 'true') {
      whereCondition.date = {
        [Op.gte]: new Date()
      };
      whereCondition.status = {
        [Op.in]: ['pending', 'confirmed']
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: whereCondition,
      order: [['date', upcoming === 'true' ? 'ASC' : 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách lịch hẹn'
    });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const {
      coach_id,
      coach_name,
      date,
      appointment_type,
      notes,
      duration = 30
    } = req.body;

    // Validate required fields
    if (!coach_name || !date || !appointment_type) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: coach_name, date, appointment_type'
      });
    }

    // Validate appointment type
    const validTypes = ['consultation', 'follow_up', 'emergency'];
    if (!validTypes.includes(appointment_type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại cuộc hẹn không hợp lệ'
      });
    }

    // Validate date (must be in the future)
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Ngày hẹn phải trong tương lai'
      });
    }

    // Check if coach exists (if coach_id provided)
    if (coach_id) {
      const coach = await Coach.findByPk(coach_id);
      if (!coach || coach.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'Coach không tồn tại hoặc không hoạt động'
        });
      }
    }

    // Create appointment
    const appointment = await Appointment.create({
      user_id: userId,
      coach_id: coach_id || null,
      coach_name,
      date: appointmentDate,
      appointment_type,
      notes: notes || null,
      duration: parseInt(duration)
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch hẹn thành công',
      data: appointment
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo lịch hẹn'
    });
  }
};

// Get appointment by ID
export const getAppointment = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Error getting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin lịch hẹn'
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    const {
      coach_id,
      coach_name,
      date,
      appointment_type,
      status,
      notes,
      meeting_link,
      duration,
      feedback
    } = req.body;

    // Validate appointment type if provided
    if (appointment_type) {
      const validTypes = ['consultation', 'follow_up', 'emergency'];
      if (!validTypes.includes(appointment_type)) {
        return res.status(400).json({
          success: false,
          message: 'Loại cuộc hẹn không hợp lệ'
        });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }
    }

    // Validate date if provided
    if (date) {
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng ngày không hợp lệ'
        });
      }

      // Check if appointment can be rescheduled
      if (!appointment.canReschedule()) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi lịch hẹn (quá gần giờ hẹn hoặc đã hoàn tất)'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (coach_id !== undefined) updateData.coach_id = coach_id;
    if (coach_name !== undefined) updateData.coach_name = coach_name;
    if (date !== undefined) updateData.date = new Date(date);
    if (appointment_type !== undefined) updateData.appointment_type = appointment_type;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (feedback !== undefined) updateData.feedback = feedback;

    await appointment.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công',
      data: appointment
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật lịch hẹn'
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canCancel()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy lịch hẹn (quá gần giờ hẹn hoặc đã hoàn tất)'
      });
    }

    // Update appointment status and add cancellation reason
    await appointment.update({
      status: 'cancelled',
      notes: reason ? `Hủy bởi người dùng: ${reason}` : 'Hủy bởi người dùng'
    });

    res.json({
      success: true,
      message: 'Hủy lịch hẹn thành công',
      data: appointment
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hủy lịch hẹn'
    });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    await appointment.destroy();

    res.json({
      success: true,
      message: 'Xóa lịch hẹn thành công'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa lịch hẹn'
    });
  }
};

// Get upcoming appointments
export const getUpcomingAppointments = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { limit = 5 } = req.query;

    const appointments = await Appointment.findUpcoming(userId, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch hẹn sắp tới'
    });
  }
};

// Get appointment history
export const getAppointmentHistory = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: appointments } = await Appointment.findAndCountAll({
      where: {
        user_id: userId,
        status: {
          [Op.in]: ['completed', 'cancelled', 'no_show']
        }
      },
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: appointments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting appointment history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch sử lịch hẹn'
    });
  }
};
