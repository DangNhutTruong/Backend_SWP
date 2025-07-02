import { Notification, User, UserSettings } from '../models/index.js';
import { Op } from 'sequelize';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 20, is_read, type } = req.query;

    const whereClause = { user_id };
    if (is_read !== undefined) {
      whereClause.is_read = is_read === 'true';
    }
    if (type) {
      whereClause.type = type;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications.rows,
      pagination: {
        total: notifications.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(notifications.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    // Check if target user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = await Notification.create({
      user_id,
      title,
      message,
      type: type || 'info'
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;

    await Notification.update(
      { 
        is_read: true, 
        read_at: new Date() 
      },
      { 
        where: { 
          user_id, 
          is_read: false 
        } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/notifications/settings
export const getNotificationSettings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const settings = await UserSettings.findOne({
      where: { user_id }
    });

    if (!settings) {
      // Return default settings if not found
      return res.json({
        success: true,
        data: {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        sms_notifications: settings.sms_notifications
      }
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// PUT /api/notifications/settings
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
      // Update existing settings
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
