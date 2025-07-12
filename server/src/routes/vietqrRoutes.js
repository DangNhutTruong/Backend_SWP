import express from 'express';
import VietQRController from '../controllers/vietqrController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/vietqr/generate
 * @desc    Test QR code generation
 * @access  Private
 * @body    { bankCode?, accountNumber?, amount?, content?, template? }
 */
router.post('/generate', authenticateToken, VietQRController.generateTestQR);

/**
 * @route   GET /api/vietqr/banks
 * @desc    Get supported banks list
 * @access  Public
 */
router.get('/banks', VietQRController.getSupportedBanks);

/**
 * @route   POST /api/vietqr/validate-content
 * @desc    Validate payment content format
 * @access  Public
 * @body    { content: string }
 */
router.post('/validate-content', VietQRController.validateContent);

export default router;
