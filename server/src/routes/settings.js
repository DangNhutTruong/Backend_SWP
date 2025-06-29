import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserSettings,
  updateUserSettings,
  changePassword,
  updatePrivacySettings,
  updateNotificationSettings,
  getAppSettings
} from '../controllers/settingsController.js';

const router = express.Router();

// GET /api/settings/app (public)
router.get('/app', getAppSettings);

// All other settings routes require authentication
router.use(authenticate);

// GET /api/settings/user
router.get('/user', getUserSettings);

// PUT /api/settings/user
router.put('/user', updateUserSettings);

// PUT /api/settings/password
router.put('/password', changePassword);

// PUT /api/settings/privacy
router.put('/privacy', updatePrivacySettings);

// PUT /api/settings/notifications
router.put('/notifications', updateNotificationSettings);

export default router;
