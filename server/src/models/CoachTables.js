import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ensureCoachTables = async () => {
    try {
        console.log('🛠️ Ensuring coach tables exist...');
        
        // Read SQL scripts
        const coachSqlPath = path.join(__dirname, '..', 'scripts', 'create-coach-tables.sql');
        const appointmentSqlPath = path.join(__dirname, '..', 'scripts', 'create-appointment-tables.sql');
        const assignmentSqlPath = path.join(__dirname, '..', 'scripts', 'create-coach-assignment-tables.sql');
        
        const coachSql = fs.readFileSync(coachSqlPath, 'utf8');
        const appointmentSql = fs.readFileSync(appointmentSqlPath, 'utf8');
        const assignmentSql = fs.readFileSync(assignmentSqlPath, 'utf8');
        
        // Combine all SQL scripts
        const combinedSql = coachSql + '\n' + appointmentSql + '\n' + assignmentSql;
        
        // Split statements by semicolon
        const statements = combinedSql
            .split(';')
            .filter(statement => statement.trim())
            .map(statement => statement.trim());
        
        // Execute each statement
        for (const statement of statements) {
            try {
                await pool.query(statement);
                console.log('✓ Successfully executed SQL statement');
            } catch (err) {
                // Handle errors for specific statements
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️ Column already exists, skipping:', err.message);
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠️ Table already exists, skipping:', err.message);
                } else if (err.code === 'ER_DUP_KEYNAME') {
                    console.log('⚠️ Index already exists, skipping:', err.message);
                } else {
                    console.error('❌ Error executing SQL statement:', err);
                    console.error('Statement was:', statement);
                    // Don't throw here, try to continue with other statements
                }
            }
        }
        
        console.log('✅ Coach tables checked/created successfully');
    } catch (error) {
        console.error('❌ Error ensuring coach tables:', error);
        throw error;
    }
};