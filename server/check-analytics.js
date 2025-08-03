import { pool } from './src/config/database.js';

async function checkAnalyticsData() {
  try {
    console.log('=== ANALYTICS DATA CHECK ===');
    
    // 1. User distribution by membership type
    console.log('\n1. USER DISTRIBUTION:');
    const [userDistribution] = await pool.execute(`
      SELECT 
        COALESCE(membership_type, 'free') as membership_type,
        COUNT(*) as count
      FROM users 
      WHERE is_active = 1
      GROUP BY membership_type
    `);
    userDistribution.forEach(row => {
      console.log(`${row.membership_type}: ${row.count} users`);
    });

    // 2. Revenue by month (last 6 months)
    console.log('\n2. REVENUE BY MONTH:');
    const [revenueByMonth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as transactions,
        SUM(amount) as revenue
      FROM payments 
      WHERE payment_status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);
    revenueByMonth.forEach(row => {
      console.log(`${row.month}: ${row.transactions} transactions, ${parseFloat(row.revenue).toLocaleString('vi-VN')} ₫`);
    });

    // 3. Payment methods breakdown
    console.log('\n3. PAYMENT METHODS:');
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
    paymentMethods.forEach(row => {
      console.log(`${row.payment_method}: ${row.count} (${row.percentage}%) - ${parseFloat(row.total_amount).toLocaleString('vi-VN')} ₫`);
    });

    // 4. Package popularity
    console.log('\n4. PACKAGE POPULARITY:');
    const [packageStats] = await pool.execute(`
      SELECT 
        pkg.name,
        COUNT(p.id) as purchases,
        SUM(p.amount) as revenue
      FROM payments p
      JOIN packages pkg ON p.package_id = pkg.id
      WHERE p.payment_status = 'completed'
      GROUP BY pkg.id, pkg.name
      ORDER BY purchases DESC
    `);
    packageStats.forEach(row => {
      console.log(`${row.name}: ${row.purchases} purchases - ${parseFloat(row.revenue).toLocaleString('vi-VN')} ₫`);
    });

    // 5. Recent activity
    console.log('\n5. RECENT ACTIVITY (Last 7 days):');
    const [recentActivity] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    recentActivity.forEach(row => {
      console.log(`${row.date}: ${row.new_users} new users`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAnalyticsData();
