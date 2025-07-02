import express from 'express';
import { 
  getUserSettings,
  updateUserSettings,
  updatePassword,
  updatePrivacySettings,
  updateNotificationSettings,
  getAppSettings
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All settings routes require authentication
router.use(authenticate);

// GET /api/settings/user
router.get('/user', getUserSettings);

// PUT /api/settings/user
router.put('/user', updateUserSettings);

// PUT /api/settings/password
router.put('/password', updatePassword);

// PUT /api/settings/privacy
router.put('/privacy', updatePrivacySettings);

// PUT /api/settings/notifications
router.put('/notifications', updateNotificationSettings);

// GET /api/settings/app
router.get('/app', getAppSettings);

export default router;
