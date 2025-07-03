import sequelize from './src/config/database.js';
import DailyCheckin from './src/models/DailyCheckin.js';
import User from './src/models/User.js';

async function runProgressMigration() {
  try {
    console.log('🚀 Starting Progress Tracking migration...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync DailyCheckin model (create table if not exists)
    await DailyCheckin.sync({ alter: true });
    console.log('✅ daily_checkins table created/updated successfully');
    
    // Check if table exists and has correct structure
    const [results] = await sequelize.query("DESCRIBE daily_checkins");
    console.log('📋 Table structure:');
    console.table(results);
    
    console.log('🎉 Progress Tracking migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runProgressMigration();
