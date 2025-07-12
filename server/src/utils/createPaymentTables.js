import { pool } from '../config/database.js';

/**
 * Create tables for payment and membership system
 * Tối ưu hóa để tương thích với hệ thống hiện có
 */
const createPaymentTables = async () => {
    try {
        console.log('🔄 Creating payment and membership tables...');

        // 1. Thêm cột membership vào bảng users hiện có (thay vì tạo user_packages riêng)
        try {
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN membership ENUM('free', 'premium', 'pro') DEFAULT 'free'
            `);
            console.log('✅ Added membership column to users table');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                console.log('membership column error:', error.message);
            } else {
                console.log('✅ membership column already exists');
            }
        }

        // 2. Thêm cột membership_start_date và membership_end_date
        try {
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN membership_start_date TIMESTAMP NULL,
                ADD COLUMN membership_end_date TIMESTAMP NULL
            `);
            console.log('✅ Added membership date columns to users table');
        } catch (error) {
            if (!error.message.includes('Duplicate column name')) {
                console.log('membership date columns error:', error.message);
            } else {
                console.log('✅ membership date columns already exist');
            }
        }

        // 3. Create packages table - Lưu thông tin các gói membership
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                type ENUM('free', 'premium', 'pro') NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                duration_days INT NOT NULL DEFAULT 30,
                features JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_active (is_active),
                INDEX idx_price (price)
            )
        `);

        // 4. Create payments table - Lưu thông tin giao dịch thanh toán
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                package_id INT,
                amount DECIMAL(10,2) NOT NULL,
                method ENUM('bank_transfer', 'momo', 'zalopay', 'vnpay') DEFAULT 'bank_transfer',
                status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
                transaction_id VARCHAR(100) UNIQUE,
                tx_content VARCHAR(255),
                expected_content VARCHAR(255),
                bank_code VARCHAR(10) DEFAULT 'VCB',
                qr_code_url TEXT,
                verified_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
                INDEX idx_user_status (user_id, status),
                INDEX idx_status (status),
                INDEX idx_tx_content (tx_content),
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_created_at (created_at)
            )
        `);

        // Insert default packages phù hợp với frontend hiện có
        const [existingPackages] = await pool.query('SELECT COUNT(*) as count FROM packages');
        if (existingPackages[0].count === 0) {
            await pool.execute(`
                INSERT INTO packages (name, type, description, price, duration_days, features) VALUES
                ('Free', 'free', 'Gói miễn phí với tính năng cơ bản', 0, 30, 
                 '["daily_tracking", "basic_plan"]'),
                ('Premium', 'premium', 'Gói cao cấp với coach cá nhân và tính năng nâng cao', 99000, 30, 
                 '["daily_tracking", "personal_plan", "community_access", "coach_chat", "achievements"]'),
                ('Pro', 'pro', 'Gói chuyên nghiệp với đầy đủ tính năng và hỗ trợ 24/7', 999000, 365, 
                 '["daily_tracking", "personal_plan", "community_access", "coach_chat", "achievements", "video_call", "priority_support", "advanced_analytics"]')
            `);
            console.log('✅ Default packages inserted');
        }

        console.log('✅ Payment and membership tables created successfully');

    } catch (error) {
        console.error('❌ Error creating payment tables:', error);
        throw error;
    }
};

export default createPaymentTables;
