// Simple MySQL connection test
import mysql2 from 'mysql2/promise';

async function testMySQL() {
  const configs = [
    { 
      host: 'localhost', 
      user: 'root', 
      password: '12345', 
      database: 'SmokingCessationSupportPlatform',
      port: 3306 
    },
    { 
      host: 'localhost', 
      user: 'root', 
      password: '', 
      database: 'SmokingCessationSupportPlatform',
      port: 3306 
    },
    { 
      host: '127.0.0.1', 
      user: 'root', 
      password: '12345', 
      database: 'SmokingCessationSupportPlatform',
      port: 3306 
    }
  ];

  for (const [index, config] of configs.entries()) {
    console.log(`\n--- Testing config ${index + 1} ---`);
    console.log('Config:', { ...config, password: config.password ? '[HIDDEN]' : '[EMPTY]' });
    
    try {
      const connection = await mysql2.createConnection(config);
      console.log('✅ Connection successful!');
      
      const [result] = await connection.execute('SELECT VERSION() as version');
      console.log('✅ MySQL version:', result[0].version);
      
      await connection.end();
      console.log('✅ Connection closed successfully');
      return config; // Return successful config
    } catch (error) {
      console.log('❌ Connection failed:', error.code, '-', error.message);
    }
  }
  
  console.log('\n❌ All connection attempts failed');
  return null;
}

testMySQL()
  .then(config => {
    if (config) {
      console.log('\n🎉 Successful configuration found!');
      console.log('Use this in your .env file:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      console.log(`DB_NAME=${config.database}`);
      console.log(`DB_PORT=${config.port}`);
    }
  })
  .catch(console.error);
