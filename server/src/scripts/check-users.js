import { pool } from '../config/database.js';

async function checkUsers() {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active FROM users ORDER BY id'
    );

    console.log('📋 All users in database:');
    console.table(users);

    const [adminUsers] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE role = ?',
      ['admin']
    );

    console.log('\n👑 Admin users:');
    console.table(adminUsers);

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
