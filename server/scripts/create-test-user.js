import bcrypt from 'bcryptjs';
import { pool } from '../src/config/database.js';

async function createTestUser() {
    try {
        console.log('🔄 Creating verified test user...');

        const testUser = {
            username: 'testpayment',
            email: 'testpayment@example.com',
            password: 'TestPassword123!',
            fullName: 'Test Payment User'
        };

        const hashedPassword = await bcrypt.hash(testUser.password, 12);

        // Check if user exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [testUser.email, testUser.username]
        );

        if (existing.length > 0) {
            console.log('ℹ️ Test user already exists');
            return;
        }

        // Create verified user
        await pool.execute(`
      INSERT INTO users (username, email, password_hash, full_name, email_verified, is_active)
      VALUES (?, ?, ?, ?, TRUE, TRUE)
    `, [testUser.username, testUser.email, hashedPassword, testUser.fullName]);

        console.log('✅ Test user created successfully');
        console.log(`📧 Email: ${testUser.email}`);
        console.log(`🔑 Password: ${testUser.password}`);

    } catch (error) {
        console.error('❌ Failed to create test user:', error);
    } finally {
        process.exit(0);
    }
}

createTestUser();
