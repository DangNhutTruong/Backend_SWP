import express from 'express';
import { 
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getCoachStats, 
    getAppointmentStats, 
    getAllCoachesDetails, 
    updateCoach,
    createCoach,
    updateCoachAvailability,
    getCoachAssignments,
    createCoachAssignment,
    deleteCoachAssignment,
    getPremiumUsers,
    getCoachSessionHistory,
    // Analytics and membership functions from admin.js
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
    createPackage,
    updatePackage,
    deletePackage,
    getPayments,
    getAnalytics
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication and admin role check
router.use(requireAuth, requireAdmin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Coach management
router.get('/coaches/stats', getCoachStats);
router.get('/coaches', getAllCoachesDetails);
router.post('/coaches', createCoach);
router.put('/coaches/:id', updateCoach);
router.put('/coaches/:id/availability', updateCoachAvailability);
router.get('/coaches/:id/sessions', getCoachSessionHistory);

// Coach assignments
router.get('/coach-assignments', getCoachAssignments);
router.post('/coach-assignments', createCoachAssignment);
router.delete('/coach-assignments/:id', deleteCoachAssignment);

// User management
router.get('/users/premium', getPremiumUsers);

// Appointment statistics
router.get('/appointments/stats', getAppointmentStats);

// ============= ANALYTICS & MEMBERSHIP ROUTES (from admin.js) =============

// Analytics endpoints
router.get('/analytics/membership-stats', getMembershipStats);
router.get('/analytics/revenue-by-month', getRevenueByMonth);
router.get('/analytics/payment-analytics', getPaymentAnalytics);

// Package management endpoints
router.get('/packages', getPackages);
router.post('/packages', createPackage);
router.put('/packages/:packageId', updatePackage);
router.delete('/packages/:packageId', deletePackage);

// Payment management endpoints
router.get('/payments', getPayments);
router.get('/payments/stats', getPaymentAnalytics);

// Analytics endpoints
router.get('/analytics', getAnalytics);
router.get('/membership-distribution', getMembershipStats);
router.get('/recent-activities', getAnalytics); // Uses same endpoint but different data
router.get('/progress', getAnalytics); // Uses same endpoint but different data
router.get('/monthly-growth', getRevenueByMonth);

// User management endpoints (membership-related)
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
