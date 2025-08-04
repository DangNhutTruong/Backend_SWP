const mysql = require('mysql2/promise');

// Cấu hình database
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'no_smoke'
};

// Danh sách huy hiệu tiết kiệm mới
const savingsAchievements = [
  {
    name: 'Tiết kiệm 50,000 đồng',
    description: 'Bạn đã tiết kiệm được 50,000 đồng từ việc không mua thuốc lá. Khởi đầu tuyệt vời!',
    icon_url: null
  },
  {
    name: 'Tiết kiệm 500,000 đồng',
    description: 'Wow! Bạn đã tiết kiệm được 500,000 đồng. Đủ tiền mua một món quà ý nghĩa!',
    icon_url: null
  },
  {
    name: 'Tiết kiệm 1 triệu đồng',
    description: 'Chúc mừng! Bạn đã tiết kiệm được 1 triệu đồng từ việc không hút thuốc!',
    icon_url: null
  },
  {
    name: 'Tiết kiệm 5 triệu đồng',
    description: 'Tuyệt vời! Bạn đã tiết kiệm được 5 triệu đồng. Hãy đầu tư vào điều gì đó ý nghĩa!',
    icon_url: null
  },
  {
    name: 'Tiết kiệm 10 triệu đồng',
    description: 'Xuất sắc! 10 triệu đồng đã được tiết kiệm. Đủ để mua một chiếc xe máy mới!',
    icon_url: null
  },
  // Thêm huy hiệu thời gian dài hạn
  {
    name: '6 tháng không hút thuốc',
    description: 'Đã vượt qua 6 tháng không hút thuốc. Sức khỏe của bạn đã cải thiện đáng kể!',
    icon_url: null
  },
  {
    name: '1 năm không hút thuốc',
    description: 'Chúc mừng! Bạn đã hoàn thành 1 năm không hút thuốc. Đây là thành tựu vĩ đại!',
    icon_url: null
  }
];

async function addSavingsAchievements() {
  try {
    console.log('🚀 Bắt đầu thêm huy hiệu tiết kiệm...');
    
    // Kết nối database
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Đã kết nối database');
    
    let addedCount = 0;
    let existingCount = 0;
    
    // Thêm từng huy hiệu
    for (const achievement of savingsAchievements) {
      // Kiểm tra xem huy hiệu đã tồn tại chưa
      const [existing] = await connection.execute(
        'SELECT id FROM achievement WHERE name = ?',
        [achievement.name]
      );
      
      if (existing.length === 0) {
        // Thêm huy hiệu mới
        const [result] = await connection.execute(
          'INSERT INTO achievement (name, description, icon_url) VALUES (?, ?, ?)',
          [achievement.name, achievement.description, achievement.icon_url]
        );
        
        console.log(`✅ Đã thêm: "${achievement.name}" - ID: ${result.insertId}`);
        addedCount++;
      } else {
        console.log(`⚠️ Đã tồn tại: "${achievement.name}"`);
        existingCount++;
      }
    }
    
    // Hiển thị tất cả huy hiệu hiện có
    console.log('\n📋 DANH SÁCH TẤT CẢ HUY HIỆU:');
    const [allAchievements] = await connection.execute(
      'SELECT id, name FROM achievement ORDER BY id'
    );
    
    allAchievements.forEach((ach, index) => {
      console.log(`${index + 1}. ID: ${ach.id} | ${ach.name}`);
    });
    
    // Đóng kết nối
    await connection.end();
    
    console.log(`\n🎉 HOÀN THÀNH!`);
    console.log(`📊 Thống kê:`);
    console.log(`   - Đã thêm mới: ${addedCount} huy hiệu`);
    console.log(`   - Đã tồn tại: ${existingCount} huy hiệu`);
    console.log(`   - Tổng cộng: ${allAchievements.length} huy hiệu`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error('💡 Hãy kiểm tra:');
    console.error('   - MySQL server đang chạy');
    console.error('   - Database "no_smoke" đã được tạo');
    console.error('   - Bảng "achievement" đã tồn tại');
  }
}

// Chạy script
addSavingsAchievements();
