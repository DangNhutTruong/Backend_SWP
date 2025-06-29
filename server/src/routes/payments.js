import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createPayment,
  verifyPayment,
  getUserPaymentHistory,
  getPaymentById,
  requestRefund
} from '../controllers/paymentController.js';

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// POST /api/payments/create
router.post('/create', createPayment);

// POST /api/payments/verify  
router.post('/verify', verifyPayment);

// GET /api/payments/user/history
router.get('/user/history', getUserPaymentHistory);

// GET /api/payments/:id
router.get('/:id', getPaymentById);

// POST /api/payments/:id/refund
router.post('/:id/refund', requestRefund);

export default router;
