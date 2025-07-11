import express from 'express';
import membershipController from '../controllers/membershipController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes cho membership
router.get('/plans', membershipController.getPlans);
router.get('/subscription', authMiddleware, membershipController.getUserSubscription);
router.post('/subscribe', authMiddleware, membershipController.createSubscription);
router.get('/feature/:feature', authMiddleware, membershipController.checkFeatureAccess);
router.post('/cancel', authMiddleware, membershipController.cancelSubscription);
router.get('/payment-history', authMiddleware, membershipController.getPaymentHistory);

export default router;
