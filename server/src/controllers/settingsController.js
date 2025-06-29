import UserSettings from '../models/UserSettings.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get user settings
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.UserID;

    let settings = await UserSettings.findOne({
      where: { UserID: userId }
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await UserSettings.create({
        UserID: userId
      });
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy cài đặt người dùng'
    });
  }
};

// Update user settings
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const updateData = req.body;

    let settings = await UserSettings.findOne({
      where: { UserID: userId }
    });

    if (!settings) {
      settings = await UserSettings.create({
        UserID: userId,
        ...updateData
      });
    } else {
      await settings.update(updateData);
    }

    res.json({
      success: true,
      data: settings,
      message: 'Cập nhật cài đặt thành công'
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật cài đặt'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.Password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({
      Password: hashedNewPassword
    });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đổi mật khẩu'
    });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { privacyProfile, privacyProgress, privacyAchievements, dataRetention } = req.body;

    let settings = await UserSettings.findOne({
      where: { UserID: userId }
    });

    if (!settings) {
      settings = await UserSettings.create({
        UserID: userId
      });
    }

    const updateData = {};
    if (privacyProfile !== undefined) updateData.PrivacyProfile = privacyProfile;
    if (privacyProgress !== undefined) updateData.PrivacyProgress = privacyProgress;
    if (privacyAchievements !== undefined) updateData.PrivacyAchievements = privacyAchievements;
    if (dataRetention !== undefined) updateData.DataRetention = dataRetention;

    await settings.update(updateData);

    res.json({
      success: true,
      data: settings,
      message: 'Cập nhật cài đặt riêng tư thành công'
    });

  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật cài đặt riêng tư'
    });
  }
};

// Update notification settings (references NotificationSettings)
export const updateNotificationSettings = async (req, res) => {
  try {
    // This is handled by the notification controller
    // Redirect to notification settings endpoint
    res.json({
      success: false,
      message: 'Vui lòng sử dụng endpoint /api/notifications/settings'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật cài đặt thông báo'
    });
  }
};

// Get app settings (global settings)
export const getAppSettings = async (req, res) => {
  try {
    const appSettings = {
      version: '1.0.0',
      features: {
        payments: true,
        notifications: true,
        chat: true,
        appointments: true,
        community: true,
        achievements: true
      },
      supportedLanguages: ['vi', 'en'],
      supportedCurrencies: ['VND', 'USD'],
      supportedThemes: ['light', 'dark', 'auto'],
      privacyOptions: ['public', 'friends', 'private'],
      contactInfo: {
        support: 'support@nosmoke.com',
        phone: '+84 123 456 789'
      },
      termsOfService: 'https://nosmoke.com/terms',
      privacyPolicy: 'https://nosmoke.com/privacy'
    };

    res.json({
      success: true,
      data: appSettings
    });

  } catch (error) {
    console.error('Error getting app settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy cài đặt ứng dụng'
    });
  }
};
