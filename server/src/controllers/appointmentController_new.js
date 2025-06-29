import User from '../models/User.js';
import { Op } from 'sequelize';

// Note: Appointment model will be created later. For now using placeholder structure
const AppointmentStatuses = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

// Create appointment
export const createAppointment = async (req, res) => {
  try {
    const {
      coachId,
      appointmentDate,
      appointmentTime,
      duration = 60,
      type = 'consultation',
      notes
    } = req.body;
    const userId = req.user.UserID;

    // Validate required fields
    if (!coachId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: coachId, appointmentDate, appointmentTime'
      });
    }

    // Check if coach exists
    const coach = await User.findOne({
      where: {
        UserID: coachId,
        RoleID: 2
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    // Parse appointment datetime
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian hẹn phải trong tương lai'
      });
    }

    // Create appointment (placeholder - will implement when Appointment model is ready)
    const appointmentData = {
      userId,
      coachId,
      appointmentDate: appointmentDateTime,
      duration: parseInt(duration),
      type,
      notes: notes || null,
      status: AppointmentStatuses.PENDING,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: appointmentData,
      message: 'Tạo lịch hẹn thành công'
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo lịch hẹn'
    });
  }
};

// Get user appointments
export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { status, page = 1, limit = 10, upcoming } = req.query;

    // Placeholder response - will implement when Appointment model is ready
    const mockAppointments = [
      {
        id: 1,
        userId,
        coachId: 1,
        coachName: 'Dr. Nguyễn Văn A',
        appointmentDate: new Date('2025-07-01T10:00:00'),
        duration: 60,
        type: 'consultation',
        status: 'confirmed',
        notes: 'Tư vấn kế hoạch cai thuốc'
      }
    ];

    res.json({
      success: true,
      data: mockAppointments,
      pagination: {
        total: 1,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Error getting user appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách lịch hẹn'
    });
  }
};

// Get coach appointments
export const getCoachAppointments = async (req, res) => {
  try {
    const { id: coachId } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.RoleID;

    // Check if user can view this coach's appointments
    if (userRole !== 1 && userId !== parseInt(coachId)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem lịch hẹn của coach này'
      });
    }

    const { status, page = 1, limit = 10, date } = req.query;

    // Placeholder response
    const mockAppointments = [
      {
        id: 1,
        userId: 1,
        userName: 'Nguyễn Văn B',
        coachId: parseInt(coachId),
        appointmentDate: new Date('2025-07-01T10:00:00'),
        duration: 60,
        type: 'consultation',
        status: 'confirmed',
        notes: 'Tư vấn kế hoạch cai thuốc'
      }
    ];

    res.json({
      success: true,
      data: mockAppointments,
      pagination: {
        total: 1,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('Error getting coach appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch hẹn của coach'
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    // Placeholder response
    const mockAppointment = {
      id: parseInt(id),
      userId: userId,
      userName: 'Nguyễn Văn B',
      coachId: 1,
      coachName: 'Dr. Nguyễn Văn A',
      appointmentDate: new Date('2025-07-01T10:00:00'),
      duration: 60,
      type: 'consultation',
      status: 'confirmed',
      notes: 'Tư vấn kế hoạch cai thuốc',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    };

    res.json({
      success: true,
      data: mockAppointment
    });

  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin lịch hẹn'
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const {
      appointmentDate,
      appointmentTime,
      duration,
      notes,
      status
    } = req.body;

    // Placeholder response
    const updatedAppointment = {
      id: parseInt(id),
      userId: userId,
      appointmentDate: appointmentDate ? new Date(`${appointmentDate}T${appointmentTime}`) : new Date('2025-07-01T10:00:00'),
      duration: duration || 60,
      notes: notes || 'Updated notes',
      status: status || 'confirmed',
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedAppointment,
      message: 'Cập nhật lịch hẹn thành công'
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
    const { id } = req.params;
    const { reason } = req.body;

    // Placeholder response
    const cancelledAppointment = {
      id: parseInt(id),
      status: 'cancelled',
      cancellationReason: reason || 'No reason provided',
      cancelledAt: new Date()
    };

    res.json({
      success: true,
      data: cancelledAppointment,
      message: 'Hủy lịch hẹn thành công'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hủy lịch hẹn'
    });
  }
};

// Complete appointment
export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const { summary, nextAppointmentSuggestion } = req.body;

    // Only coach can complete appointment
    if (req.user.RoleID !== 2) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ coach mới có thể hoàn thành lịch hẹn'
      });
    }

    // Placeholder response
    const completedAppointment = {
      id: parseInt(id),
      status: 'completed',
      summary: summary || 'Appointment completed successfully',
      nextAppointmentSuggestion: nextAppointmentSuggestion || null,
      completedAt: new Date(),
      completedBy: userId
    };

    res.json({
      success: true,
      data: completedAppointment,
      message: 'Hoàn thành lịch hẹn thành công'
    });

  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hoàn thành lịch hẹn'
    });
  }
};

// Get available time slots for a coach
export const getAvailableSlots = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày'
      });
    }

    // Check if coach exists
    const coach = await User.findOne({
      where: {
        UserID: coachId,
        RoleID: 2
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    // Placeholder available slots
    const availableSlots = [
      { time: '09:00', available: true },
      { time: '10:00', available: false },
      { time: '11:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: true },
      { time: '16:00', available: false }
    ];

    res.json({
      success: true,
      data: {
        coachId: parseInt(coachId),
        date: date,
        slots: availableSlots
      }
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch trống'
    });
  }
};
