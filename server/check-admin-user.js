import mysql from 'mysql2/promise';

async function checkAdminUser() {
  try {
    const connection = await mysql.createConnection({
      host: 'mainline.proxy.rlwy.net',
      port: 50699,
      user: 'root',
      password: 'PddXmhuukGTgQngCuGmvVoJWQfUvRQJe',
      database: 'railway',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('=== KIỂM TRA USER ADMIN ===');
    
    // Check user với ID = 1
    const [user1] = await connection.execute('SELECT id, email, full_name, role FROM users WHERE id = 1');
    console.log('User ID 1:', user1);
    
    // Check các admin users
    const [admins] = await connection.execute("SELECT id, email, full_name, role FROM users WHERE role = 'admin'");
    console.log('Admin users:', admins);
    
    // Tạo admin user nếu không có
    if (admins.length === 0) {
      console.log('Creating admin user...');
      const [result] = await connection.execute(
        `INSERT INTO users (email, full_name, role, password_hash, email_verified) 
         VALUES (?, ?, ?, ?, ?)`,
        ['admin@nosmoke.com', 'Admin User', 'admin', 'dummy_hash', 1]
      );
      console.log('Admin user created with ID:', result.insertId);
    }
    
    await connection.end();
    console.log('=== HOÀN THÀNH ===');
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
}

checkAdminUser();
