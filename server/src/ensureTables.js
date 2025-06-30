// Utility to ensure all required tables exist on backend startup
import sequelize from './config/database.js';

const ensureTablesExist = async () => {
  try {
    // Sync all models to create tables if they don't exist
    await sequelize.sync({ alter: false });
    console.log('✅ Database tables ensured successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not ensure database tables:', error.message);
    console.log('Server will continue running...');
  }
};

export default ensureTablesExist;
