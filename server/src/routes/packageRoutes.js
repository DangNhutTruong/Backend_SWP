import express from 'express';
import PackageController from '../controllers/packageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes - không cần authentication
/**
 * @route   GET /api/packages
 * @desc    Lấy danh sách tất cả packages
 * @access  Public
 */
router.get('/', PackageController.getAll);

/**
 * @route   GET /api/packages/:id
 * @desc    Lấy chi tiết 1 package theo ID
 * @access  Public
 */
router.get('/:id', PackageController.getById);

// Protected routes - cần authentication
/**
 * @route   POST /api/packages/purchase
 * @desc    Mua package (tạo payment record + QR code)
 * @access  Private
 * @body    { package_id: number }
 */
router.post('/purchase', authenticateToken, PackageController.purchase);

/**
 * @route   GET /api/packages/user/current
 * @desc    Lấy membership hiện tại của user
 * @access  Private
 */
router.get('/user/current', authenticateToken, PackageController.getUserCurrent);

/**
 * @route   GET /api/packages/user/history
 * @desc    Lấy lịch sử mua package của user
 * @access  Private
 */
router.get('/user/history', authenticateToken, PackageController.getUserHistory);

export default router;
