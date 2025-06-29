import Notification from '../models/Notification.js';
import NotificationSettings from '../models/NotificationSettings.js';
import User from '../models/User.js';

// Get all notifications for user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { page = 1, limit = 20, type, unreadOnly } = req.query;

    const offset = (page - 1) * limit;
    let whereCondition = { UserID: userId };

    if (type) {
      whereCondition.Type = type;
    }

    if (unreadOnly === 'true') {
      whereCondition.IsRead = false;
    }

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereCondition,
      order: [['CreatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông báo'
    });
  }
};

// Create notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, actionUrl, data, userIds } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, message'
      });
    }

    const notifications = [];

    // If userIds is provided, create notifications for specific users
    if (userIds && Array.isArray(userIds)) {
      for (const userId of userIds) {
        const notification = await Notification.create({
          UserID: userId,
          Title: title,
          Message: message,
          Type: type || 'info',
          ActionUrl: actionUrl || null,
          Data: data || null
        });
        notifications.push(notification);
      }
    } else {
      // Create notification for the requesting user
      const notification = await Notification.create({
        UserID: req.user.UserID,
        Title: title,
        Message: message,
        Type: type || 'info',
        ActionUrl: actionUrl || null,
        Data: data || null
      });
      notifications.push(notification);
    }

    res.status(201).json({
      success: true,
      data: notifications,
      message: 'Tạo thông báo thành công'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo thông báo'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const notification = await Notification.findOne({
      where: {
        NotificationID: id,
        UserID: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    await notification.update({
      IsRead: true,
      ReadAt: new Date()
    });

    res.json({
      success: true,
      data: notification,
      message: 'Đánh dấu đã đọc thành công'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đánh dấu đã đọc'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.UserID;

    await Notification.update(
      { 
        IsRead: true,
        ReadAt: new Date()
      },
      { 
        where: { 
          UserID: userId,
          IsRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Đánh dấu tất cả thông báo đã đọc thành công'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đánh dấu tất cả đã đọc'
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const notification = await Notification.findOne({
      where: {
        NotificationID: id,
        UserID: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Xóa thông báo thành công'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa thông báo'
    });
  }
};

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.UserID;

    let settings = await NotificationSettings.findOne({
      where: { UserID: userId }
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await NotificationSettings.create({
        UserID: userId
      });
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy cài đặt thông báo'
    });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const updateData = req.body;

    let settings = await NotificationSettings.findOne({
      where: { UserID: userId }
    });

    if (!settings) {
      settings = await NotificationSettings.create({
        UserID: userId,
        ...updateData
      });
    } else {
      await settings.update(updateData);
    }

    res.json({
      success: true,
      data: settings,
      message: 'Cập nhật cài đặt thông báo thành công'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật cài đặt thông báo'
    });
  }
};
