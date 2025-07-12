import { pool } from '../src/config/database.js';

async function recreatePaymentsTable() {
    try {
        console.log('🔄 Recreating payments table...');

        // Disable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Drop payment_transactions table if exists
        await pool.execute('DROP TABLE IF EXISTS payment_transactions');
        console.log('✅ Dropped payment_transactions table');

        // Drop table if exists
        await pool.execute('DROP TABLE IF EXISTS payments');
        console.log('✅ Dropped existing payments table');

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Create payments table with correct schema
        await pool.execute(`
            CREATE TABLE payments (
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
                INDEX idx_transaction_id (transaction_id)
            )
        `);

        console.log('✅ Created payments table successfully');

    } catch (error) {
        console.error('❌ Failed to recreate payments table:', error);
    } finally {
        process.exit(0);
    }
}

recreatePaymentsTable();
