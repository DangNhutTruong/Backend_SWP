import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  getMembershipStats, 
  getRevenueByMonth, 
  getPaymentAnalytics,
  getUsersWithMembership,
  getExpiringUsers,
  extendMembership,
  upgradeMembership,
  cancelMembership,
  sendExpiryNotifications,
  generateReport,
  getPackages,
  getPayments,
  getAnalytics
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Analytics endpoints
router.get('/analytics/membership-stats', getMembershipStats);
router.get('/analytics/revenue-by-month', getRevenueByMonth);
router.get('/analytics/payment-analytics', getPaymentAnalytics);

// Package management endpoints
router.get('/packages', getPackages);

// Payment management endpoints
router.get('/payments', getPayments);

// Analytics endpoints
router.get('/analytics', getAnalytics);

// User management endpoints
router.get('/users/with-membership', getUsersWithMembership);
router.get('/users/expiring', getExpiringUsers);
router.post('/users/:userId/extend-membership', extendMembership);
router.post('/users/:userId/upgrade-membership', upgradeMembership);
router.post('/users/:userId/cancel-membership', cancelMembership);

// Notification endpoints
router.post('/notifications/send-expiry-alerts', sendExpiryNotifications);

// Report endpoints
router.post('/reports/:reportType/generate', generateReport);

export default router;
