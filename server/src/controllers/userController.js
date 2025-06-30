import { User } from '../models/index.js';
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

// @desc    Lấy profile của user hiện tại
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile'
    });
  }
};

// @desc    Cập nhật profile của user hiện tại
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = req.user;
    const { 
      Name, 
      Age, 
      Gender, 
      Phone, 
      Address,
      CigarettesPerDay,
      CostPerPack,
      CigarettesPerPack
    } = req.body;

    // Cập nhật thông tin
    const updateData = {};
    if (Name) updateData.Name = Name.trim();
    if (Age) updateData.Age = parseInt(Age);
    if (Gender) updateData.Gender = Gender;
    if (Phone) updateData.Phone = Phone;
    if (Address) updateData.Address = Address;
    if (CigarettesPerDay !== undefined) updateData.CigarettesPerDay = parseInt(CigarettesPerDay);
    if (CostPerPack !== undefined) updateData.CostPerPack = parseFloat(CostPerPack);
    if (CigarettesPerPack !== undefined) updateData.CigarettesPerPack = parseInt(CigarettesPerPack);

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật profile'
    });
  }
};

// @desc    Upload avatar của user
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    const user = req.user;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    await user.update({ AvatarUrl: avatarUrl });

    res.json({
      success: true,
      message: 'Upload avatar thành công',
      data: {
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload avatar'
    });
  }
};

// @desc    Lấy thông tin smoking status của user
// @route   GET /api/users/smoking-status
// @access  Private
export const getUserSmokingStatus = async (req, res) => {
  try {
    const user = req.user;
    
    const smokingStatus = {
      startDate: user.StartDate,
      daysWithoutSmoking: user.DaysWithoutSmoking,
      cigarettesPerDay: user.CigarettesPerDay,
      costPerPack: user.CostPerPack,
      cigarettesPerPack: user.CigarettesPerPack,
      moneySaved: user.MoneySaved,
      isActive: user.IsActive
    };

    res.json({
      success: true,
      data: smokingStatus
    });

  } catch (error) {
    console.error('Get smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin smoking status'
    });
  }
};

// @desc    Cập nhật smoking status của user
// @route   PUT /api/users/smoking-status
// @access  Private
export const updateUserSmokingStatus = async (req, res) => {
  try {
    const user = req.user;
    const { 
      cigarettesPerDay, 
      costPerPack, 
      cigarettesPerPack,
      startDate 
    } = req.body;

    const updateData = {};
    
    if (cigarettesPerDay !== undefined) {
      updateData.CigarettesPerDay = parseInt(cigarettesPerDay);
    }
    
    if (costPerPack !== undefined) {
      updateData.CostPerPack = parseFloat(costPerPack);
    }
    
    if (cigarettesPerPack !== undefined) {
      updateData.CigarettesPerPack = parseInt(cigarettesPerPack);
    }
    
    if (startDate) {
      updateData.StartDate = new Date(startDate);
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật smoking status thành công',
      data: {
        startDate: user.StartDate,
        daysWithoutSmoking: user.DaysWithoutSmoking,
        cigarettesPerDay: user.CigarettesPerDay,
        costPerPack: user.CostPerPack,
        cigarettesPerPack: user.CigarettesPerPack,
        moneySaved: user.MoneySaved
      }
    });

  } catch (error) {
    console.error('Update smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật smoking status'
    });
  }
};

// @desc    Xóa tài khoản user
// @route   DELETE /api/users/account
// @access  Private
export const deleteUserAccount = async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;

    // Kiểm tra password xác nhận
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    // Soft delete - set IsActive = false
    await user.update({ 
      IsActive: false,
      DeletedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });

  } catch (error) {
    console.error('Delete user account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tài khoản'
    });
  }
};
