import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getUserDashboard,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  getUserSmokingStatus,
  updateUserSmokingStatus,
  deleteUserAccount
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer config for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.UserID}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Tất cả routes đều cần authentication
router.use(protect);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// User smoking status routes
router.get('/smoking-status', getUserSmokingStatus);
router.put('/smoking-status', updateUserSmokingStatus);

// Delete account
router.delete('/account', deleteUserAccount);

// Admin routes - cần quyền Admin
router.get('/', authorize('Admin'), getAllUsers);
router.get('/stats', authorize('Admin'), getUserStats);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

// User routes - tất cả users đã đăng nhập
router.get('/dashboard', getUserDashboard);
router.get('/:id', getUserById);

export default router;
