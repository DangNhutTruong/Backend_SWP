import { User, SmokingStatus } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    const { full_name, phone, gender, date_of_birth } = req.body;

    // Update fields if provided
    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật profile'
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Handle file upload (placeholder)
    const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    if (avatarUrl) {
      user.avatar_url = avatarUrl;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Upload avatar thành công',
      data: {
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi upload avatar'
    });
  }
};

// @desc    Get user smoking status
// @route   GET /api/users/smoking-status
// @access  Private
export const getUserSmokingStatus = async (req, res) => {
  try {
    const smokingStatus = await SmokingStatus.findAll({
      where: { smoker_id: req.user.id },
      order: [['recorded_at', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: smokingStatus
    });

  } catch (error) {
    console.error('Get smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy trạng thái hút thuốc'
    });
  }
};

// @desc    Update user smoking status
// @route   PUT /api/users/smoking-status
// @access  Private
export const updateUserSmokingStatus = async (req, res) => {
  try {
    const { status, cigarettes_per_day } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái hút thuốc'
      });
    }

    const smokingStatus = await SmokingStatus.create({
      smoker_id: req.user.id,
      status,
      cigarettes_per_day
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái hút thuốc thành công',
      data: smokingStatus
    });

  } catch (error) {
    console.error('Update smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái hút thuốc'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa tài khoản'
    });
  }
};
