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

async function deleteAppointmentTable() {
    try {
        console.log('🗑️  DELETING APPOINTMENT TABLE');
        console.log('═══════════════════════════════════════\n');
        
        // 1. Check if appointment table exists
        console.log('🔍 Checking if appointment table exists...');
        const [tables] = await pool.execute("SHOW TABLES LIKE 'appointment'");
        
        if (tables.length === 0) {
            console.log('✅ Table "appointment" does not exist - nothing to delete\n');
            return;
        }
        
        console.log('📋 Found "appointment" table');
        
        // 2. Show data that will be deleted (for confirmation)
        console.log('\n📊 Data in appointment table (will be deleted):');
        try {
            const [appointmentData] = await pool.execute('SELECT COUNT(*) as count FROM appointment');
            console.log(`📝 Found ${appointmentData[0].count} records in appointment table`);
            
            if (appointmentData[0].count > 0) {
                const [records] = await pool.execute('SELECT * FROM appointment LIMIT 5');
                records.forEach((record, index) => {
                    console.log(`   Record ${index + 1}: ID=${record.id}, Coach=${record.coach_id}, User=${record.user_id}, Time=${record.appointment_time}`);
                });
                if (appointmentData[0].count > 5) {
                    console.log(`   ... and ${appointmentData[0].count - 5} more records`);
                }
            }
        } catch (error) {
            console.log('❌ Error reading appointment table data:', error.message);
        }
        
        // 3. Delete the table
        console.log('\n🗑️  Dropping appointment table...');
        await pool.execute('DROP TABLE IF EXISTS appointment');
        console.log('✅ Table "appointment" deleted successfully');
        
        // 4. Verify deletion
        console.log('\n🔍 Verifying deletion...');
        const [tablesAfter] = await pool.execute("SHOW TABLES LIKE 'appointment'");
        if (tablesAfter.length === 0) {
            console.log('✅ Confirmed: "appointment" table no longer exists');
        } else {
            console.log('❌ Error: "appointment" table still exists');
        }
        
        // 5. Show remaining appointments table
        console.log('\n📋 Checking "appointments" table (should still exist):');
        const [appointmentsTables] = await pool.execute("SHOW TABLES LIKE 'appointments'");
        if (appointmentsTables.length > 0) {
            console.log('✅ "appointments" table exists');
            const [appointmentsData] = await pool.execute('SELECT COUNT(*) as count FROM appointments');
            console.log(`📝 "appointments" table has ${appointmentsData[0].count} records`);
        } else {
            console.log('❌ Warning: "appointments" table does not exist');
        }
        
        console.log('\n✅ APPOINTMENT TABLE DELETION COMPLETED');
        console.log('═══════════════════════════════════════');
        
    } catch (error) {
        console.error('\n❌ ERROR DELETING APPOINTMENT TABLE');
        console.error('═══════════════════════════════════════');
        console.error('🚨 Error:', error.message);
        console.error('═══════════════════════════════════════');
    } finally {
        await pool.end();
        console.log('\n✅ Database connection closed');
    }
}

console.log('⚠️  WARNING: This will permanently delete the "appointment" table!');
console.log('📋 Only the "appointments" table will remain.');
console.log('🔄 Starting deletion process...\n');

deleteAppointmentTable();
