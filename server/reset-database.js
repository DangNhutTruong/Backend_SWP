import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabase() {
  try {
    const connection = await mysql2.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Connected to MySQL');

    // Show existing tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Existing tables:', tables);

    // Drop all tables if they exist
    if (tables.length > 0) {
      console.log('🗑️  Dropping existing tables...');
      
      // Disable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`   Dropped table: ${tableName}`);
      }
      
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ All tables dropped successfully');
    } else {
      console.log('ℹ️  No existing tables found');
    }

    await connection.end();
    console.log('✅ Database reset completed. Now restart your server to recreate tables.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  }
}

resetDatabase();
