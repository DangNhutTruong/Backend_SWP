import { pool } from '../config/database.js';
import { sendResponse } from '../utils/response.js';
import bcrypt from 'bcryptjs';

// Get membership statistics
export const getMembershipStats = async (req, res) => {
  try {
    
    // Query actual data from database
    const [freeUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership = ? OR membership IS NULL',
      ['free']
    );
    
    const [proUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership = ?',
      ['pro']
    );
    
    const [premiumUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership = ?',
      ['premium']
    );
    
    const [totalUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    );

    const stats = {
      userDistribution: {
        free: freeUsers[0].count,
        pro: proUsers[0].count,
        premium: premiumUsers[0].count
      },
      totalUsers: totalUsers[0].count,
      activeSubscriptions: proUsers[0].count + premiumUsers[0].count
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê membership',
      error: error.message
    });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    
    // 1. User distribution by membership type
    const [userDistribution] = await pool.execute(`
      SELECT 
        COALESCE(membership, 'free') as membership_type,
        COUNT(*) as count
      FROM users 
      WHERE is_active = 1
      GROUP BY membership
    `);

    // 2. Revenue by month (last 6 months)
    const [revenueByMonth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as transactions,
        SUM(amount) as revenue
      FROM payments 
      WHERE payment_status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // 3. Payment methods breakdown
    const [paymentMethods] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed'), 1) as percentage
      FROM payments 
      WHERE payment_status = 'completed'
      GROUP BY payment_method
    `);

    // 4. Package popularity
    const [packageStats] = await pool.execute(`
      SELECT 
        pkg.name,
        COUNT(p.id) as purchases,
        SUM(p.amount) as revenue,
        ROUND(COUNT(p.id) * 100.0 / (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed'), 1) as percentage
      FROM payments p
      JOIN packages pkg ON p.package_id = pkg.id
      WHERE p.payment_status = 'completed'
      GROUP BY pkg.id, pkg.name
      ORDER BY purchases DESC
    `);

    // 5. Recent activity (last 30 days)
    const [recentActivity] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // 6. Total revenue and summary stats
    const [revenueStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments
      FROM payments
    `);

    // 7. Growth rate calculation - based on paid memberships
    const [thisMonthPaidUsers] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE membership IN ('pro', 'premium')
        AND is_active = 1
        AND (
          DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
          OR EXISTS (
            SELECT 1 FROM user_memberships um 
            WHERE um.user_id = users.id 
            AND um.status = 'active'
            AND DATE_FORMAT(um.start_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
          )
        )
    `);

    const [lastMonthPaidUsers] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM users
      WHERE membership IN ('pro', 'premium')
        AND is_active = 1
        AND (
          DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
          OR EXISTS (
            SELECT 1 FROM user_memberships um 
            WHERE um.user_id = users.id 
            AND um.status = 'active'
            AND DATE_FORMAT(um.start_date, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')
          )
        )
    `);

    const growthRate = lastMonthPaidUsers[0].count > 0 
      ? ((thisMonthPaidUsers[0].count - lastMonthPaidUsers[0].count) / lastMonthPaidUsers[0].count * 100).toFixed(1)
      : thisMonthPaidUsers[0].count > 0 ? 100 : 0;

    const analytics = {
      userDistribution: userDistribution.reduce((acc, row) => {
        acc[row.membership_type] = row.count;
        return acc;
      }, {}),
      revenueByMonth: revenueByMonth.map(row => ({
        month: row.month,
        transactions: row.transactions,
        revenue: parseFloat(row.revenue)
      })),
      paymentMethods: paymentMethods.map(row => ({
        method: row.payment_method,
        count: row.count,
        amount: parseFloat(row.total_amount),
        percentage: parseFloat(row.percentage)
      })),
      packageStats: packageStats.map(row => ({
        name: row.name,
        purchases: row.purchases,
        revenue: parseFloat(row.revenue),
        percentage: parseFloat(row.percentage)
      })),
      recentActivity: recentActivity.map(row => ({
        date: row.date,
        newUsers: row.new_users
      })),
      summary: {
        totalRevenue: parseFloat(revenueStats[0].total_revenue || 0),
        completedPayments: revenueStats[0].completed_payments,
        pendingPayments: revenueStats[0].pending_payments,
        failedPayments: revenueStats[0].failed_payments,
        growthRate: parseFloat(growthRate)
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu phân tích',
      error: error.message
    });
  }
};

// Get revenue by month
export const getRevenueByMonth = async (req, res) => {
  try {
    
    // Query revenue data from payments table
    const [revenueData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM payments 
      WHERE payment_status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY created_at ASC
    `);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu doanh thu',
      error: error.message
    });
  }
};

// Get users with membership details
export const getUsersWithMembership = async (req, res) => {
  try {
    
    // Query users with their membership details
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership as membership,
        u.created_at as joinDate,
        um.end_date as expiryDate,
        CASE 
          WHEN um.end_date IS NULL THEN 'active'
          WHEN um.end_date < NOW() THEN 'expired'
          WHEN DATEDIFF(um.end_date, NOW()) <= 7 THEN 'expiring'
          ELSE 'active'
        END as status,
        COALESCE(payment_totals.totalPaid, 0) as totalPaid,
        COALESCE(payment_totals.renewalCount, 0) as renewalCount
      FROM users u
      LEFT JOIN user_memberships um ON u.id = um.user_id AND um.status = 'active'
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(amount) as totalPaid,
          COUNT(*) as renewalCount
        FROM payments 
        WHERE payment_status = 'completed'
        GROUP BY user_id
      ) payment_totals ON u.id = payment_totals.user_id
      WHERE u.membership IN ('pro', 'premium')
        AND u.is_active = 1
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users with membership:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// Get expiring users (users whose membership expires within 7 days)
export const getExpiringUsers = async (req, res) => {
  try {
    
    // Query users whose membership expires within 7 days
    const [expiringUsers] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership as membership,
        um.end_date as expiryDate,
        DATEDIFF(um.end_date, NOW()) as daysLeft
      FROM users u
      INNER JOIN user_memberships um ON u.id = um.user_id
      WHERE um.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND u.is_active = 1
        AND um.status = 'active'
        AND u.membership IN ('pro', 'premium')
      ORDER BY um.end_date ASC
    `);

    res.json({
      success: true,
      data: expiringUsers
    });
  } catch (error) {
    console.error('Error fetching expiring users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng sắp hết hạn',
      error: error.message
    });
  }
};

// Extend user membership
export const extendMembership = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.body;

    // Check if user exists and has membership
    const [userCheck] = await pool.execute(
      'SELECT id, membership FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc không hoạt động'
      });
    }

    // Update membership expiry date
    const [membershipCheck] = await pool.execute(
      'SELECT * FROM user_memberships WHERE user_id = ? AND status = "active"',
      [userId]
    );

    if (membershipCheck.length === 0) {
      // Create new membership record
      await pool.execute(
        'INSERT INTO user_memberships (user_id, package_id, start_date, end_date, status) VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), "active")',
        [userId, days]
      );
    } else {
      // Extend existing membership
      await pool.execute(
        'UPDATE user_memberships SET end_date = DATE_ADD(COALESCE(end_date, NOW()), INTERVAL ? DAY), updated_at = NOW() WHERE user_id = ? AND status = "active"',
        [days, userId]
      );
    }

    // Get new expiry date
    const [newExpiry] = await pool.execute(
      'SELECT end_date FROM user_memberships WHERE user_id = ? AND status = "active"',
      [userId]
    );

    res.json({
      success: true,
      message: `Đã gia hạn membership ${days} ngày cho người dùng`,
      data: {
        userId,
        extendedDays: days,
        newExpiryDate: newExpiry[0]?.end_date
      }
    });
  } catch (error) {
    console.error('Error extending membership:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gia hạn membership',
      error: error.message
    });
  }
};

// Upgrade user membership
export const upgradeMembership = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPlan } = req.body;

    // Validate new plan
    if (!['pro', 'premium'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Gói membership không hợp lệ'
      });
    }

    // Check if user exists
    const [userCheck] = await pool.execute(
      'SELECT id, membership FROM users WHERE id = ? AND is_active = 1',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc không hoạt động'
      });
    }

    // Update user membership type
    await pool.execute(
      'UPDATE users SET membership = ?, updated_at = NOW() WHERE id = ?',
      [newPlan, userId]
    );

    // Update or create membership record
    const [membershipCheck] = await pool.execute(
      'SELECT * FROM user_memberships WHERE user_id = ? AND status = "active"',
      [userId]
    );

    if (membershipCheck.length === 0) {
      // Create new membership with appropriate duration
      const duration = newPlan === 'premium' ? 90 : 60; // 90 days for premium, 60 for pro
      // Get package_id for the plan (assuming 1 for pro, 2 for premium)
      const packageId = newPlan === 'premium' ? 2 : 1;
      
      await pool.execute(
        'INSERT INTO user_memberships (user_id, package_id, start_date, end_date, status) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), "active")',
        [userId, packageId, duration]
      );
    } else {
      // Update existing membership package
      const packageId = newPlan === 'premium' ? 2 : 1;
      await pool.execute(
        'UPDATE user_memberships SET package_id = ?, updated_at = NOW() WHERE user_id = ? AND status = "active"',
        [packageId, userId]
      );
    }

    res.json({
      success: true,
      message: `Đã nâng cấp membership lên ${newPlan} cho người dùng`,
      data: {
        userId,
        newPlan,
        upgradedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error upgrading membership:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi nâng cấp membership',
      error: error.message
    });
  }
};

// Cancel user membership
export const cancelMembership = async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: Implement actual database update
    console.log(`Canceling membership for user ${userId}`);

    res.json({
      success: true,
      message: 'Đã hủy membership cho người dùng',
      data: {
        userId,
        canceledAt: new Date(),
        refundEligible: true
      }
    });
  } catch (error) {
    console.error('Error canceling membership:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi hủy membership',
      error: error.message
    });
  }
};

// Send expiry notifications
export const sendExpiryNotifications = async (req, res) => {
  try {
    // TODO: Implement actual email/notification sending
    const notificationCount = 2; // Mock count

    res.json({
      success: true,
      message: `Đã gửi thông báo cho ${notificationCount} người dùng sắp hết hạn`,
      data: {
        notificationsSent: notificationCount,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

// Get payment analytics
export const getPaymentAnalytics = async (req, res) => {
  try {
    
    // Get payment method statistics
    const [paymentMethods] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as revenue,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed'), 1) as percentage
      FROM payments 
      WHERE payment_status = 'completed'
      GROUP BY payment_method
    `);

    // Calculate conversion rates
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const [proUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership = "pro"');
    const [premiumUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership = "premium"');
    const [freeUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership = "free" OR membership IS NULL');

    const freeToPro = totalUsers[0].count > 0 ? (proUsers[0].count / totalUsers[0].count * 100) : 0;
    const proToPremium = proUsers[0].count > 0 ? (premiumUsers[0].count / proUsers[0].count * 100) : 0;
    const freeToAny = totalUsers[0].count > 0 ? ((proUsers[0].count + premiumUsers[0].count) / totalUsers[0].count * 100) : 0;

    // Get failed payments
    const [failedPayments] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM payments 
      WHERE payment_status = 'failed'
    `);

    const analytics = {
      paymentMethods: paymentMethods.map(row => ({
        method: row.payment_method,
        count: row.count,
        amount: parseFloat(row.total_amount),
        percentage: parseFloat(row.percentage)
      })),
      conversionRates: {
        freeToPro: parseFloat(freeToPro.toFixed(1)),
        proToPremium: parseFloat(proToPremium.toFixed(1)),
        freeToAny: parseFloat(freeToAny.toFixed(1))
      },
      failedPayments: {
        count: failedPayments[0].count,
        totalAmount: failedPayments[0].totalAmount || 0
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy phân tích thanh toán',
      error: error.message
    });
  }
};

// Generate reports
export const generateReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate } = req.query;

    // TODO: Implement actual report generation
    console.log(`Generating ${reportType} report from ${startDate} to ${endDate}`);

    res.json({
      success: true,
      message: `Báo cáo ${reportType} đang được tạo`,
      data: {
        reportType,
        dateRange: { startDate, endDate },
        downloadUrl: `/api/admin/reports/${reportType}/download`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo báo cáo',
      error: error.message
    });
  }
};

// Get all packages for admin
export const getPackages = async (req, res) => {
  try {
    
    // Query packages from database
    const [packages] = await pool.execute(
      'SELECT * FROM packages ORDER BY id ASC'
    );
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách gói',
      error: error.message
    });
  }
};

// Create new package
export const createPackage = async (req, res) => {
  try {
    const { name, price, membership_type, description, period } = req.body;

    // Validate required fields
    if (!name || !price || !membership_type) {
      return res.status(400).json({
        success: false,
        message: 'Tên gói, giá và loại membership là bắt buộc'
      });
    }

    // Validate membership_type
    if (!['free', 'premium', 'pro'].includes(membership_type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại membership phải là free, premium hoặc pro'
      });
    }

    // Insert new package
    const [result] = await pool.execute(
      'INSERT INTO packages (name, price, membership_type, description, period, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [name, price, membership_type, description || '', period || 'tháng']
    );

    // Get the created package
    const [newPackage] = await pool.execute(
      'SELECT * FROM packages WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      message: 'Đã tạo gói thành viên mới thành công',
      data: newPackage[0]
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo gói thành viên mới',
      error: error.message
    });
  }
};

// Update package
export const updatePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { name, price, membership_type, description, period } = req.body;

    // Check if package exists
    const [packageCheck] = await pool.execute(
      'SELECT * FROM packages WHERE id = ?',
      [packageId]
    );

    if (packageCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gói thành viên không tồn tại'
      });
    }

    // Validate membership_type if provided
    if (membership_type && !['free', 'premium', 'pro'].includes(membership_type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại membership phải là free, premium hoặc pro'
      });
    }

    // Update package
    await pool.execute(
      'UPDATE packages SET name = ?, price = ?, membership_type = ?, description = ?, period = ?, updated_at = NOW() WHERE id = ?',
      [
        name || packageCheck[0].name,
        price || packageCheck[0].price,
        membership_type || packageCheck[0].membership_type,
        description || packageCheck[0].description,
        period || packageCheck[0].period,
        packageId
      ]
    );

    // Get updated package
    const [updatedPackage] = await pool.execute(
      'SELECT * FROM packages WHERE id = ?',
      [packageId]
    );

    res.json({
      success: true,
      message: 'Đã cập nhật gói thành viên thành công',
      data: updatedPackage[0]
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật gói thành viên',
      error: error.message
    });
  }
};

// Delete package
export const deletePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    // Check if package exists
    const [packageCheck] = await pool.execute(
      'SELECT * FROM packages WHERE id = ?',
      [packageId]
    );

    if (packageCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gói thành viên không tồn tại'
      });
    }

    // Check if package is being used
    const [usageCheck] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_memberships WHERE package_id = ? AND status = "active"',
      [packageId]
    );

    if (usageCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa gói này vì vẫn có người dùng đang sử dụng'
      });
    } else {
      // Hard delete if no one is using it
      await pool.execute(
        'DELETE FROM packages WHERE id = ?',
        [packageId]
      );

      res.json({
        success: true,
        message: 'Đã xóa gói thành viên thành công',
        data: { packageId, action: 'deleted' }
      });
    }
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa gói thành viên',
      error: error.message
    });
  }
};

// Get all payments for admin
export const getPayments = async (req, res) => {
  try {
    
    // Query payments with user info from database
    const [payments] = await pool.execute(`
      SELECT 
        p.id,
        p.user_id as userId,
        u.full_name as userName,
        u.email as userEmail,
        p.amount,
        p.payment_status as status,
        p.payment_method as paymentMethod,
        p.transaction_id as transactionId,
        p.created_at as date,
        pkg.name as packageName
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN packages pkg ON p.package_id = pkg.id
      ORDER BY p.created_at DESC
    `);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

/**
 * Get statistics about coaches
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachStats = async (req, res) => {
    try {
        // Get total number of coaches
        const [totalCoaches] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE role = ?',
            ['coach']
        );
        
        // Get number of active coaches
        const [activeCoaches] = await pool.query(
            'SELECT COUNT(*) as active FROM users WHERE role = ? AND is_active = 1',
            ['coach']
        );
        
        // Get average rating of coaches
        const [avgRating] = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM feedback'
        );
        
        return sendResponse(res, 200, true, 'Coach statistics fetched successfully', {
            totalCoaches: totalCoaches[0].total || 0,
            activeCoaches: activeCoaches[0].active || 0,
            avgRating: avgRating[0].avg_rating ? parseFloat(avgRating[0].avg_rating).toFixed(2) : 0
        });
    } catch (error) {
        console.error('Error fetching coach stats:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get statistics about appointments
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAppointmentStats = async (req, res) => {
    try {
        // Get total appointments
        const [totalAppointments] = await pool.query(
            'SELECT COUNT(*) as total FROM appointments'
        );
        
        // Get upcoming appointments
        const [upcomingAppointments] = await pool.query(
            'SELECT COUNT(*) as upcoming FROM appointments WHERE date > CURDATE() AND status = ?',
            ['confirmed']
        );
        
        // Get completed appointments
        const [completedAppointments] = await pool.query(
            'SELECT COUNT(*) as completed FROM appointments WHERE status = ?',
            ['completed']
        );
        
        // Get cancelled appointments
        const [cancelledAppointments] = await pool.query(
            'SELECT COUNT(*) as cancelled FROM appointments WHERE status = ?',
            ['cancelled']
        );
        
        return sendResponse(res, 200, true, 'Appointment statistics fetched successfully', {
            total: totalAppointments[0].total || 0,
            upcoming: upcomingAppointments[0].upcoming || 0,
            completed: completedAppointments[0].completed || 0,
            cancelled: cancelledAppointments[0].cancelled || 0
        });
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get detailed information about all coaches
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAllCoachesDetails = async (req, res) => {
    try {
        console.log('Fetching all coaches details');
        
        const [rows] = await pool.query(
            `SELECT 
                u.*,
                (SELECT AVG(rating) FROM feedback WHERE coach_id = u.id) as rating,
                (SELECT COUNT(*) FROM appointments WHERE coach_id = u.id) as appointment_count,
                (SELECT COUNT(*) FROM appointments WHERE coach_id = u.id AND status = 'completed') as completed_count,
                (SELECT COUNT(*) FROM feedback WHERE coach_id = u.id) as feedback_count,
                (SELECT COUNT(*) FROM coach_availability WHERE coach_id = u.id) as available_slots_count
            FROM users u
            WHERE u.role = 'coach'
            ORDER BY u.full_name`
        );
        
        console.log('Coach details fetched:', rows.map(r => ({
            id: r.id,
            name: r.full_name,
            appointment_count: r.appointment_count,
            completed_count: r.completed_count
        })));
        
        return sendResponse(res, 200, true, 'Coach details fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching all coaches details:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update coach information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateCoach = async (req, res) => {
    try {
        const { id } = req.params;
        // Handle both isActive and is_active field names
        const { full_name, email, phone, gender, is_active, isActive, bio, experience, specialization } = req.body;
        
        // Log request body to debug
        console.log('Update coach request body:', req.body);
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id, is_active as currentIsActive FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Determine activation status - check both field names and maintain current if not provided
        const providedStatus = is_active !== undefined ? is_active : isActive;
        const activeStatus = providedStatus !== undefined ? (providedStatus ? 1 : 0) : coachRows[0].currentIsActive;
        console.log(`Updating coach ${id} with is_active: ${activeStatus} (provided value: ${providedStatus})`);
        
        // Clean up experience value if it contains text (e.g. "11 năm")
        let experienceValue = experience;
        if (typeof experience === 'string' && experience.includes('năm')) {
            // Extract the numeric part only for database storage
            const numericMatch = experience.match(/^(\d+)/);
            if (numericMatch && numericMatch[1]) {
                experienceValue = numericMatch[1];
                console.log(`Converted experience value "${experience}" to numeric: ${experienceValue}`);
            }
        }
        
        // Update coach information
        await pool.query(
            `UPDATE users
            SET full_name = ?, email = ?, phone = ?, gender = ?, is_active = ?, 
                bio = ?, experience = ?, specialization = ?
            WHERE id = ?`,
            [full_name, email, phone, gender, activeStatus, 
             bio, experienceValue, specialization, id]
        );
        
        return sendResponse(res, 200, true, 'Coach updated successfully', { id });
    } catch (error) {
        console.error('Error updating coach:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create a new coach
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createCoach = async (req, res) => {
    try {
        // Handle both isActive and is_active field names
        const { full_name, email, phone, gender, password, bio, experience, specialization, is_active, isActive } = req.body;
        
        // Log request body to debug
        console.log('Create coach request body:', req.body);
        
        // Check if email already exists
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return sendResponse(res, 400, false, 'Email already exists', null);
        }
        
        // Determine activation status - default to active (1) if not specified
        const providedStatus = is_active !== undefined ? is_active : isActive;
        const activeStatus = providedStatus !== undefined ? (providedStatus ? 1 : 0) : 1;
        console.log(`Creating coach with is_active: ${activeStatus} (provided value: ${providedStatus})`);
        
        // Clean up experience value if it contains text (e.g. "11 năm")
        let experienceValue = experience;
        if (typeof experience === 'string' && experience.includes('năm')) {
            // Extract the numeric part only for database storage
            const numericMatch = experience.match(/^(\d+)/);
            if (numericMatch && numericMatch[1]) {
                experienceValue = numericMatch[1];
                console.log(`Converted experience value "${experience}" to numeric: ${experienceValue}`);
            }
        }
        
        // Create new coach
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, phone, gender, role, password, is_active,
                                bio, experience, specialization)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, phone, gender, 'coach', password, activeStatus,
             bio || null, experienceValue || null, specialization || null]
        );
        
        return sendResponse(res, 201, true, 'Coach created successfully', { id: result.insertId });
    } catch (error) {
        console.error('Error creating coach:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update coach availability
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateCoachAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { available_slots } = req.body;
        
        if (!Array.isArray(available_slots)) {
            return sendResponse(res, 400, false, 'Available slots must be an array', null);
        }

        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Start a transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Delete current availability
            await pool.query(
                'DELETE FROM coach_availability WHERE coach_id = ?',
                [id]
            );
            
            // Insert new availability slots
            for (const slot of available_slots) {
                await pool.query(
                    `INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
                    VALUES (?, ?, ?, ?)`,
                    [id, slot.day_of_week, slot.start_time, slot.end_time]
                );
            }
            
            // Commit transaction
            await pool.query('COMMIT');
            
            return sendResponse(res, 200, true, 'Coach availability updated successfully', { 
                coach_id: parseInt(id),
                available_slots 
            });
        } catch (err) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error updating coach availability:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get all coach assignments
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachAssignments = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT ca.id, ca.user_id as userId, ca.coach_id as coachId, 
                u_user.full_name as userName, u_coach.full_name as coachName, 
                ca.start_date as startDate, ca.sessions_completed as sessionsCompleted, 
                ca.next_session as nextSession, ca.status
            FROM coach_assignments ca
            JOIN users u_user ON ca.user_id = u_user.id
            JOIN users u_coach ON ca.coach_id = u_coach.id
            ORDER BY ca.start_date DESC`
        );
        
        return sendResponse(res, 200, true, 'Coach assignments fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching coach assignments:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create a new coach assignment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createCoachAssignment = async (req, res) => {
    try {
        const { userId, coachId, nextSession } = req.body;
        
        // Validate request body
        if (!userId || !coachId || !nextSession) {
            return sendResponse(res, 400, false, 'Missing required fields', null);
        }
        
        // Check if user exists and has premium status
        const [userRows] = await pool.query(
            `SELECT u.id, m.status as membership_status 
            FROM users u 
            LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
            WHERE u.id = ?`,
            [userId]
        );
        
        if (userRows.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        if (userRows[0].membership_status !== 'active') {
            return sendResponse(res, 400, false, 'User does not have an active premium membership', null);
        }
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [coachId, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Check if user already has a coach assigned
        const [existingAssignment] = await pool.query(
            'SELECT id FROM coach_assignments WHERE user_id = ? AND status = ?',
            [userId, 'active']
        );
        
        if (existingAssignment.length > 0) {
            return sendResponse(res, 400, false, 'User already has an active coach assignment', null);
        }
        
        // Create new assignment
        const [result] = await pool.query(
            `INSERT INTO coach_assignments 
                (user_id, coach_id, start_date, next_session, sessions_completed, status)
            VALUES (?, ?, CURDATE(), ?, 0, 'active')`,
            [userId, coachId, nextSession]
        );
        
        // Get the created assignment
        const [newAssignment] = await pool.query(
            `SELECT ca.id, ca.user_id as userId, ca.coach_id as coachId, 
                u_user.full_name as userName, u_coach.full_name as coachName, 
                ca.start_date as startDate, ca.sessions_completed as sessionsCompleted, 
                ca.next_session as nextSession, ca.status
            FROM coach_assignments ca
            JOIN users u_user ON ca.user_id = u_user.id
            JOIN users u_coach ON ca.coach_id = u_coach.id
            WHERE ca.id = ?`,
            [result.insertId]
        );
        
        return sendResponse(res, 201, true, 'Coach assignment created successfully', newAssignment[0]);
    } catch (error) {
        console.error('Error creating coach assignment:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Delete a coach assignment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteCoachAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if assignment exists
        const [assignmentRows] = await pool.query(
            'SELECT id FROM coach_assignments WHERE id = ?',
            [id]
        );
        
        if (assignmentRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach assignment not found', null);
        }
        
        // Delete the assignment
        await pool.query(
            'DELETE FROM coach_assignments WHERE id = ?',
            [id]
        );
        
        return sendResponse(res, 200, true, 'Coach assignment deleted successfully', { id });
    } catch (error) {
        console.error('Error deleting coach assignment:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get premium users (active membership users)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getPremiumUsers = async (req, res) => {
    try {
        // Get users with active premium membership who don't already have a coach assigned
        const [rows] = await pool.query(
            `SELECT u.id, u.full_name as name, u.email, 'premium' as membershipStatus,
                CASE WHEN ca.id IS NULL THEN FALSE ELSE TRUE END as coachAssigned
            FROM users u
            JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
            LEFT JOIN coach_assignments ca ON u.id = ca.user_id AND ca.status = 'active'
            WHERE u.role = 'user'
            ORDER BY u.full_name`
        );
        
        return sendResponse(res, 200, true, 'Premium users fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching premium users:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get session history for a specific coach
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachSessionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`Getting session history for coach ID: ${id}`);
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            console.log(`Coach with ID ${id} not found`);
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        console.log(`Found coach with ID ${id}, fetching completed appointments`);
        
        // Get all completed sessions for this coach
        const [rows] = await pool.query(
            `SELECT 
                a.id, a.coach_id as coachId, a.user_id as userId, 
                u.full_name as userName, a.date, a.time,
                a.duration_minutes as duration,
                f.rating
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN feedback f ON (f.coach_id = a.coach_id AND f.smoker_id = a.user_id)
            WHERE a.coach_id = ? AND a.status = 'completed'
            ORDER BY a.date DESC, a.time DESC`,
            [id]
        );
        
        console.log(`Found ${rows.length} completed appointments for coach ID ${id}`);
        
        return sendResponse(res, 200, true, 'Coach session history fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching coach session history:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get all users with filtering and pagination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        
        // Add search filter
        if (search) {
            whereClause += ' AND (full_name LIKE ? OR email LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Add role filter
        if (role) {
            whereClause += ' AND role = ?';
            queryParams.push(role);
        }
        
        // Add status filter
        if (status !== '') {
            whereClause += ' AND is_active = ?';
            queryParams.push(status === 'true' ? 1 : 0);
        }
        
        // Get total count for all users (not filtered)
        const [totalCountAll] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [activeCount] = await pool.query('SELECT COUNT(*) as active FROM users WHERE is_active = 1');
        const [inactiveCount] = await pool.query('SELECT COUNT(*) as inactive FROM users WHERE is_active = 0');
        const [coachCount] = await pool.query('SELECT COUNT(*) as coaches FROM users WHERE role = "coach"');
        
        // Get filtered count for pagination
        const [filteredCount] = await pool.query(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            queryParams
        );
        
        // Get users with pagination
        const [users] = await pool.query(
            `SELECT id, username, email, full_name, role, is_active, created_at, updated_at,
                    phone, gender, avatar_url, date_of_birth 
             FROM users ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );
        
        return sendResponse(res, 200, true, 'Users fetched successfully', {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(filteredCount[0].total / limit),
                totalUsers: filteredCount[0].total,
                limit: parseInt(limit)
            },
            statistics: {
                totalAll: totalCountAll[0].total,
                activeUsers: activeCount[0].active,
                inactiveUsers: inactiveCount[0].inactive,
                coaches: coachCount[0].coaches
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get user by ID with detailed information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user basic info
        const [users] = await pool.query(
            `SELECT * FROM users WHERE id = ?`,
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        const user = users[0];
        
        // Get user's smoking progress if exists
        let smokingProgress = null;
        try {
            const [progress] = await pool.query(
                `SELECT * FROM smoking_progress WHERE user_id = ? ORDER BY date DESC LIMIT 10`,
                [id]
            );
            smokingProgress = progress;
        } catch (err) {
            console.log('No smoking progress table found or no data');
        }
        
        // Get user's appointments
        let appointments = [];
        try {
            const [userAppointments] = await pool.query(
                `SELECT a.*, u.full_name as coach_name 
                 FROM appointments a 
                 LEFT JOIN users u ON a.coach_id = u.id 
                 WHERE a.user_id = ? 
                 ORDER BY a.date DESC LIMIT 5`,
                [id]
            );
            appointments = userAppointments;
        } catch (err) {
            console.log('No appointments table found or no data');
        }
        
        return sendResponse(res, 200, true, 'User details fetched successfully', {
            user,
            smokingProgress,
            appointments
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createUser = async (req, res) => {
    try {
        console.log('📝 Creating new user with data:', req.body);
        const { username, email, password, full_name, role = 'user', phone, gender, date_of_birth, is_active = true } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !full_name) {
            console.log('❌ Validation failed: Missing required fields');
            return sendResponse(res, 400, false, 'Username, email, password and full_name are required', null);
        }
        
        console.log('✅ Validation passed, checking for existing users...');
        
        // Check if username or email already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            console.log('❌ User already exists');
            return sendResponse(res, 400, false, 'Username or email already exists', null);
        }
        
        console.log('✅ No existing user found, hashing password...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('✅ Password hashed, inserting user...');
        
        // Insert new user
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password_hash, full_name, role, phone, gender, date_of_birth, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [username, email, hashedPassword, full_name, role, phone, gender, date_of_birth, is_active ? 1 : 0]
        );
        
        console.log('✅ User created successfully with ID:', result.insertId);
        
        return sendResponse(res, 201, true, 'User created successfully', {
            userId: result.insertId
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        console.error('Stack trace:', error.stack);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update user information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role, phone, gender, date_of_birth, is_active } = req.body;
        
        // Check if user exists
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        // Check if username or email already exists for other users
        if (username || email) {
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || '', email || '', id]
            );
            
            if (existingUsers.length > 0) {
                return sendResponse(res, 400, false, 'Username or email already exists', null);
            }
        }
        
        // Update user
        await pool.query(
            `UPDATE users SET 
                username = ?, email = ?, full_name = ?, role = ?, 
                phone = ?, gender = ?, date_of_birth = ?, 
                is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [username, email, full_name, role, phone, gender, date_of_birth, is_active ? 1 : 0, id]
        );
        
        return sendResponse(res, 200, true, 'User updated successfully', null);
    } catch (error) {
        console.error('Error updating user:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Toggle user status (activate/deactivate)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get current status
        const [users] = await pool.query(
            'SELECT is_active FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        const newStatus = users[0].is_active ? 0 : 1;
        
        // Update status
        await pool.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, id]
        );
        
        return sendResponse(res, 200, true, `User ${newStatus ? 'activated' : 'deactivated'} successfully`, {
            isActive: Boolean(newStatus)
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Delete user (hard delete) - Completely removes user from database
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Attempting to hard delete user with ID: ${id}`);
        
        // Check if user exists
        const [users] = await pool.query(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            console.log(`❌ User with ID ${id} not found`);
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        console.log(`✅ Found user: ${users[0].username} (${users[0].email}) - Role: ${users[0].role}`);
        
        // Helper function to safely delete from table if it exists
        const safeDelete = async (tableName, whereClause, params) => {
            try {
                // Check if table exists
                const [tables] = await pool.query(
                    'SHOW TABLES LIKE ?',
                    [tableName]
                );
                
                if (tables.length > 0) {
                    await pool.query(`DELETE FROM ${tableName} WHERE ${whereClause}`, params);
                    console.log(`✅ Deleted from ${tableName} for user ${id}`);
                } else {
                    console.log(`⚠️ Table ${tableName} does not exist, skipping...`);
                }
            } catch (error) {
                console.log(`⚠️ Error deleting from ${tableName}: ${error.message}, skipping...`);
            }
        };
        
        // Start transaction for safe deletion
        await pool.query('START TRANSACTION');
        
        try {
            // Delete related data first to avoid foreign key constraints
            console.log(`🧹 Cleaning up related data for user ${id}...`);
            
            // Delete user's appointments
            await safeDelete('appointments', 'user_id = ? OR coach_id = ?', [id, id]);
            
            // Delete user's feedback (both given and received)
            await safeDelete('feedback', 'smoker_id = ? OR coach_id = ?', [id, id]);
            
            // Delete user's smoking progress
            await safeDelete('smoking_progress', 'user_id = ?', [id]);
            
            // Delete user's daily progress
            await safeDelete('daily_progress', 'smoker_id = ?', [id]);
            
            // Delete user's memberships
            await safeDelete('memberships', 'user_id = ?', [id]);
            
            // Delete user's payments
            await safeDelete('payments', 'user_id = ?', [id]);
            
            // Delete coach availability if user is a coach
            if (users[0].role === 'coach') {
                await safeDelete('coach_availability', 'coach_id = ?', [id]);
                await safeDelete('coach_assignments', 'coach_id = ?', [id]);
                console.log(`✅ Deleted coach-specific data for user ${id}`);
            }
            
            // Delete coach assignments if user is assigned to a coach
            await safeDelete('coach_assignments', 'user_id = ?', [id]);
            
            // Delete user's messages
            await safeDelete('messages', 'sender_id = ? OR receiver_id = ?', [id, id]);
            
            // Delete user's community posts
            await safeDelete('community_posts', 'user_id = ?', [id]);
            
            // Delete user's community post likes
            await safeDelete('community_post_likes', 'user_id = ?', [id]);
            
            // Delete user's community post comments
            await safeDelete('community_post_comments', 'user_id = ?', [id]);
            
            // Delete user's progress entries
            await safeDelete('progress_entries', 'user_id = ?', [id]);
            
            // Delete user's checkin data
            await safeDelete('daily_checkin', 'user_id = ?', [id]);
            
            // Finally, delete the user
            const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Failed to delete user');
            }
            
            // Commit transaction
            await pool.query('COMMIT');
            console.log(`✅ User ${id} (${users[0].username}) completely deleted from database`);
            
            return sendResponse(res, 200, true, 'User deleted permanently', {
                deletedUser: {
                    id: parseInt(id),
                    username: users[0].username,
                    email: users[0].email
                }
            });
            
        } catch (deleteError) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw deleteError;
        }
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        console.error('Stack trace:', error.stack);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};
