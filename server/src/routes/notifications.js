import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications
router.get('/', getNotifications);

// POST /api/notifications
router.post('/', createNotification);

// PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

// GET /api/notifications/settings
router.get('/settings', getNotificationSettings);

// PUT /api/notifications/settings
router.put('/settings', updateNotificationSettings);

export default router;
