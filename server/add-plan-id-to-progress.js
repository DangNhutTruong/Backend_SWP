import { pool } from './src/config/database.js';

const addPlanIdToProgress = async () => {
    try {
        console.log('🔧 Adding plan_id column to daily_progress table...');

        // Kiểm tra xem cột plan_id đã tồn tại chưa
        const checkColumnSQL = `
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'daily_progress' 
            AND COLUMN_NAME = 'plan_id'
        `;

        const [rows] = await pool.execute(checkColumnSQL);
        const columnExists = rows[0].count > 0;

        if (columnExists) {
            console.log('✅ Column plan_id already exists in daily_progress table');
            return;
        }

        // Thêm cột plan_id vào bảng daily_progress
        const addColumnSQL = `
            ALTER TABLE daily_progress 
            ADD COLUMN plan_id INT NULL AFTER smoker_id,
            ADD INDEX idx_plan_id (plan_id)
        `;

        await pool.execute(addColumnSQL);
        console.log('✅ Successfully added plan_id column to daily_progress table');

        // Kiểm tra xem bảng quit_smoking_plan có tồn tại không
        const checkTableSQL = `
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'quit_smoking_plan'
        `;

        const [tableRows] = await pool.execute(checkTableSQL);
        const tableExists = tableRows[0].count > 0;

        if (tableExists) {
            // Thêm foreign key constraint nếu bảng quit_smoking_plan tồn tại
            try {
                const addForeignKeySQL = `
                    ALTER TABLE daily_progress 
                    ADD CONSTRAINT fk_daily_progress_plan_id 
                    FOREIGN KEY (plan_id) REFERENCES quit_smoking_plan(id) 
                    ON DELETE SET NULL ON UPDATE CASCADE
                `;

                await pool.execute(addForeignKeySQL);
                console.log('✅ Successfully added foreign key constraint for plan_id');
            } catch (fkError) {
                console.log('⚠️ Could not add foreign key constraint (table structure may be different):', fkError.message);
            }
        } else {
            console.log('⚠️ quit_smoking_plan table does not exist, skipping foreign key constraint');
        }

        console.log('🎉 Database migration completed successfully!');

    } catch (error) {
        console.error('❌ Error adding plan_id column:', error);
        throw error;
    }
};

// Chạy migration
addPlanIdToProgress()
    .then(() => {
        console.log('✅ Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
