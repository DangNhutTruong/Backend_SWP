import User from '../models/User.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// @desc    Lấy danh sách tất cả users
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    // Tạo điều kiện tìm kiếm
    const whereCondition = { IsActive: true };

    if (role) {
      whereCondition.RoleName = role;
    }

    if (search) {
      whereCondition[Op.or] = [
        { Name: { [Op.like]: `%${search}%` } },
        { Email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Lấy danh sách users với phân trang
    const { count, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['CreatedAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: users.map(user => user.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách users'
    });
  }
};

// @desc    Lấy thông tin user theo ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        UserID: id,
        IsActive: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user'
    });
  }
};

// @desc    Cập nhật thông tin user (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedUpdates = [
      'Name',
      'Age',
      'Gender',
      'Phone',
      'Address',
      'RoleName',
      'Membership',
      'IsActive'
    ];

    // Lọc chỉ những field được phép update
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    // Cập nhật user
    const [updatedRowsCount] = await User.update(updates, {
      where: { UserID: id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findOne({
      where: { UserID: id }
    });

    res.json({
      success: true,
      message: 'Cập nhật user thành công',
      data: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật user'
    });
  }
};

// @desc    Xóa user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { UserID: id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Soft delete
    user.IsActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Xóa user thành công'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa user'
    });
  }
};

// @desc    Lấy thống kê users
// @route   GET /api/users/stats
// @access  Private (Admin)
export const getUserStats = async (req, res) => {
  try {
    // Tổng số users
    const totalUsers = await User.count({
      where: { IsActive: true }
    });

    // Users theo membership
    const membershipStats = await User.findAll({
      attributes: [
        'Membership',
        [sequelize.fn('COUNT', sequelize.col('UserID')), 'count']
      ],
      where: { IsActive: true },
      group: ['Membership'],
      raw: true
    });

    // Users theo role
    const roleStats = await User.findAll({
      attributes: [
        'RoleName',
        [sequelize.fn('COUNT', sequelize.col('UserID')), 'count']
      ],
      where: { IsActive: true },
      group: ['RoleName'],
      raw: true
    });

    // Users đăng ký trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await User.count({
      where: {
        IsActive: true,
        CreatedAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsersLast30Days,
        membershipStats: membershipStats.map(stat => ({
          membership: stat.Membership,
          count: parseInt(stat.count)
        })),
        roleStats: roleStats.map(stat => ({
          role: stat.RoleName,
          count: parseInt(stat.count)
        }))
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê users'
    });
  }
};

// @desc    Lấy thông tin dashboard của user
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Tính toán thông tin dashboard
    const now = new Date();
    let daysSinceStart = 0;
    let moneySaved = 0;
    let cigarettesNotSmoked = 0;

    if (user.StartDate) {
      daysSinceStart = Math.floor((now - new Date(user.StartDate)) / (1000 * 60 * 60 * 24));
      moneySaved = user.calculateMoneySaved();
      
      if (user.CigarettesPerDay) {
        cigarettesNotSmoked = user.CigarettesPerDay * daysSinceStart;
      }
    }
    
    // Tính thời gian sống thêm (ước tính)
    const minutesLivedLonger = cigarettesNotSmoked * 11; // Mỗi điều thuốc = 11 phút
    const hoursLivedLonger = Math.floor(minutesLivedLonger / 60);
    const daysLivedLonger = Math.floor(hoursLivedLonger / 24);

    const dashboardData = {
      user: user.toJSON(),
      stats: {
        daysSinceStart,
        currentStreak: user.DaysWithoutSmoking || 0,
        moneySaved,
        cigarettesNotSmoked,
        timeLivedLonger: {
          minutes: minutesLivedLonger,
          hours: hoursLivedLonger,
          days: daysLivedLonger
        }
      },
      membership: {
        type: user.Membership,
        isActive: user.IsActive
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin dashboard'
    });
  }
};
