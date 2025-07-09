import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import sequelize from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runDailyCheckinMigration = async () => {
  try {
    console.log('🔄 Running DailyCheckin table migration...');
    
    // Read migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'src', 'migrations', '002_create_daily_checkins.sql'),
      'utf8'
    );
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📄 Found ${statements.length} SQL statements to execute...`);
    
    for (const statement of statements) {
      try {
        await sequelize.query(statement);
        console.log('✅ Executed:', statement.substring(0, 80) + '...');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Table already exists, skipping:', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error executing statement:', statement.substring(0, 50) + '...');
          throw error;
        }
      }
    }
    
    console.log('✅ DailyCheckin migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

runDailyCheckinMigration();
