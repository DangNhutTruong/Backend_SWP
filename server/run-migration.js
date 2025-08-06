// Run migration script
import migrateProgressTable from './src/utils/migrateProgressTable.js';

const runMigration = async () => {
    try {
        console.log('🚀 Starting migration...');
        await migrateProgressTable();
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
