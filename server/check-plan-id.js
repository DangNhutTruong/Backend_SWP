// Simple check for plan_id column in daily_progress
import { pool } from './src/config/database.js';

try {
    console.log('🔍 Checking daily_progress table...\n');

    const [columns] = await pool.execute('SHOW COLUMNS FROM daily_progress');

    console.log('📋 All columns in daily_progress:');
    columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    const planIdExists = columns.some(col => col.Field === 'plan_id');
    console.log(`\n🎯 Result: plan_id column ${planIdExists ? 'EXISTS ✅' : 'NOT FOUND ❌'}`);

    if (planIdExists) {
        const planIdCol = columns.find(col => col.Field === 'plan_id');
        console.log('\n📊 plan_id details:');
        console.log(`   Type: ${planIdCol.Type}`);
        console.log(`   Nullable: ${planIdCol.Null}`);
        console.log(`   Key: ${planIdCol.Key || 'None'}`);
        console.log(`   Default: ${planIdCol.Default || 'NULL'}`);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    pool.end();
}
