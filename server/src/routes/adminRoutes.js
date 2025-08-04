import express from 'express';
import { pool } from '../config/database.js';
import { 
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
    // User management functions
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
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
    getAnalytics,
    getMetrics,
    getProgressData,
    getRecentActivities,
    getPaymentStatistics,
    getAchievements
} from '../controllers/adminController.js';

// Import all blog CRUD functions from blogController
import { 
    getBlogPosts,
    getBlogPost,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    bulkDeletePosts
} from '../controllers/blogController.js';

// Import blog analytics from adminController
import { getBlogAnalytics } from '../controllers/adminController.js';

import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public endpoints for testing
router.get('/achievements', getAchievements);
router.get('/metrics', getMetrics);

// Debug endpoint for blog count
router.get('/debug/blog-count', async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM blog_post');
    res.json({
      success: true,
      totalBlogPosts: result[0].count,
      message: 'Direct blog count from database'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Blog test endpoint (no auth for testing)
router.get('/blog/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Blog routes working',
    data: {
      totalPosts: 5,
      publishedPosts: 3,
      draftPosts: 2
    }
  });
});

// Protect all other routes with authentication and admin role check
router.use(requireAuth, requireAdmin);

// User management routes (specific routes first, then parameterized routes)
router.get('/users/with-membership', getUsersWithMembership);
router.get('/users/expiring', getExpiringUsers);
router.get('/users/premium', getPremiumUsers);
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

// Appointment statistics
router.get('/appointments/stats', getAppointmentStats);

// ============= ANALYTICS & MEMBERSHIP ROUTES (from admin.js) =============

// Analytics endpoints
router.get('/analytics', getAnalytics);
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
router.get('/payments/stats', getPaymentStatistics);
router.get('/payments/analytics', getPaymentAnalytics);

// Additional analytics routes for frontend compatibility
router.get('/membership-distribution', getMembershipStats);
router.get('/recent-activities', getRecentActivities);
router.get('/progress', getProgressData);  
router.get('/monthly-growth', getRevenueByMonth);

// Membership management endpoints
router.post('/users/:userId/extend-membership', extendMembership);
router.post('/users/:userId/upgrade-membership', upgradeMembership);
router.post('/users/:userId/cancel-membership', cancelMembership);

// Notification endpoints
router.post('/notifications/send-expiry-alerts', sendExpiryNotifications);

// Report endpoints
router.post('/reports/:reportType/generate', generateReport);

// ============= BLOG MANAGEMENT ROUTES =============
// Test blog route (no auth required for testing)
router.get('/blog/test', async (req, res) => {
  try {
    // Test if blog_post table exists and has data
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM blog_post');
    res.json({
      success: true,
      message: 'Blog table accessible',
      count: result[0].count
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Blog table error',
      error: error.message
    });
  }
});

// Get blog analytics
router.get('/blog/analytics', getBlogAnalytics);

// Get all blog posts with pagination and search
router.get('/blog/posts', getBlogPosts);

// Get single blog post by ID
router.get('/blog/posts/:id', getBlogPost);

// Create new blog post
router.post('/blog/posts', createBlogPost);

// Update blog post
router.put('/blog/posts/:id', updateBlogPost);

// Delete single blog post
router.delete('/blog/posts/:id', deleteBlogPost);

// Bulk delete blog posts
router.delete('/blog/posts', bulkDeletePosts);

// Test route for debugging (remove in production)
router.get('/test-users', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT COUNT(*) as count FROM users LIMIT 1'
    );
    
    res.json({
      success: true,
      message: 'Users API is working',
      userCount: users[0].count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

export default router;