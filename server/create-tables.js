import { ensureCoachTables } from './src/models/CoachTables.js';

async function run() {
  try {
    await ensureCoachTables();
    console.log('✅ Coach tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

run();
