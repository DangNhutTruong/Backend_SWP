import { pool } from './src/config/database.js';

async function checkColumns() {
  try {
    console.log('=== USERS TABLE STRUCTURE ===');
    const [usersColumns] = await pool.execute('DESCRIBE users');
    usersColumns.forEach(col => {
      console.log(`${col.Field} - ${col.Type}`);
    });

    console.log('\n=== PAYMENTS TABLE STRUCTURE ===');
    const [paymentsColumns] = await pool.execute('DESCRIBE payments');
    paymentsColumns.forEach(col => {
      console.log(`${col.Field} - ${col.Type}`);
    });

    console.log('\n=== PACKAGES TABLE STRUCTURE ===');
    const [packagesColumns] = await pool.execute('DESCRIBE packages');
    packagesColumns.forEach(col => {
      console.log(`${col.Field} - ${col.Type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkColumns();
