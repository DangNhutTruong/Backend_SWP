import { pool } from './src/config/database.js';

async function createSampleAppointments() {
    try {
        console.log('📅 Creating sample appointments for coach 20...\n');
        
        // Get user IDs first
        const [users] = await pool.execute('SELECT id, full_name, email FROM users WHERE role = "user" LIMIT 3');
        
        if (users.length === 0) {
            console.log('❌ No users found. Creating a test user...');
            
            // Create a test user
            const [result] = await pool.execute(`
                INSERT INTO users (username, email, password_hash, full_name, role) 
                VALUES (?, ?, ?, ?, ?)
            `, ['testuser', 'testuser@example.com', '$2a$10$example', 'Test User', 'user']);
            
            const userId = result.insertId;
            console.log(`✅ Created test user with ID: ${userId}`);
            
            // Create appointments for this user
            const appointments = [
                {
                    userId: userId,
                    coachId: 20,
                    date: '2025-07-15',
                    time: '10:00',
                    status: 'pending',
                    notes: 'Cuộc hẹn tư vấn cai thuốc lá'
                },
                {
                    userId: userId,
                    coachId: 20,
                    date: '2025-07-16',
                    time: '14:00',
                    status: 'confirmed',
                    notes: 'Theo dõi tiến trình cai thuốc'
                },
                {
                    userId: userId,
                    coachId: 21,
                    date: '2025-07-17',
                    time: '09:00',
                    status: 'completed',
                    notes: 'Tư vấn tâm lý hỗ trợ cai thuốc'
                }
            ];
            
            for (const apt of appointments) {
                await pool.execute(`
                    INSERT INTO appointments (user_id, coach_id, date, time, status, notes, duration_minutes) 
                    VALUES (?, ?, ?, ?, ?, ?, 30)
                `, [apt.userId, apt.coachId, apt.date, apt.time, apt.status, apt.notes]);
                
                console.log(`✅ Created appointment: User ${apt.userId} → Coach ${apt.coachId} on ${apt.date} at ${apt.time} (${apt.status})`);
            }
        } else {
            console.log('👥 Found existing users, using them for appointments...');
            
            const appointments = [
                {
                    userId: users[0].id,
                    coachId: 20,
                    date: '2025-07-15',
                    time: '10:00',
                    status: 'pending',
                    notes: 'Cuộc hẹn tư vấn cai thuốc lá'
                },
                {
                    userId: users[0].id,
                    coachId: 20,
                    date: '2025-07-16',
                    time: '14:00',
                    status: 'confirmed', 
                    notes: 'Theo dõi tiến trình cai thuốc'
                },
                {
                    userId: users.length > 1 ? users[1].id : users[0].id,
                    coachId: 21,
                    date: '2025-07-17',
                    time: '09:00',
                    status: 'completed',
                    notes: 'Tư vấn tâm lý hỗ trợ cai thuốc'
                },
                {
                    userId: users.length > 2 ? users[2].id : users[0].id,
                    coachId: 22,
                    date: '2025-07-18',
                    time: '16:00',
                    status: 'pending',
                    notes: 'Khám và tư vấn phục hồi chức năng'
                }
            ];
            
            for (const apt of appointments) {
                await pool.execute(`
                    INSERT INTO appointments (user_id, coach_id, date, time, status, notes, duration_minutes) 
                    VALUES (?, ?, ?, ?, ?, ?, 30)
                `, [apt.userId, apt.coachId, apt.date, apt.time, apt.status, apt.notes]);
                
                console.log(`✅ Created appointment: User ${apt.userId} (${users.find(u => u.id === apt.userId)?.full_name}) → Coach ${apt.coachId} on ${apt.date} at ${apt.time} (${apt.status})`);
            }
        }
        
        console.log('\n✅ Sample appointments created successfully!');
        
        // Verify the data
        console.log('\n🔍 Verifying coach 20 appointments:');
        const [coach20Appointments] = await pool.execute(`
            SELECT a.*, u.full_name as user_name, u.email as user_email 
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.coach_id = 20
            ORDER BY a.created_at DESC
        `);
        
        console.log(`Found ${coach20Appointments.length} appointments for coach 20:`);
        coach20Appointments.forEach(apt => {
            console.log(`  - ID: ${apt.id}, User: ${apt.user_name}, Date: ${apt.date}, Time: ${apt.time}, Status: ${apt.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

createSampleAppointments();
