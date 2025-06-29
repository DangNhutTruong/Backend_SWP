import User from '../models/User.js';
import { Op } from 'sequelize';

// Get all coaches
export const getAllCoaches = async (req, res) => {
  try {
    const { page = 1, limit = 10, specialization, experience, rating } = req.query;

    let whereCondition = {
      RoleID: 2, // Coach role
      [Op.or]: [
        { RoleName: 'Coach' },
        { RoleName: 'coach' }
      ]
    };

    // Apply filters
    if (specialization) {
      whereCondition.Specialization = {
        [Op.like]: `%${specialization}%`
      };
    }

    if (experience) {
      whereCondition.Experience = {
        [Op.gte]: parseInt(experience)
      };
    }

    if (rating) {
      whereCondition.Rating = {
        [Op.gte]: parseFloat(rating)
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: coaches } = await User.findAndCountAll({
      where: whereCondition,
      attributes: {
        exclude: ['Password'] // Exclude sensitive data
      },
      limit: parseInt(limit),
      offset: offset,
      order: [['Rating', 'DESC'], ['Experience', 'DESC']]
    });

    res.json({
      success: true,
      data: coaches,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách coach'
    });
  }
};

// Get coach by ID
export const getCoachById = async (req, res) => {
  try {
    const { id } = req.params;

    const coach = await User.findOne({
      where: {
        UserID: id,
        RoleID: 2
      },
      attributes: {
        exclude: ['Password']
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    res.json({
      success: true,
      data: coach
    });

  } catch (error) {
    console.error('Error getting coach by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin coach'
    });
  }
};

// Update coach profile (only coach can update their own profile)
export const updateCoachProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.RoleID;

    // Check if user can update this coach profile
    if (userRole !== 1 && userId !== parseInt(id)) { // Not admin and not the coach themselves
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông tin coach này'
      });
    }

    const {
      name,
      email,
      phone,
      address,
      specialization,
      experience,
      bio,
      certifications,
      hourlyRate,
      availableHours
    } = req.body;

    const coach = await User.findOne({
      where: {
        UserID: id,
        RoleID: 2
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.Name = name;
    if (email !== undefined) updateData.Email = email;
    if (phone !== undefined) updateData.Phone = phone;
    if (address !== undefined) updateData.Address = address;
    if (specialization !== undefined) updateData.Specialization = specialization;
    if (experience !== undefined) updateData.Experience = parseInt(experience);
    if (bio !== undefined) updateData.Bio = bio;
    if (certifications !== undefined) updateData.Certifications = JSON.stringify(certifications);
    if (hourlyRate !== undefined) updateData.HourlyRate = parseFloat(hourlyRate);
    if (availableHours !== undefined) updateData.AvailableHours = JSON.stringify(availableHours);

    await coach.update(updateData);

    // Return updated coach without password
    const updatedCoach = await User.findByPk(id, {
      attributes: {
        exclude: ['Password']
      }
    });

    res.json({
      success: true,
      data: updatedCoach,
      message: 'Cập nhật thông tin coach thành công'
    });

  } catch (error) {
    console.error('Error updating coach profile:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật thông tin coach'
    });
  }
};

// Get coach availability
export const getCoachAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const coach = await User.findOne({
      where: {
        UserID: id,
        RoleID: 2
      },
      attributes: ['UserID', 'Name', 'AvailableHours']
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    // Parse available hours
    let availableHours = [];
    if (coach.AvailableHours) {
      try {
        availableHours = typeof coach.AvailableHours === 'string' 
          ? JSON.parse(coach.AvailableHours) 
          : coach.AvailableHours;
      } catch (e) {
        availableHours = [];
      }
    }

    // If specific date requested, filter by that date
    if (date) {
      const requestedDate = new Date(date);
      const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      const dayAvailability = availableHours.find(ah => ah.day === dayName);
      
      res.json({
        success: true,
        data: {
          coachId: coach.UserID,
          coachName: coach.Name,
          date: date,
          dayOfWeek: dayName,
          availability: dayAvailability || { day: dayName, slots: [] }
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          coachId: coach.UserID,
          coachName: coach.Name,
          weeklyAvailability: availableHours
        }
      });
    }

  } catch (error) {
    console.error('Error getting coach availability:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch rảnh của coach'
    });
  }
};

// Update coach availability
export const updateCoachAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.RoleID;
    const { availableHours } = req.body;

    // Check if user can update this coach's availability
    if (userRole !== 1 && userId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật lịch rảnh của coach này'
      });
    }

    const coach = await User.findOne({
      where: {
        UserID: id,
        RoleID: 2
      }
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    await coach.update({
      AvailableHours: JSON.stringify(availableHours)
    });

    res.json({
      success: true,
      data: {
        coachId: coach.UserID,
        availableHours: availableHours
      },
      message: 'Cập nhật lịch rảnh thành công'
    });

  } catch (error) {
    console.error('Error updating coach availability:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật lịch rảnh'
    });
  }
};

// Get coach statistics
export const getCoachStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.RoleID;

    // Check if user can view this coach's stats
    if (userRole !== 1 && userId !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thống kê của coach này'
      });
    }

    const coach = await User.findOne({
      where: {
        UserID: id,
        RoleID: 2
      },
      attributes: ['UserID', 'Name', 'TotalClients', 'Rating', 'ReviewCount', 'CreatedAt']
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy coach'
      });
    }

    // Calculate experience in months
    const joinDate = new Date(coach.CreatedAt);
    const now = new Date();
    const experienceMonths = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24 * 30));

    const stats = {
      coachId: coach.UserID,
      coachName: coach.Name,
      totalClients: coach.TotalClients || 0,
      rating: coach.Rating || 0,
      reviewCount: coach.ReviewCount || 0,
      experienceMonths: experienceMonths,
      joinDate: coach.CreatedAt,
      // Placeholder for additional stats - would need to query related tables
      totalAppointments: 0,
      completedAppointments: 0,
      successRate: 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting coach stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thống kê coach'
    });
  }
};
