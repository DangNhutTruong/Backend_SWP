import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
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

async function createCoachAccounts() {
    try {
        console.log('👨‍⚕️ CREATING COACH ACCOUNTS');
        console.log('═══════════════════════════════════════\n');

        const coachAccounts = [
            {
                id: 1,
                username: 'coach1',
                email: 'coach1@nosmoke.com',
                password: 'coach123',
                full_name: 'Nguyên Văn A',
                role: 'coach',
                phone: '0901234567'
            },
            {
                id: 2,
                username: 'coach2', 
                email: 'coach2@nosmoke.com',
                password: 'coach123',
                full_name: 'Trần Thị B',
                role: 'coach',
                phone: '0901234568'
            },
            {
                id: 3,
                username: 'coach3',
                email: 'coach3@nosmoke.com', 
                password: 'coach123',
                full_name: 'Phạm Minh C',
                role: 'coach',
                phone: '0901234569'
            }
        ];

        for (const coach of coachAccounts) {
            console.log(`👨‍⚕️ Creating coach: ${coach.full_name}`);
            
            // Check if coach already exists
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [coach.email, coach.username]
            );

            if (existing.length > 0) {
                console.log(`   ⚠️  Coach ${coach.full_name} already exists, updating...`);
                
                // Update existing coach
                const hashedPassword = await bcrypt.hash(coach.password, 12);
                await pool.execute(
                    `UPDATE users SET 
                     username = ?, full_name = ?, role = ?, phone = ?, 
                     password_hash = ?, email_verified = TRUE, is_active = TRUE
                     WHERE email = ?`,
                    [coach.username, coach.full_name, coach.role, coach.phone, hashedPassword, coach.email]
                );
                console.log(`   ✅ Updated coach: ${coach.full_name}`);
            } else {
                // Create new coach
                const hashedPassword = await bcrypt.hash(coach.password, 12);
                await pool.execute(
                    `INSERT INTO users (
                        username, email, password_hash, full_name, phone, role, 
                        email_verified, is_active, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, NOW(), NOW())`,
                    [coach.username, coach.email, hashedPassword, coach.full_name, coach.phone, coach.role]
                );
                console.log(`   ✅ Created coach: ${coach.full_name}`);
            }
        }

        // Verify coaches were created
        console.log('\n🔍 Verifying coach accounts...');
        const [coaches] = await pool.execute(
            "SELECT id, username, email, full_name, role FROM users WHERE role = 'coach'"
        );

        console.log('✅ Coach accounts in database:');
        coaches.forEach(coach => {
            console.log(`   ID: ${coach.id} | ${coach.full_name} | ${coach.email} | ${coach.username}`);
        });

        console.log('\n✅ COACH ACCOUNTS SETUP COMPLETED');
        console.log('═══════════════════════════════════════');
        console.log('📝 Login credentials:');
        console.log('   Email: coach1@nosmoke.com | Password: coach123');
        console.log('   Email: coach2@nosmoke.com | Password: coach123'); 
        console.log('   Email: coach3@nosmoke.com | Password: coach123');

    } catch (error) {
        console.error('\n❌ ERROR CREATING COACH ACCOUNTS');
        console.error('═══════════════════════════════════════');
        console.error('🚨 Error:', error.message);
        console.error('═══════════════════════════════════════');
    } finally {
        await pool.end();
        console.log('\n✅ Database connection closed');
    }
}

createCoachAccounts();
