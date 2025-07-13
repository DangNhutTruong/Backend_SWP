import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cập nhật ràng buộc khóa ngoại của bảng messages
 */
async function fixMessagesForeignKey() {
    // Tạo pool connection riêng cho script này
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL || process.env.DB_URL,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+00:00',
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    const connection = await pool.getConnection();
    
    try {
        console.log('🔧 Bắt đầu sửa ràng buộc khóa ngoại cho bảng messages...');
        
        // Bắt đầu giao dịch để đảm bảo tính nhất quán
        await connection.beginTransaction();
        
        // 1. Xóa ràng buộc khóa ngoại hiện tại
        console.log('1️⃣ Xóa ràng buộc khóa ngoại hiện tại...');
        await connection.query(`
            ALTER TABLE messages
            DROP FOREIGN KEY messages_ibfk_1
        `);
        console.log('✅ Đã xóa ràng buộc khóa ngoại cũ');
        
        // 2. Thêm ràng buộc khóa ngoại mới liên kết với bảng appointments
        console.log('2️⃣ Thêm ràng buộc khóa ngoại mới...');
        await connection.query(`
            ALTER TABLE messages
            ADD CONSTRAINT messages_appointment_fk
            FOREIGN KEY (appointment_id)
            REFERENCES appointments(id)
            ON DELETE CASCADE
        `);
        console.log('✅ Đã thêm ràng buộc khóa ngoại mới liên kết đến bảng appointments');
        
        // Commit giao dịch
        await connection.commit();
        console.log('🎉 Cập nhật ràng buộc khóa ngoại thành công!');
        
    } catch (error) {
        // Rollback nếu có lỗi
        await connection.rollback();
        console.error('❌ Lỗi khi sửa ràng buộc khóa ngoại:', error);
        throw error;
    } finally {
        // Trả kết nối về pool
        connection.release();
        await pool.end();
    }
}

// Thực thi nếu được gọi trực tiếp
if (process.argv[1] === new URL(import.meta.url).pathname) {
    fixMessagesForeignKey()
        .then(() => {
            console.log('✨ Quá trình sửa khóa ngoại hoàn tất');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Lỗi:', error);
            process.exit(1);
        });
}

export default fixMessagesForeignKey;
