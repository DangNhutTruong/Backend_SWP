import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await pool.execute(
      'SELECT * FROM users WHERE role = ? OR email = ?',
      ['admin', 'admin@nosmoke.com']
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists:', existingAdmin[0].email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('123123', 10);

    // Create admin user
    const [result] = await pool.execute(
      `INSERT INTO users (
        username, 
        email, 
        password_hash, 
        full_name, 
        role, 
        is_active,
        email_verified,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'admin',
        'admin@nosmoke.com',
        hashedPassword,
        'System Administrator',
        'admin',
        1,
        1
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@nosmoke.com');
    console.log('🔑 Password: 123123');
    console.log('🆔 User ID:', result.insertId);

    // Verify creation
    const [newAdmin] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ Verification:', newAdmin[0]);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
