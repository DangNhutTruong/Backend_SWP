import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const migrationSQL = `
-- Thêm các field mới cho Authentication APIs
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER password,
ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN password_reset_token VARCHAR(255) NULL AFTER password_reset_token,
ADD COLUMN password_reset_expires DATETIME NULL AFTER password_reset_token,
ADD COLUMN refresh_token TEXT NULL AFTER password_reset_expires;

-- Set existing users as email verified
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
`;

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to Railway MySQL...');
    
    // Parse DATABASE_URL from .env
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    // Parse mysql://user:password@host:port/database
    const url = new URL(databaseUrl);
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port),
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remove leading /
    };
    
    console.log('🔗 Connection config:', {
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      database: connectionConfig.database
    });

    connection = await mysql.createConnection(connectionConfig);

    console.log('✅ Connected to database');

    // Check current table structure
    console.log('🔍 Checking current table structure...');
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Current columns:', columns.map(col => col.Field));

    // Check if columns already exist
    const existingColumns = columns.map(col => col.Field);
    const newColumns = ['email_verified', 'email_verification_token', 'password_reset_token', 'password_reset_expires', 'refresh_token'];
    
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));
    
    if (columnsToAdd.length === 0) {
      console.log('✅ All authentication columns already exist!');
      return;
    }

    console.log('🔧 Columns to add:', columnsToAdd);

    // Add columns one by one to avoid errors
    for (const column of columnsToAdd) {
      let sql = '';
      switch (column) {
        case 'email_verified':
          sql = 'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER password';
          break;
        case 'email_verification_token':
          sql = 'ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified';
          break;
        case 'password_reset_token':
          sql = 'ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL AFTER email_verification_token';
          break;
        case 'password_reset_expires':
          sql = 'ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL AFTER password_reset_token';
          break;
        case 'refresh_token':
          sql = 'ALTER TABLE users ADD COLUMN refresh_token TEXT NULL AFTER password_reset_expires';
          break;
      }
      
      try {
        await connection.execute(sql);
        console.log(`✅ Added column: ${column}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Column ${column} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Update existing users
    console.log('🔧 Setting existing users as email verified...');
    await connection.execute('UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL');

    // Verify final structure
    console.log('🔍 Final table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE users');
    finalColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('📝 Database connection closed');
    }
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
