import sequelize from './src/config/database.js';

// Test connection and check existing tables
const checkDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully!');

    // Get list of tables
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    results.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });

    // Check structure of some key tables
    const tables = ['user', 'packages', 'quitplan', 'progress'];

    for (const table of tables) {
      console.log(`\n🔍 Structure of table '${table}':`);
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${table}`);
        columns.forEach(col => {
          console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
        });
      } catch (error) {
        console.log(`  ❌ Table '${table}' not found or error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkDatabase();
