import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dropTargetColumn = async () => {
    try {
        // Tạo kết nối database sử dụng config từ .env
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('📋 Checking current table structure...');
        const [columns] = await connection.execute('DESCRIBE daily_progress');
        console.log('Current columns:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        // Kiểm tra xem cột target_cigarettes có tồn tại không
        const hasTargetColumn = columns.some(col => col.Field === 'target_cigarettes');
        
        if (hasTargetColumn) {
            console.log('\n🗑️ Dropping target_cigarettes column...');
            await connection.execute('ALTER TABLE daily_progress DROP COLUMN target_cigarettes');
            console.log('✅ Successfully dropped target_cigarettes column!');
        } else {
            console.log('\n⚠️ target_cigarettes column does not exist in the table.');
        }

        console.log('\n📋 Checking updated table structure...');
        const [newColumns] = await connection.execute('DESCRIBE daily_progress');
        console.log('Updated columns:');
        newColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

        await connection.end();
        console.log('\n✅ Database operation completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    }
};

// Chạy script
dropTargetColumn();
