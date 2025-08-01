// Get membership statistics
export const getMembershipStats = async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
    
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
    const { pool } = await import('../config/database.js');
    
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
    const { pool } = await import('../config/database.js');
    
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
    const { pool } = await import('../config/database.js');
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
    const { pool } = await import('../config/database.js');
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
      paymentMethods: paymentMethods.reduce((acc, method) => {
        acc[method.payment_method] = {
          count: method.count,
          percentage: method.percentage,
          revenue: method.revenue
        };
        return acc;
      }, {}),
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

// Create new package
export const createPackage = async (req, res) => {
  try {
    const { pool } = await import('../config/database.js');
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
    const { pool } = await import('../config/database.js');
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
    const { pool } = await import('../config/database.js');
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
    const { pool } = await import('../config/database.js');
    
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
