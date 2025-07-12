import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - cần authentication
/**
 * @route   POST /api/payments/create
 * @desc    Tạo payment record mới
 * @access  Private
 * @body    { package_id: number, method?: string }
 */
router.post('/create', authenticateToken, PaymentController.create);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment với MBBank API
 * @access  Private
 * @body    { payment_id?: number, tx_content?: string }
 */
router.post('/verify', authenticateToken, PaymentController.verify);

/**
 * @route   POST /api/payments/verify/external
 * @desc    Verify payment từ MBBank script (không cần auth)
 * @access  Public
 * @body    { tx_content: string, amount: number, transaction_id?: string }
 */
router.post('/verify/external', PaymentController.verifyExternal);

/**
 * @route   GET /api/payments/admin/pending
 * @desc    Lấy danh sách payments đang pending (Admin only)
 * @access  Admin
 */
router.get('/admin/pending', authenticateToken, PaymentController.getPendingPayments);

/**
 * @route   GET /api/payments/user/history
 * @desc    Lấy lịch sử payments của user
 * @access  Private
 * @query   { status?: string, limit?: number, offset?: number }
 */
router.get('/user/history', authenticateToken, PaymentController.getUserHistory);

/**
 * @route   GET /api/payments/:id
 * @desc    Lấy chi tiết 1 payment
 * @access  Private
 */
router.get('/:id', authenticateToken, PaymentController.getById);

/**
 * @route   GET /api/payments/:id/status
 * @desc    Lấy trạng thái payment (dành cho polling)
 * @access  Private
 */
router.get('/:id/status', authenticateToken, PaymentController.getStatus);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Hoàn tiền payment
 * @access  Private
 * @body    { reason?: string }
 */
router.post('/:id/refund', authenticateToken, PaymentController.refund);

export default router;
