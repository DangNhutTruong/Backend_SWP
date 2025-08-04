import mysql from 'mysql2/promise';

async function checkBlogTable() {
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
    
    console.log('=== KIỂM TRA CẤU TRÚC BẢNG blog_post ===');
    const [columns] = await connection.execute('DESCRIBE blog_post');
    
    console.log('Các cột trong bảng:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(có thể null)' : '(không null)'} ${col.Key ? '(' + col.Key + ')' : ''} ${col.Extra ? '(' + col.Extra + ')' : ''}`);
    });
    
    console.log('\n=== KIỂM TRA DỮ LIỆU MẪU ===');
    const [rows] = await connection.execute('SELECT * FROM blog_post LIMIT 3');
    
    if (rows.length > 0) {
      console.log(`Số bản ghi: ${rows.length}`);
      console.log('Các cột có dữ liệu:', Object.keys(rows[0]));
      console.log('\nDữ liệu mẫu:');
      rows.forEach((row, index) => {
        console.log(`\nBản ghi ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('Bảng chưa có dữ liệu');
    }
    
    await connection.end();
    console.log('\n=== HOÀN THÀNH ===');
    
  } catch (error) {
    console.error('Lỗi:', error.message);
  }
}

checkBlogTable();
