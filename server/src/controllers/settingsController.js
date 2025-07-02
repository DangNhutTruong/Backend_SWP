import { User, UserSettings } from '../models/index.js';
import { hashPassword, comparePassword } from '../middleware/auth.js';

// GET /api/settings/user
export const getUserSettings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const user = await User.findByPk(user_id, {
      include: [
        { model: UserSettings, as: 'settings' }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          gender: user.gender,
          date_of_birth: user.date_of_birth,
          avatar_url: user.avatar_url,
          role: user.role
        },
        settings: user.settings || {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          privacy_level: 'public',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          theme: 'light'
        }
      }
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/settings/user
export const updateUserSettings = async (req, res) => {
  try {
    const user_id = req.user.id;
    const {
      email_notifications,
      push_notifications,
      sms_notifications,
      privacy_level,
      language,
      timezone,
      theme
    } = req.body;

    const [settings, created] = await UserSettings.findOrCreate({
      where: { user_id },
      defaults: {
        user_id,
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? true,
        sms_notifications: sms_notifications ?? false,
        privacy_level: privacy_level || 'public',
        language: language || 'vi',
        timezone: timezone || 'Asia/Ho_Chi_Minh',
        theme: theme || 'light'
      }
    });

    if (!created) {
      // Update existing settings
      if (email_notifications !== undefined) settings.email_notifications = email_notifications;
      if (push_notifications !== undefined) settings.push_notifications = push_notifications;
      if (sms_notifications !== undefined) settings.sms_notifications = sms_notifications;
      if (privacy_level) settings.privacy_level = privacy_level;
      if (language) settings.language = language;
      if (timezone) settings.timezone = timezone;
      if (theme) settings.theme = theme;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/settings/password
export const updatePassword = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const new_password_hash = await hashPassword(new_password);

    // Update password
    user.password_hash = new_password_hash;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/settings/privacy
export const updatePrivacySettings = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { privacy_level } = req.body;

    if (!['public', 'friends', 'private'].includes(privacy_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid privacy level'
      });
    }

    const [settings, created] = await UserSettings.findOrCreate({
      where: { user_id },
      defaults: {
        user_id,
        privacy_level
      }
    });

    if (!created) {
      settings.privacy_level = privacy_level;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: { privacy_level: settings.privacy_level }
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/settings/notifications
export const updateNotificationSettings = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { email_notifications, push_notifications, sms_notifications } = req.body;

    const [settings, created] = await UserSettings.findOrCreate({
      where: { user_id },
      defaults: {
        user_id,
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? true,
        sms_notifications: sms_notifications ?? false
      }
    });

    if (!created) {
      if (email_notifications !== undefined) settings.email_notifications = email_notifications;
      if (push_notifications !== undefined) settings.push_notifications = push_notifications;
      if (sms_notifications !== undefined) settings.sms_notifications = sms_notifications;
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        sms_notifications: settings.sms_notifications
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/settings/app
export const getAppSettings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const settings = await UserSettings.findOne({
      where: { user_id }
    });

    const appSettings = {
      language: settings?.language || 'vi',
      timezone: settings?.timezone || 'Asia/Ho_Chi_Minh',
      theme: settings?.theme || 'light',
      privacy_level: settings?.privacy_level || 'public'
    };

    res.json({
      success: true,
      data: appSettings
    });
  } catch (error) {
    console.error('Get app settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
