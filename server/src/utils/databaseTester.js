import { pool } from '../config/database.js';

// Test database connection và basic operations
export const testDatabaseConnection = async () => {
  const results = [];
  
  try {
    // Test 1: Basic connection
    const connection = await pool.getConnection();
    results.push({
      test: '✅ Database Connection',
      status: 'SUCCESS',
      message: 'Connected to MySQL successfully'
    });
    connection.release();

    // Test 2: Test query execution
    const [rows] = await pool.execute('SELECT 1 as test');
    if (rows[0].test === 1) {
      results.push({
        test: '✅ Query Execution',
        status: 'SUCCESS',
        message: 'SELECT query executed successfully'
      });
    }

    // Test 3: Check if key tables exist
    const tables = ['users', 'packages', 'achievements', 'coaches'];
    for (const table of tables) {
      try {
        const [tableRows] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        results.push({
          test: `✅ Table: ${table}`,
          status: 'SUCCESS',
          message: `Found ${tableRows[0].count} records`
        });
      } catch (error) {
        results.push({
          test: `❌ Table: ${table}`,
          status: 'FAILED',
          message: error.message
        });
      }
    }

    // Test 4: Test CRUD operations
    try {
      // Insert test record
      const [insertResult] = await pool.execute(
        'INSERT INTO users (username, email, password_hash, full_name, email_verified) VALUES (?, ?, ?, ?, ?)',
        [`test_${Date.now()}`, `test_${Date.now()}@test.com`, 'hashedpassword', 'Test User', true]
      );
      
      const testUserId = insertResult.insertId;
      
      // Read test record
      const [selectResult] = await pool.execute(
        'SELECT * FROM users WHERE id = ?',
        [testUserId]
      );
      
      if (selectResult.length > 0) {
        results.push({
          test: '✅ CRUD Operations',
          status: 'SUCCESS',
          message: 'Insert and Select operations successful'
        });
      }
      
      // Clean up test record
      await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
      
    } catch (error) {
      results.push({
        test: '❌ CRUD Operations',
        status: 'FAILED',
        message: error.message
      });
    }

    // Test 5: Test transaction support
    const connection2 = await pool.getConnection();
    try {
      await connection2.beginTransaction();
      
      await connection2.execute('SELECT 1');
      await connection2.commit();
      
      results.push({
        test: '✅ Transaction Support',
        status: 'SUCCESS',
        message: 'Transaction executed successfully'
      });
    } catch (error) {
      await connection2.rollback();
      results.push({
        test: '❌ Transaction Support',
        status: 'FAILED',
        message: error.message
      });
    } finally {
      connection2.release();
    }

  } catch (error) {
    results.push({
      test: '❌ Database Connection',
      status: 'FAILED',
      message: error.message
    });
  }

  return results;
};

// Test specific database configuration
export const testDatabaseConfig = async () => {
  const results = [];
  
  try {
    // Test connection info
    const [rows] = await pool.execute(`
      SELECT 
        @@hostname as hostname,
        @@port as port,
        DATABASE() as current_database,
        USER() as current_user,
        @@version as mysql_version,
        @@character_set_database as charset
    `);
    
    const info = rows[0];
    
    results.push({
      test: '📊 Database Info',
      status: 'INFO',
      message: `Host: ${info.hostname}, DB: ${info.current_database}, User: ${info.current_user}`
    });
    
    results.push({
      test: '📊 MySQL Version',
      status: 'INFO',
      message: `Version: ${info.mysql_version}, Charset: ${info.charset}`
    });

    // Test connection pool status
    const poolInfo = {
      totalConnections: pool.config.connectionLimit,
      activeConnections: pool._allConnections?.length || 'Unknown',
      freeConnections: pool._freeConnections?.length || 'Unknown'
    };
    
    results.push({
      test: '📊 Connection Pool',
      status: 'INFO',
      message: `Total: ${poolInfo.totalConnections}, Active: ${poolInfo.activeConnections}, Free: ${poolInfo.freeConnections}`
    });

  } catch (error) {
    results.push({
      test: '❌ Database Config Test',
      status: 'FAILED',
      message: error.message
    });
  }

  return results;
};

// Test Railway-specific features
export const testRailwayFeatures = async () => {
  const results = [];
  
  try {
    // Check if we're using Railway (based on environment variables)
    const isRailway = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway');
    
    if (isRailway) {
      results.push({
        test: '🚂 Railway Detection',
        status: 'SUCCESS',
        message: 'Railway database detected'
      });
      
      // Test SSL connection
      const [sslRows] = await pool.execute("SHOW STATUS LIKE 'Ssl_cipher'");
      if (sslRows.length > 0 && sslRows[0].Value) {
        results.push({
          test: '🔒 SSL Connection',
          status: 'SUCCESS',
          message: `SSL Cipher: ${sslRows[0].Value}`
        });
      } else {
        results.push({
          test: '⚠️ SSL Connection',
          status: 'WARNING',
          message: 'SSL connection not detected'
        });
      }
    } else {
      results.push({
        test: '🏠 Local Database',
        status: 'INFO',
        message: 'Using local database configuration'
      });
    }

  } catch (error) {
    results.push({
      test: '❌ Railway Features Test',
      status: 'FAILED',
      message: error.message
    });
  }

  return results;
};

export default {
  testDatabaseConnection,
  testDatabaseConfig,
  testRailwayFeatures
};
