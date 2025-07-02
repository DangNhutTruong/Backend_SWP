import sequelize from './src/config/database.js';

const checkNewSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully!');
    
    // Check if tables match new schema
    const tablesToCheck = ['user', 'package', 'register', 'appointment', 'quit_smoking_plan', 'progress'];
    
    for (const table of tablesToCheck) {
      console.log(`\n🔍 Checking table '${table}':`);
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${table}`);
        console.log(`  ✅ Table '${table}' exists with ${columns.length} columns`);
        
        // Show first few columns
        columns.slice(0, 5).forEach(col => {
          console.log(`    - ${col.Field} (${col.Type})`);
        });
        if (columns.length > 5) {
          console.log(`    ... and ${columns.length - 5} more columns`);
        }
      } catch (error) {
        console.log(`  ❌ Table '${table}' not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkNewSchema();
