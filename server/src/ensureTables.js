// Utility to ensure all required tables exist on backend startup
import { ensureTablesExist } from './controllers/authController.js';
import createQuitPlanTable from './utils/createQuitPlanTable.js';
import createProgressTable from './utils/createProgressTable.js';

const ensureAllTablesExist = async () => {
    await ensureTablesExist(); // Đã bao gồm cả payment & membership tables
    await createQuitPlanTable();
    await createProgressTable();
    console.log('✅ All tables checked and created if needed');
};

export default ensureAllTablesExist;
