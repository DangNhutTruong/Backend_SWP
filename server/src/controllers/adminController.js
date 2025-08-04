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

    // 3. Payment methods breakdown - ZaloPay only
    const [paymentMethods] = await pool.execute(`
      SELECT 
        'zalopay' as payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        100.0 as percentage
      FROM payments 
      WHERE payment_status = 'completed'
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
    
    // Simplest query to avoid GROUP BY issues - get raw data and process in application
    const [rawData] = await pool.execute(`
      SELECT 
        amount,
        YEAR(created_at) as year,
        MONTH(created_at) as month_num,
        created_at
      FROM payments 
      WHERE payment_status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ORDER BY created_at ASC
    `);

    // Process data in JavaScript to avoid MySQL GROUP BY issues
    const monthlyData = {};
    rawData.forEach(row => {
      const key = `${row.year}-${row.month_num.toString().padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          period: key,
          year: row.year,
          month_num: row.month_num,
          month: new Date(row.year, row.month_num - 1).toLocaleString('en', { month: 'short' }),
          revenue: 0,
          transactions: 0
        };
      }
      monthlyData[key].revenue += parseFloat(row.amount || 0);
      monthlyData[key].transactions += 1;
    });

    const revenueData = Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));

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
    
    // Get payment method statistics - ZaloPay only
    const [paymentMethods] = await pool.execute(`
      SELECT 
        'zalopay' as payment_method,
        COUNT(*) as count,
        SUM(amount) as revenue,
        100.0 as percentage
      FROM payments 
      WHERE payment_status = 'completed'
    `);

    // Get ZaloPay transaction details
    const [zalopayDetails] = await pool.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN payment_status = 'completed' THEN amount END) as avg_transaction_value
      FROM payments 
      WHERE payment_method = 'zalopay' OR payment_method IS NULL
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

    const zalopay = zalopayDetails[0];
    
    const analytics = {
      paymentMethods: [{
        method: 'ZaloPay',
        count: paymentMethods[0]?.count || 0,
        amount: parseFloat(paymentMethods[0]?.revenue || 0),
        percentage: 100.0
      }],
      zalopayDetails: {
        totalTransactions: zalopay.total_transactions || 0,
        successfulTransactions: zalopay.successful_transactions || 0,
        failedTransactions: zalopay.failed_transactions || 0,
        pendingTransactions: zalopay.pending_transactions || 0,
        totalRevenue: parseFloat(zalopay.total_revenue || 0),
        avgTransactionValue: parseFloat(zalopay.avg_transaction_value || 0),
        successRate: zalopay.total_transactions > 0 
          ? parseFloat(((zalopay.successful_transactions / zalopay.total_transactions) * 100).toFixed(1))
          : 0
      },
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
 * Get comprehensive metrics for admin dashboard
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getMetrics = async (req, res) => {
  try {
    // 1. Total users
    const [totalUsersResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    );
    const totalUsers = totalUsersResult[0].count;

    // 2. Total revenue
    const [revenueResult] = await pool.execute(
      'SELECT SUM(amount) as total FROM payments WHERE payment_status = "completed"'
    );
    const totalRevenue = parseFloat(revenueResult[0].total || 0);

    // 3. Active coaches
    const [activeCoachesResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "coach" AND is_active = 1'
    );
    const activeCoaches = activeCoachesResult[0].count;

    // 4. Membership count (premium + pro users)
    const [membershipResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership IN ("pro", "premium") AND is_active = 1'
    );
    const membershipCount = membershipResult[0].count;

    // 5. Blog posts count (check if table exists first)
    let blogPostsCount = 0;
    try {
      const [blogResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM blog_posts WHERE status = "published"'
      );
      blogPostsCount = blogResult[0]?.count || 0;
    } catch (error) {
      // Table doesn't exist, use 0
      blogPostsCount = 0;
    }

    // 6. Total appointments
    const [appointmentsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM appointments'
    );
    const totalAppointments = appointmentsResult[0].count;

    // 7. Total payments
    const [paymentsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM payments WHERE payment_status = "completed"'
    );
    const totalPayments = paymentsResult[0].count;

    // 8. New users this week
    const [newUsersResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_active = 1'
    );
    const newUsersThisWeek = newUsersResult[0].count;

    // 9. Users change (this week vs last week)
    const [lastWeekUsersResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) 
       AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) 
       AND is_active = 1`
    );
    const lastWeekUsers = lastWeekUsersResult[0].count;
    const usersChange = lastWeekUsers > 0 ? ((newUsersThisWeek - lastWeekUsers) / lastWeekUsers * 100) : 0;

    // 10. Revenue change (this month vs last month)
    const [thisMonthRevenueResult] = await pool.execute(
      `SELECT SUM(amount) as total FROM payments 
       WHERE payment_status = "completed" 
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`
    );
    const thisMonthRevenue = parseFloat(thisMonthRevenueResult[0].total || 0);

    const [lastMonthRevenueResult] = await pool.execute(
      `SELECT SUM(amount) as total FROM payments 
       WHERE payment_status = "completed" 
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')`
    );
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult[0].total || 0);
    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    // 11. Successful quit attempts (check if table exists first)
    let successfulQuitAttempts = 0;
    try {
      const [quitAttemptsResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM user_progress WHERE quit_success = 1'
      );
      successfulQuitAttempts = quitAttemptsResult[0]?.count || 0;
    } catch (error) {
      // Table doesn't exist, use 0
      successfulQuitAttempts = 0;
    }

    // 12. Community posts (check if table exists first)
    let communityPosts = 0;
    try {
      const [communityResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM community_posts WHERE status = "published"'
      );
      communityPosts = communityResult[0]?.count || 0;
    } catch (error) {
      // Table doesn't exist, use 0
      communityPosts = 0;
    }

    // 13. Achievements (check if table exists first)
    let achievements = 0;
    try {
      const [achievementsResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM user_achievements'
      );
      achievements = achievementsResult[0]?.count || 0;
    } catch (error) {
      // Table doesn't exist, use 0
      achievements = 0;
    }

    const metrics = {
      totalUsers,
      totalRevenue,
      activeCoaches,
      membershipCount,
      blogPostsCount,
      usersChange: Math.round(usersChange * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      newUsersThisWeek,
      successfulQuitAttempts,
      totalAppointments,
      totalPayments,
      communityPosts,
      achievements
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu thống kê',
      error: error.message
    });
  }
};

// Get progress data for dashboard
export const getProgressData = async (req, res) => {
  try {
    // User progress over time
    const [userProgress] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND is_active = 1
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Successful quit attempts by month
    let quitProgress = [];
    try {
      const [quitResult] = await pool.execute(`
        SELECT 
          DATE_FORMAT(quit_date, '%Y-%m') as month,
          COUNT(*) as successful_quits
        FROM user_progress 
        WHERE quit_success = 1
          AND quit_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(quit_date, '%Y-%m')
        ORDER BY month ASC
      `);
      quitProgress = quitResult;
    } catch (error) {
      // Table doesn't exist, use empty array
      quitProgress = [];
    }

    // Overall progress metrics
    let progressMetrics = { total_successful_quits: 0, total_failed_attempts: 0, avg_days_smoke_free: 0 };
    try {
      const [progressResult] = await pool.execute(`
        SELECT 
          COUNT(CASE WHEN quit_success = 1 THEN 1 END) as total_successful_quits,
          COUNT(CASE WHEN quit_success = 0 THEN 1 END) as total_failed_attempts,
          AVG(days_smoke_free) as avg_days_smoke_free
        FROM user_progress
      `);
      progressMetrics = progressResult[0] || progressMetrics;
    } catch (error) {
      // Table doesn't exist, use defaults
      progressMetrics = { total_successful_quits: 0, total_failed_attempts: 0, avg_days_smoke_free: 0 };
    }

    const progressData = {
      userGrowth: userProgress.map(row => ({
        month: row.month,
        newUsers: row.new_users
      })),
      quitSuccess: quitProgress.map(row => ({
        month: row.month,
        successfulQuits: row.successful_quits
      })),
      metrics: {
        totalSuccessfulQuits: progressMetrics.total_successful_quits || 0,
        totalFailedAttempts: progressMetrics.total_failed_attempts || 0,
        avgDaysSmokeFree: Math.round(progressMetrics.avg_days_smoke_free || 0)
      }
    };

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Error fetching progress data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu tiến độ',
      error: error.message
    });
  }
};

// Get recent activities for dashboard
export const getRecentActivities = async (req, res) => {
  try {
    // Recent user registrations
    const [recentUsers] = await pool.execute(`
      SELECT 
        'user' as type,
        CONCAT('Người dùng mới: ', full_name) as description,
        created_at as timestamp
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Recent payments
    const [recentPayments] = await pool.execute(`
      SELECT 
        'payment' as type,
        CONCAT('Thanh toán thành công: ', IFNULL(FORMAT(amount, 0), 'N/A'), ' VNĐ') as description,
        created_at as timestamp
      FROM payments 
      WHERE payment_status = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Recent appointments
    const [recentAppointments] = await pool.execute(`
      SELECT 
        'appointment' as type,
        CONCAT('Cuộc hẹn mới được đặt') as description,
        created_at as timestamp
      FROM appointments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Recent blog posts (if table exists)
    let recentBlogs = [];
    try {
      const [blogResult] = await pool.execute(`
        SELECT 
          'blog' as type,
          CONCAT('Bài viết mới: ', title) as description,
          created_at as timestamp
        FROM blog_posts 
        WHERE status = 'published'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY created_at DESC
        LIMIT 3
      `);
      recentBlogs = blogResult;
    } catch (error) {
      // Table doesn't exist, use empty array
      recentBlogs = [];
    }

    // Recent progress achievements
    let recentProgress = [];
    try {
      const [progressResult] = await pool.execute(`
        SELECT 
          'progress' as type,
          CONCAT('Thành tựu mới đạt được') as description,
          achievement_date as timestamp
        FROM user_achievements ua
        JOIN users u ON ua.user_id = u.id
        WHERE ua.achievement_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY ua.achievement_date DESC
        LIMIT 3
      `);
      recentProgress = progressResult;
    } catch (error) {
      // Table doesn't exist, use empty array
      recentProgress = [];
    }

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...recentUsers,
      ...recentPayments,
      ...recentAppointments,
      ...recentBlogs,
      ...recentProgress
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({
      success: true,
      data: allActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu hoạt động gần đây',
      error: error.message
    });
  }
};

// Get detailed payment statistics for admin dashboard
export const getPaymentStatistics = async (req, res) => {
  try {
    // Get payment status counts
    const [paymentStats] = await pool.execute(`
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM payments 
      GROUP BY payment_status
    `);

    // Get payment method breakdown (only completed payments)
    const [paymentMethods] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM payments 
      WHERE payment_status = 'completed'
      GROUP BY payment_method
    `);

    // Get total counts and averages
    const [totalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN payment_status = 'refunded' THEN 1 END) as refunded_payments,
        AVG(CASE WHEN payment_status = 'completed' THEN amount END) as avg_transaction_amount,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue
      FROM payments
    `);

    // Transform payment methods data for ZaloPay only
    const methodsData = {
      zalopay: 0,
      momo: 0,
      banking: 0
    };

    paymentMethods.forEach(method => {
      if (method.payment_method === 'zalopay' || method.payment_method === null) {
        methodsData.zalopay = method.count;
      }
    });

    // Get ZaloPay specific statistics
    const [zalopayStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions
      FROM payments 
      WHERE payment_method = 'zalopay' OR payment_method IS NULL
    `);

    const stats = totalStats[0];
    const zaloPay = zalopayStats[0];
    
    const result = {
      completed: stats.completed_payments || 0,
      pending: stats.pending_payments || 0,
      failed: stats.failed_payments || 0,
      refunded: stats.refunded_payments || 0,
      avgTransactionAmount: parseFloat(stats.avg_transaction_amount || 0),
      totalRevenue: parseFloat(stats.total_revenue || 0),
      // ZaloPay specific data since it's the only payment method
      paymentMethods: methodsData,
      zalopayDetails: {
        totalTransactions: zaloPay.total_transactions || 0,
        totalAmount: parseFloat(zaloPay.total_amount || 0),
        avgAmount: parseFloat(zaloPay.avg_amount || 0),
        successfulTransactions: zaloPay.successful_transactions || 0,
        failedTransactions: zaloPay.failed_transactions || 0,
        pendingTransactions: zaloPay.pending_transactions || 0,
        successRate: zaloPay.total_transactions > 0 
          ? parseFloat(((zaloPay.successful_transactions / zaloPay.total_transactions) * 100).toFixed(1))
          : 0
      },
      paymentMethodsDetailed: [{
        method: 'ZaloPay',
        count: zaloPay.total_transactions || 0,
        totalAmount: parseFloat(zaloPay.total_amount || 0),
        avgAmount: parseFloat(zaloPay.avg_amount || 0)
      }]
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê thanh toán',
      error: error.message
    });
  }
};

// ============= USER MANAGEMENT FUNCTIONS =============

// Get all users with pagination and filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereConditions = [];
    let queryParams = [];

    // Search filter
    if (search) {
      whereConditions.push('(full_name LIKE ? OR email LIKE ? OR username LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Role filter
    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    // Status filter
    if (status !== '') {
      whereConditions.push('is_active = ?');
      queryParams.push(status === 'true' ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      queryParams
    );

    // Get users data using string interpolation for LIMIT/OFFSET to avoid MySQL issues
    const usersQuery = `
      SELECT id, username, email, full_name, phone, role, gender, 
             date_of_birth, avatar_url, is_active, created_at, updated_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [users] = await pool.execute(usersQuery, queryParams);

    // Get statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalAll,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactiveUsers,
        SUM(CASE WHEN role = 'coach' THEN 1 ELSE 0 END) as coaches
      FROM users
    `);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: countResult[0].total
        },
        statistics: stats[0]
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// Get user by ID with detailed information
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user basic info
    const [users] = await pool.execute(
      `SELECT id, username, email, full_name, phone, role, gender, 
              date_of_birth, avatar_url, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const user = users[0];

    // Get smoking progress if user is smoker
    let smokingProgress = [];
    try {
      const [progressResult] = await pool.execute(
        `SELECT date, cigarettes_smoked, money_saved, notes
         FROM daily_progress WHERE smoker_id = ?
         ORDER BY date DESC LIMIT 50`,
        [id]
      );
      smokingProgress = progressResult;
    } catch (error) {
      // Table might not exist or have different structure
      console.log('Could not fetch smoking progress:', error.message);
      smokingProgress = [];
    }

    // Get appointments
    let appointments = [];
    try {
      const [appointmentResult] = await pool.execute(
        `SELECT a.*, c.full_name as coach_name
         FROM appointments a
         LEFT JOIN users c ON a.coach_id = c.id
         WHERE a.user_id = ?
         ORDER BY a.appointment_date DESC LIMIT 20`,
        [id]
      );
      appointments = appointmentResult;
    } catch (error) {
      // Table might not exist or have different structure
      console.log('Could not fetch appointments:', error.message);
      try {
        // Try alternative column name
        const [appointmentResult2] = await pool.execute(
          `SELECT a.*, c.full_name as coach_name
           FROM appointments a
           LEFT JOIN users c ON a.coach_id = c.id
           WHERE a.user_id = ?
           ORDER BY a.date DESC LIMIT 20`,
          [id]
        );
        appointments = appointmentResult2;
      } catch (error2) {
        console.log('Could not fetch appointments with alternative query:', error2.message);
        appointments = [];
      }
    }

    res.json({
      success: true,
      data: {
        user,
        smokingProgress,
        appointments
      }
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết người dùng',
      error: error.message
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      phone,
      role = 'user',
      gender,
      date_of_birth,
      is_active = 1
    } = req.body;

    // Check if email or username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc username đã tồn tại'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password, full_name, phone, role, 
                         gender, date_of_birth, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [username, email, hashedPassword, full_name, phone, role, gender, date_of_birth, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: {
        id: result.insertId,
        username,
        email,
        full_name,
        role
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo người dùng',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      full_name,
      phone,
      role,
      gender,
      date_of_birth,
      is_active
    } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check for duplicate email/username (excluding current user)
    const [duplicateUsers] = await pool.execute(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email, username, id]
    );

    if (duplicateUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc username đã tồn tại'
      });
    }

    // Update user
    await pool.execute(
      `UPDATE users SET 
        username = ?, email = ?, full_name = ?, phone = ?, 
        role = ?, gender = ?, date_of_birth = ?, is_active = ?, 
        updated_at = NOW()
       WHERE id = ?`,
      [username, email, full_name, phone, role, gender, date_of_birth, is_active, id]
    );

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật người dùng',
      error: error.message
    });
  }
};

// Toggle user status (active/inactive)
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const [users] = await pool.execute(
      'SELECT is_active FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const newStatus = users[0].is_active ? 0 : 1;

    // Update status
    await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} người dùng thành công`,
      data: {
        isActive: Boolean(newStatus)
      }
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái người dùng',
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent deleting admin users (optional safety check)
    if (users[0].role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản admin'
      });
    }

    // Delete user (this will cascade to related records if FK constraints are set up)
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  }
};

// ===== BLOG MANAGEMENT =====

// Get all blog posts for admin
export const getBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status && status !== 'all') {
      whereClause += ' WHERE status = ?';
      queryParams.push(status);
    }

    if (category && category !== 'all') {
      whereClause += whereClause ? ' AND category = ?' : ' WHERE category = ?';
      queryParams.push(category);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM blog_post${whereClause}`,
      queryParams
    );

    // Get blog posts with pagination
    const [posts] = await pool.execute(
      `SELECT 
        id,
        title,
        content,
        thumbnail_url,
        category,
        status,
        created_at,
        updated_at,
        author_id,
        views,
        likes
      FROM blog_post
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult[0].total / limit),
          totalItems: countResult[0].total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài viết',
      error: error.message
    });
  }
};

// Get single blog post for editing
export const getBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const [posts] = await pool.execute(
      'SELECT * FROM blog_post WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    res.json({
      success: true,
      data: posts[0]
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin bài viết',
      error: error.message
    });
  }
};

// Create new blog post
export const createBlogPost = async (req, res) => {
  try {
    const { title, content, thumbnail_url, category, status = 'draft' } = req.body;
    const author_id = req.user?.id || 1; // Get from authenticated admin

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    // Insert new blog post
    const [result] = await pool.execute(
      `INSERT INTO blog_post (title, content, thumbnail_url, category, status, author_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, content, thumbnail_url, category, status, author_id]
    );

    res.json({
      success: true,
      message: 'Đã tạo bài viết mới',
      data: {
        id: result.insertId,
        title,
        content,
        thumbnail_url,
        category,
        status,
        author_id
      }
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bài viết',
      error: error.message
    });
  }
};

// Update blog post
export const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, thumbnail_url, category, status } = req.body;

    // Check if post exists
    const [existingPost] = await pool.execute(
      'SELECT id FROM blog_post WHERE id = ?',
      [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Update blog post
    await pool.execute(
      `UPDATE blog_post 
       SET title = ?, content = ?, thumbnail_url = ?, category = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, thumbnail_url, category, status, id]
    );

    res.json({
      success: true,
      message: 'Đã cập nhật bài viết',
      data: {
        id,
        title,
        content,
        thumbnail_url,
        category,
        status
      }
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bài viết',
      error: error.message
    });
  }
};

// Delete blog post
export const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const [existingPost] = await pool.execute(
      'SELECT id FROM blog_post WHERE id = ?',
      [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Delete blog post
    await pool.execute('DELETE FROM blog_post WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Đã xóa bài viết'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bài viết',
      error: error.message
    });
  }
};

// Bulk update blog posts status
export const bulkUpdatePosts = async (req, res) => {
  try {
    const { postIds, action } = req.body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID bài viết không hợp lệ'
      });
    }

    let query;
    let params = [];

    switch (action) {
      case 'publish':
        query = `UPDATE blog_post SET status = 'published', updated_at = NOW() WHERE id IN (${postIds.map(() => '?').join(',')})`;
        params = postIds;
        break;
      case 'draft':
        query = `UPDATE blog_post SET status = 'draft', updated_at = NOW() WHERE id IN (${postIds.map(() => '?').join(',')})`;
        params = postIds;
        break;
      case 'delete':
        query = `DELETE FROM blog_post WHERE id IN (${postIds.map(() => '?').join(',')})`;
        params = postIds;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Hành động không hợp lệ'
        });
    }

    await pool.execute(query, params);

    res.json({
      success: true,
      message: `Đã ${action === 'publish' ? 'xuất bản' : action === 'draft' ? 'chuyển về nháp' : 'xóa'} ${postIds.length} bài viết`
    });
  } catch (error) {
    console.error('Error bulk updating posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật hàng loạt',
      error: error.message
    });
  }
};

// Get blog analytics
export const getBlogAnalytics = async (req, res) => {
  try {
    // Total posts by status
    const [postStats] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM blog_post
      GROUP BY status
    `);

    // Top viewed posts
    const [topPosts] = await pool.execute(`
      SELECT id, title, views, likes, created_at
      FROM blog_post
      WHERE status = 'published'
      ORDER BY views DESC
      LIMIT 5
    `);

    // Posts by category
    const [categoryStats] = await pool.execute(`
      SELECT 
        category,
        COUNT(*) as count
      FROM blog_post
      WHERE status = 'published'
      GROUP BY category
    `);

    // Recent activity (posts created in last 7 days)
    const [recentActivity] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as posts_created
      FROM blog_post
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const analytics = {
      postStats: postStats.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      topPosts,
      categoryStats,
      recentActivity,
      summary: {
        totalPosts: postStats.reduce((sum, row) => sum + row.count, 0),
        publishedPosts: postStats.find(row => row.status === 'published')?.count || 0,
        draftPosts: postStats.find(row => row.status === 'draft')?.count || 0
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching blog analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê blog',
      error: error.message
    });
  }
};
