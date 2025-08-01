// Get membership statistics
export const getMembershipStats = async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
    
    // Query actual data from database
    const [freeUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership_type = ? OR membership_type IS NULL',
      ['free']
    );
    
    const [basicUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership_type = ?',
      ['basic']
    );
    
    const [premiumUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE membership_type = ?',
      ['premium']
    );
    
    const [totalUsers] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
    );

    const stats = {
      userDistribution: {
        free: freeUsers[0].count,
        basic: basicUsers[0].count,
        premium: premiumUsers[0].count
      },
      totalUsers: totalUsers[0].count,
      activeSubscriptions: basicUsers[0].count + premiumUsers[0].count
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

// Get revenue by month
// Get revenue by month
export const getRevenueByMonth = async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
    
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
    const { pool } = await import('../config/database.js');
    
    // Query users with their membership details
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership_type as membership,
        u.created_at as joinDate,
        m.expiry_date as expiryDate,
        CASE 
          WHEN m.expiry_date IS NULL THEN 'active'
          WHEN m.expiry_date < NOW() THEN 'expired'
          WHEN DATEDIFF(m.expiry_date, NOW()) <= 7 THEN 'expiring'
          ELSE 'active'
        END as status,
        COALESCE(payment_totals.totalPaid, 0) as totalPaid,
        COALESCE(payment_totals.renewalCount, 0) as renewalCount
      FROM users u
      LEFT JOIN memberships m ON u.id = m.user_id
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(amount) as totalPaid,
          COUNT(*) as renewalCount
        FROM payments 
        WHERE payment_status = 'completed'
        GROUP BY user_id
      ) payment_totals ON u.id = payment_totals.user_id
      WHERE u.membership_type IN ('basic', 'premium')
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
    const { pool } = await import('../config/database.js');
    
    // Query users whose membership expires within 7 days
    const [expiringUsers] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership_type as membership,
        m.expiry_date as expiryDate,
        DATEDIFF(m.expiry_date, NOW()) as daysLeft
      FROM users u
      INNER JOIN memberships m ON u.id = m.user_id
      WHERE m.expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND u.is_active = 1
        AND u.membership_type IN ('basic', 'premium')
      ORDER BY m.expiry_date ASC
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
    const { pool } = await import('../config/database.js');
    const { userId } = req.params;
    const { days = 30 } = req.body;

    // Check if user exists and has membership
    const [userCheck] = await pool.execute(
      'SELECT id, membership_type FROM users WHERE id = ? AND is_active = 1',
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
      'SELECT * FROM memberships WHERE user_id = ?',
      [userId]
    );

    if (membershipCheck.length === 0) {
      // Create new membership record
      await pool.execute(
        'INSERT INTO memberships (user_id, expiry_date) VALUES (?, DATE_ADD(NOW(), INTERVAL ? DAY))',
        [userId, days]
      );
    } else {
      // Extend existing membership
      await pool.execute(
        'UPDATE memberships SET expiry_date = DATE_ADD(COALESCE(expiry_date, NOW()), INTERVAL ? DAY) WHERE user_id = ?',
        [days, userId]
      );
    }

    // Get new expiry date
    const [newExpiry] = await pool.execute(
      'SELECT expiry_date FROM memberships WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: `Đã gia hạn membership ${days} ngày cho người dùng`,
      data: {
        userId,
        extendedDays: days,
        newExpiryDate: newExpiry[0].expiry_date
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
    const { pool } = await import('../config/database.js');
    const { userId } = req.params;
    const { newPlan } = req.body;

    // Validate new plan
    if (!['basic', 'premium'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Gói membership không hợp lệ'
      });
    }

    // Check if user exists
    const [userCheck] = await pool.execute(
      'SELECT id, membership_type FROM users WHERE id = ? AND is_active = 1',
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
      'UPDATE users SET membership_type = ?, updated_at = NOW() WHERE id = ?',
      [newPlan, userId]
    );

    // Update or create membership record
    const [membershipCheck] = await pool.execute(
      'SELECT * FROM memberships WHERE user_id = ?',
      [userId]
    );

    if (membershipCheck.length === 0) {
      // Create new membership with appropriate duration
      const duration = newPlan === 'premium' ? 90 : 30; // 90 days for premium, 30 for basic
      await pool.execute(
        'INSERT INTO memberships (user_id, expiry_date) VALUES (?, DATE_ADD(NOW(), INTERVAL ? DAY))',
        [userId, duration]
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
    const { pool } = await import('../config/database.js');
    
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
    const [basicUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership_type = "basic"');
    const [premiumUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership_type = "premium"');
    const [freeUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE membership_type = "free" OR membership_type IS NULL');

    const freeToBasic = totalUsers[0].count > 0 ? (basicUsers[0].count / totalUsers[0].count * 100) : 0;
    const basicToPremium = basicUsers[0].count > 0 ? (premiumUsers[0].count / basicUsers[0].count * 100) : 0;
    const freeToAny = totalUsers[0].count > 0 ? ((basicUsers[0].count + premiumUsers[0].count) / totalUsers[0].count * 100) : 0;

    // Get failed payments
    const [failedPayments] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as totalAmount
      FROM payments 
      WHERE payment_status = 'failed'
    `);

    const analytics = {
      paymentMethods: paymentMethods.reduce((acc, method) => {
        acc[method.payment_method] = {
          count: method.count,
          percentage: method.percentage,
          revenue: method.revenue
        };
        return acc;
      }, {}),
      conversionRates: {
        freeToBasic: parseFloat(freeToBasic.toFixed(1)),
        basicToPremium: parseFloat(basicToPremium.toFixed(1)),
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
    const { pool } = await import('../config/database.js');
    
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

// Get all payments for admin
export const getPayments = async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
    
    // Query payments with user info from database
    const [payments] = await pool.execute(`
      SELECT 
        p.id,
        p.user_id as userId,
        u.full_name as userName,
        u.email as userEmail,
        p.amount,
        COALESCE(p.payment_status, p.status) as status,
        p.payment_method as paymentMethod,
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
