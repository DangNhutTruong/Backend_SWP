import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkDatabase() {
    try {
        console.log('🔍 Checking database tables and data...\n');
        
        // 1. List all tables
        console.log('📋 AVAILABLE TABLES:');
        console.log('═══════════════════════');
        const [tables] = await pool.execute('SHOW TABLES');
        tables.forEach(table => {
            console.log(`📄 ${Object.values(table)[0]}`);
        });
        
        // 2. Check appointment table structure
        console.log('\n🏗️ APPOINTMENT TABLE STRUCTURE:');
        console.log('═══════════════════════════════════');
        try {
            const [columns] = await pool.execute('DESCRIBE appointment');
            columns.forEach(col => {
                console.log(`📝 ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
            });
        } catch (error) {
            console.log('❌ Table "appointment" does not exist');
        }
        
        // 3. Check appointments table structure (if exists)
        console.log('\n🏗️ APPOINTMENTS TABLE STRUCTURE:');
        console.log('════════════════════════════════════');
        try {
            const [columns] = await pool.execute('DESCRIBE appointments');
            columns.forEach(col => {
                console.log(`📝 ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
            });
        } catch (error) {
            console.log('❌ Table "appointments" does not exist');
        }
        
        // 4. Check data in appointment table
        console.log('\n📊 DATA IN APPOINTMENT TABLE:');
        console.log('═══════════════════════════════');
        try {
            const [appointmentData] = await pool.execute('SELECT * FROM appointment ORDER BY created_at DESC LIMIT 5');
            if (appointmentData.length > 0) {
                console.log(`✅ Found ${appointmentData.length} records:`);
                appointmentData.forEach((record, index) => {
                    console.log(`\n📝 Record ${index + 1}:`);
                    console.log(`   ID: ${record.id}`);
                    console.log(`   Coach ID: ${record.coach_id}`);
                    console.log(`   User ID: ${record.user_id}`);
                    console.log(`   Appointment Time: ${record.appointment_time}`);
                    console.log(`   Duration: ${record.duration_minutes} minutes`);
                    console.log(`   Status: ${record.status}`);
                    console.log(`   Created: ${record.created_at}`);
                });
            } else {
                console.log('🔍 No records found in appointment table');
            }
        } catch (error) {
            console.log('❌ Error reading appointment table:', error.message);
        }
        
        // 5. Check data in appointments table (if exists)
        console.log('\n📊 DATA IN APPOINTMENTS TABLE:');
        console.log('════════════════════════════════');
        try {
            const [appointmentsData] = await pool.execute('SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5');
            if (appointmentsData.length > 0) {
                console.log(`✅ Found ${appointmentsData.length} records:`);
                appointmentsData.forEach((record, index) => {
                    console.log(`\n📝 Record ${index + 1}:`);
                    Object.keys(record).forEach(key => {
                        console.log(`   ${key}: ${record[key]}`);
                    });
                });
            } else {
                console.log('🔍 No records found in appointments table');
            }
        } catch (error) {
            console.log('❌ Error reading appointments table:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    } finally {
        await pool.end();
        console.log('\n✅ Database check completed');
    }
}

checkDatabase();
