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

async function createTestAppointment() {
    try {
        console.log('🧪 CREATING TEST APPOINTMENT');
        console.log('═══════════════════════════════════════\n');
        
        // Create a test appointment with all attributes
        const testAppointment = {
            coach_id: 1,
            user_id: 18, // User ID from your previous data
            date: '2025-07-14',
            time: '15:00',
            duration_minutes: 60,
            status: 'pending',
            notes: 'Buổi tư vấn đầu tiên về kế hoạch cai thuốc lá',
            rating: null,
            review_text: null
        };

        console.log('📝 Test appointment data:');
        console.log('   Coach ID:', testAppointment.coach_id);
        console.log('   User ID:', testAppointment.user_id);
        console.log('   Date:', testAppointment.date);
        console.log('   Time:', testAppointment.time);
        console.log('   Notes:', testAppointment.notes);

        const [result] = await pool.execute(
            `INSERT INTO appointments (
                coach_id, user_id, date, time, duration_minutes, status, notes, rating, review_text, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                testAppointment.coach_id,
                testAppointment.user_id,
                testAppointment.date,
                testAppointment.time,
                testAppointment.duration_minutes,
                testAppointment.status,
                testAppointment.notes,
                testAppointment.rating,
                testAppointment.review_text
            ]
        );

        console.log('\n✅ Test appointment created successfully');
        console.log('🆔 Appointment ID:', result.insertId);

        // Verify the data
        console.log('\n🔍 Verifying created appointment...');
        const [appointments] = await pool.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [result.insertId]
        );

        if (appointments.length > 0) {
            const appointment = appointments[0];
            console.log('✅ Appointment verified:');
            console.log('   ID:', appointment.id);
            console.log('   Coach ID:', appointment.coach_id);
            console.log('   User ID:', appointment.user_id);
            console.log('   Date:', appointment.date);
            console.log('   Time:', appointment.time);
            console.log('   Status:', appointment.status);
            console.log('   Notes:', appointment.notes);
            console.log('   Rating:', appointment.rating);
            console.log('   Review Text:', appointment.review_text);
            console.log('   Created:', appointment.created_at);
        }

        // Check total appointments for this coach
        console.log('\n📊 Total appointments for coach 1:');
        const [coachAppointments] = await pool.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE coach_id = 1'
        );
        console.log('   Count:', coachAppointments[0].count);

        console.log('\n✅ TEST COMPLETED');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ ERROR CREATING TEST APPOINTMENT');
        console.error('═══════════════════════════════════════');
        console.error('🚨 Error:', error.message);
        console.error('═══════════════════════════════════════');
    } finally {
        await pool.end();
        console.log('\n✅ Database connection closed');
    }
}

createTestAppointment();
