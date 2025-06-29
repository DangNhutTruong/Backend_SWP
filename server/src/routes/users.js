import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getUserDashboard
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(protect);

// Admin routes - cần quyền Admin
router.get('/', authorize('Admin'), getAllUsers);
router.get('/stats', authorize('Admin'), getUserStats);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

// User routes - tất cả users đã đăng nhập
router.get('/dashboard', getUserDashboard);
router.get('/:id', getUserById);

export default router;
