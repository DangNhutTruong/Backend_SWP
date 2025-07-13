import { pool } from './src/config/database.js';

async function testData() {
    try {
        console.log('🔍 Testing database connections...\n');
        
        // Test coach accounts
        console.log('👨‍⚕️ Coach accounts:');
        const [coaches] = await pool.execute('SELECT id, email, full_name, role FROM users WHERE role = "coach"');
        coaches.forEach(coach => {
            console.log(`  - ID: ${coach.id}, Email: ${coach.email}, Name: ${coach.full_name}`);
        });
        
        console.log('\n📅 Appointments:');
        const [appointments] = await pool.execute(`
            SELECT a.*, u.full_name as user_name, u.email as user_email 
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 10
        `);
        
        console.log(`Total appointments: ${appointments.length}`);
        appointments.forEach(apt => {
            console.log(`  - ID: ${apt.id}, User: ${apt.user_name}, Coach ID: ${apt.coach_id}, Date: ${apt.date}, Status: ${apt.status}`);
        });
        
        // Test coach 20 specifically
        console.log('\n🎯 Coach 20 appointments:');
        const [coach20Appointments] = await pool.execute(`
            SELECT a.*, u.full_name as user_name, u.email as user_email 
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.coach_id = 20
            ORDER BY a.created_at DESC
        `);
        
        console.log(`Coach 20 has ${coach20Appointments.length} appointments:`);
        coach20Appointments.forEach(apt => {
            console.log(`  - ID: ${apt.id}, User: ${apt.user_name}, Date: ${apt.date}, Status: ${apt.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

testData();
