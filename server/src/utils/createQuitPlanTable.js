import { pool } from '../config/database.js';

export const createQuitPlanTable = async () => {
    try {
        // Create quit_smoking_plan table if it doesn't exist
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS quit_smoking_plan (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_name VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                initial_cigarettes INT NOT NULL,
                strategy ENUM('gradual', 'aggressive', 'cold_turkey') DEFAULT 'gradual',
                goal VARCHAR(255),
                weeks JSON,
                total_weeks INT NOT NULL,
                status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ quit_smoking_plan table created or already exists');
    } catch (error) {
        console.error('❌ Error creating quit_smoking_plan table:', error);
    }
};

export default createQuitPlanTable;
