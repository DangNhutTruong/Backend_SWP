import { pool } from './src/config/database.js';

async function checkPayments() {
  try {
    console.log('=== CHECKING PAYMENTS DATA ===');
    
    // Check if payments table has data
    const [paymentsCount] = await pool.execute('SELECT COUNT(*) as count FROM payments');
    console.log(`Total payments in database: ${paymentsCount[0].count}`);
    
    if (paymentsCount[0].count > 0) {
      // Show sample payments
      const [samplePayments] = await pool.execute(`
        SELECT 
          p.id,
          p.user_id,
          u.full_name as user_name,
          u.email,
          p.package_id,
          pkg.name as package_name,
          p.amount,
          p.payment_method,
          p.payment_status,
          p.transaction_id,
          p.created_at
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN packages pkg ON p.package_id = pkg.id
        ORDER BY p.created_at DESC
        LIMIT 5
      `);
      
      console.log('\n=== SAMPLE PAYMENTS ===');
      samplePayments.forEach(payment => {
        console.log(`ID: ${payment.id} | User: ${payment.user_name} | Package: ${payment.package_name} | Amount: ${payment.amount} | Status: ${payment.payment_status} | Method: ${payment.payment_method}`);
      });
    } else {
      console.log('No payments found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPayments();
