import { pool } from './src/config/database.js';

async function testUserMembershipAPI() {
  try {
    console.log('=== TESTING USER MEMBERSHIP API ===');
    
    // Test the fixed queries
    console.log('\n1. Test getUsersWithMembership query:');
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership_type as membership,
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
      WHERE u.membership_type IN ('basic', 'premium')
        AND u.is_active = 1
      ORDER BY u.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${users.length} users with membership:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.membership} - Status: ${user.status}`);
    });
    
    console.log('\n2. Test getExpiringUsers query:');
    const [expiringUsers] = await pool.execute(`
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.membership_type as membership,
        um.end_date as expiryDate,
        DATEDIFF(um.end_date, NOW()) as daysLeft
      FROM users u
      INNER JOIN user_memberships um ON u.id = um.user_id
      WHERE um.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND u.is_active = 1
        AND um.status = 'active'
        AND u.membership_type IN ('basic', 'premium')
      ORDER BY um.end_date ASC
    `);
    
    console.log(`Found ${expiringUsers.length} users expiring soon:`);
    expiringUsers.forEach(user => {
      console.log(`- ${user.name}: expires in ${user.daysLeft} days`);
    });
    
    console.log('\n3. Check user_memberships table structure:');
    const [columns] = await pool.execute('DESCRIBE user_memberships');
    console.log('Columns in user_memberships:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testUserMembershipAPI();
