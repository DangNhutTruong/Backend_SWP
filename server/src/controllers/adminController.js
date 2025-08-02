import { pool } from '../config/database.js';
import { sendResponse } from '../utils/response.js';

/**
 * Get statistics about coaches
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachStats = async (req, res) => {
    try {
        // Get total number of coaches
        const [totalCoaches] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE role = ?',
            ['coach']
        );
        
        // Get number of active coaches
        const [activeCoaches] = await pool.query(
            'SELECT COUNT(*) as active FROM users WHERE role = ? AND is_active = 1',
            ['coach']
        );
        
        // Get average rating of coaches
        const [avgRating] = await pool.query(
            'SELECT AVG(rating) as avg_rating FROM feedback'
        );
        
        return sendResponse(res, 200, true, 'Coach statistics fetched successfully', {
            totalCoaches: totalCoaches[0].total || 0,
            activeCoaches: activeCoaches[0].active || 0,
            avgRating: avgRating[0].avg_rating ? parseFloat(avgRating[0].avg_rating).toFixed(2) : 0
        });
    } catch (error) {
        console.error('Error fetching coach stats:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get statistics about appointments
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAppointmentStats = async (req, res) => {
    try {
        // Get total appointments
        const [totalAppointments] = await pool.query(
            'SELECT COUNT(*) as total FROM appointments'
        );
        
        // Get upcoming appointments
        const [upcomingAppointments] = await pool.query(
            'SELECT COUNT(*) as upcoming FROM appointments WHERE date > CURDATE() AND status = ?',
            ['confirmed']
        );
        
        // Get completed appointments
        const [completedAppointments] = await pool.query(
            'SELECT COUNT(*) as completed FROM appointments WHERE status = ?',
            ['completed']
        );
        
        // Get cancelled appointments
        const [cancelledAppointments] = await pool.query(
            'SELECT COUNT(*) as cancelled FROM appointments WHERE status = ?',
            ['cancelled']
        );
        
        return sendResponse(res, 200, true, 'Appointment statistics fetched successfully', {
            total: totalAppointments[0].total || 0,
            upcoming: upcomingAppointments[0].upcoming || 0,
            completed: completedAppointments[0].completed || 0,
            cancelled: cancelledAppointments[0].cancelled || 0
        });
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get detailed information about all coaches
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAllCoachesDetails = async (req, res) => {
    try {
        console.log('Fetching all coaches details');
        
        const [rows] = await pool.query(
            `SELECT 
                u.*,
                (SELECT AVG(rating) FROM feedback WHERE coach_id = u.id) as rating,
                (SELECT COUNT(*) FROM appointments WHERE coach_id = u.id) as appointment_count,
                (SELECT COUNT(*) FROM appointments WHERE coach_id = u.id AND status = 'completed') as completed_count,
                (SELECT COUNT(*) FROM feedback WHERE coach_id = u.id) as feedback_count,
                (SELECT COUNT(*) FROM coach_availability WHERE coach_id = u.id) as available_slots_count
            FROM users u
            WHERE u.role = 'coach'
            ORDER BY u.full_name`
        );
        
        console.log('Coach details fetched:', rows.map(r => ({
            id: r.id,
            name: r.full_name,
            appointment_count: r.appointment_count,
            completed_count: r.completed_count
        })));
        
        return sendResponse(res, 200, true, 'Coach details fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching all coaches details:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update coach information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateCoach = async (req, res) => {
    try {
        const { id } = req.params;
        // Handle both isActive and is_active field names
        const { full_name, email, phone, gender, is_active, isActive, bio, experience, specialization } = req.body;
        
        // Log request body to debug
        console.log('Update coach request body:', req.body);
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id, is_active as currentIsActive FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Determine activation status - check both field names and maintain current if not provided
        const providedStatus = is_active !== undefined ? is_active : isActive;
        const activeStatus = providedStatus !== undefined ? (providedStatus ? 1 : 0) : coachRows[0].currentIsActive;
        console.log(`Updating coach ${id} with is_active: ${activeStatus} (provided value: ${providedStatus})`);
        
        // Clean up experience value if it contains text (e.g. "11 năm")
        let experienceValue = experience;
        if (typeof experience === 'string' && experience.includes('năm')) {
            // Extract the numeric part only for database storage
            const numericMatch = experience.match(/^(\d+)/);
            if (numericMatch && numericMatch[1]) {
                experienceValue = numericMatch[1];
                console.log(`Converted experience value "${experience}" to numeric: ${experienceValue}`);
            }
        }
        
        // Update coach information
        await pool.query(
            `UPDATE users
            SET full_name = ?, email = ?, phone = ?, gender = ?, is_active = ?, 
                bio = ?, experience = ?, specialization = ?
            WHERE id = ?`,
            [full_name, email, phone, gender, activeStatus, 
             bio, experienceValue, specialization, id]
        );
        
        return sendResponse(res, 200, true, 'Coach updated successfully', { id });
    } catch (error) {
        console.error('Error updating coach:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create a new coach
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createCoach = async (req, res) => {
    try {
        // Handle both isActive and is_active field names
        const { full_name, email, phone, gender, password, bio, experience, specialization, is_active, isActive } = req.body;
        
        // Log request body to debug
        console.log('Create coach request body:', req.body);
        
        // Check if email already exists
        const [existingUser] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return sendResponse(res, 400, false, 'Email already exists', null);
        }
        
        // Determine activation status - default to active (1) if not specified
        const providedStatus = is_active !== undefined ? is_active : isActive;
        const activeStatus = providedStatus !== undefined ? (providedStatus ? 1 : 0) : 1;
        console.log(`Creating coach with is_active: ${activeStatus} (provided value: ${providedStatus})`);
        
        // Clean up experience value if it contains text (e.g. "11 năm")
        let experienceValue = experience;
        if (typeof experience === 'string' && experience.includes('năm')) {
            // Extract the numeric part only for database storage
            const numericMatch = experience.match(/^(\d+)/);
            if (numericMatch && numericMatch[1]) {
                experienceValue = numericMatch[1];
                console.log(`Converted experience value "${experience}" to numeric: ${experienceValue}`);
            }
        }
        
        // Create new coach
        const [result] = await pool.query(
            `INSERT INTO users (full_name, email, phone, gender, role, password, is_active,
                                bio, experience, specialization)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, phone, gender, 'coach', password, activeStatus,
             bio || null, experienceValue || null, specialization || null]
        );
        
        return sendResponse(res, 201, true, 'Coach created successfully', { id: result.insertId });
    } catch (error) {
        console.error('Error creating coach:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update coach availability
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateCoachAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { available_slots } = req.body;
        
        if (!Array.isArray(available_slots)) {
            return sendResponse(res, 400, false, 'Available slots must be an array', null);
        }

        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Start a transaction
        await pool.query('START TRANSACTION');
        
        try {
            // Delete current availability
            await pool.query(
                'DELETE FROM coach_availability WHERE coach_id = ?',
                [id]
            );
            
            // Insert new availability slots
            for (const slot of available_slots) {
                await pool.query(
                    `INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
                    VALUES (?, ?, ?, ?)`,
                    [id, slot.day_of_week, slot.start_time, slot.end_time]
                );
            }
            
            // Commit transaction
            await pool.query('COMMIT');
            
            return sendResponse(res, 200, true, 'Coach availability updated successfully', { 
                coach_id: parseInt(id),
                available_slots 
            });
        } catch (err) {
            // Rollback on error
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('Error updating coach availability:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get all coach assignments
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachAssignments = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT ca.id, ca.user_id as userId, ca.coach_id as coachId, 
                u_user.full_name as userName, u_coach.full_name as coachName, 
                ca.start_date as startDate, ca.sessions_completed as sessionsCompleted, 
                ca.next_session as nextSession, ca.status
            FROM coach_assignments ca
            JOIN users u_user ON ca.user_id = u_user.id
            JOIN users u_coach ON ca.coach_id = u_coach.id
            ORDER BY ca.start_date DESC`
        );
        
        return sendResponse(res, 200, true, 'Coach assignments fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching coach assignments:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create a new coach assignment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createCoachAssignment = async (req, res) => {
    try {
        const { userId, coachId, nextSession } = req.body;
        
        // Validate request body
        if (!userId || !coachId || !nextSession) {
            return sendResponse(res, 400, false, 'Missing required fields', null);
        }
        
        // Check if user exists and has premium status
        const [userRows] = await pool.query(
            `SELECT u.id, m.status as membership_status 
            FROM users u 
            LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
            WHERE u.id = ?`,
            [userId]
        );
        
        if (userRows.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        if (userRows[0].membership_status !== 'active') {
            return sendResponse(res, 400, false, 'User does not have an active premium membership', null);
        }
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [coachId, 'coach']
        );
        
        if (coachRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        // Check if user already has a coach assigned
        const [existingAssignment] = await pool.query(
            'SELECT id FROM coach_assignments WHERE user_id = ? AND status = ?',
            [userId, 'active']
        );
        
        if (existingAssignment.length > 0) {
            return sendResponse(res, 400, false, 'User already has an active coach assignment', null);
        }
        
        // Create new assignment
        const [result] = await pool.query(
            `INSERT INTO coach_assignments 
                (user_id, coach_id, start_date, next_session, sessions_completed, status)
            VALUES (?, ?, CURDATE(), ?, 0, 'active')`,
            [userId, coachId, nextSession]
        );
        
        // Get the created assignment
        const [newAssignment] = await pool.query(
            `SELECT ca.id, ca.user_id as userId, ca.coach_id as coachId, 
                u_user.full_name as userName, u_coach.full_name as coachName, 
                ca.start_date as startDate, ca.sessions_completed as sessionsCompleted, 
                ca.next_session as nextSession, ca.status
            FROM coach_assignments ca
            JOIN users u_user ON ca.user_id = u_user.id
            JOIN users u_coach ON ca.coach_id = u_coach.id
            WHERE ca.id = ?`,
            [result.insertId]
        );
        
        return sendResponse(res, 201, true, 'Coach assignment created successfully', newAssignment[0]);
    } catch (error) {
        console.error('Error creating coach assignment:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Delete a coach assignment
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteCoachAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if assignment exists
        const [assignmentRows] = await pool.query(
            'SELECT id FROM coach_assignments WHERE id = ?',
            [id]
        );
        
        if (assignmentRows.length === 0) {
            return sendResponse(res, 404, false, 'Coach assignment not found', null);
        }
        
        // Delete the assignment
        await pool.query(
            'DELETE FROM coach_assignments WHERE id = ?',
            [id]
        );
        
        return sendResponse(res, 200, true, 'Coach assignment deleted successfully', { id });
    } catch (error) {
        console.error('Error deleting coach assignment:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get premium users (active membership users)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getPremiumUsers = async (req, res) => {
    try {
        // Get users with active premium membership who don't already have a coach assigned
        const [rows] = await pool.query(
            `SELECT u.id, u.full_name as name, u.email, 'premium' as membershipStatus,
                CASE WHEN ca.id IS NULL THEN FALSE ELSE TRUE END as coachAssigned
            FROM users u
            JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
            LEFT JOIN coach_assignments ca ON u.id = ca.user_id AND ca.status = 'active'
            WHERE u.role = 'user'
            ORDER BY u.full_name`
        );
        
        return sendResponse(res, 200, true, 'Premium users fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching premium users:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get session history for a specific coach
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getCoachSessionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`Getting session history for coach ID: ${id}`);
        
        // Check if coach exists
        const [coachRows] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [id, 'coach']
        );
        
        if (coachRows.length === 0) {
            console.log(`Coach with ID ${id} not found`);
            return sendResponse(res, 404, false, 'Coach not found', null);
        }
        
        console.log(`Found coach with ID ${id}, fetching completed appointments`);
        
        // Get all completed sessions for this coach
        const [rows] = await pool.query(
            `SELECT 
                a.id, a.coach_id as coachId, a.user_id as userId, 
                u.full_name as userName, a.date, a.time,
                a.duration_minutes as duration,
                f.rating
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN feedback f ON (f.coach_id = a.coach_id AND f.smoker_id = a.user_id)
            WHERE a.coach_id = ? AND a.status = 'completed'
            ORDER BY a.date DESC, a.time DESC`,
            [id]
        );
        
        console.log(`Found ${rows.length} completed appointments for coach ID ${id}`);
        
        return sendResponse(res, 200, true, 'Coach session history fetched successfully', rows);
    } catch (error) {
        console.error('Error fetching coach session history:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get all users with filtering and pagination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const queryParams = [];
        
        // Add search filter
        if (search) {
            whereClause += ' AND (full_name LIKE ? OR email LIKE ?)';

            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Add role filter
        if (role) {
            whereClause += ' AND role = ?';
            queryParams.push(role);
        }
        
        // Add status filter
        if (status !== '') {
            whereClause += ' AND is_active = ?';
            queryParams.push(status === 'true' ? 1 : 0);
        }
        
        // Get total count
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            queryParams
        );
        
        // Get users with pagination
        const [users] = await pool.query(
            `SELECT id, username, email, full_name, role, is_active, created_at, updated_at,
                    phone, gender, avatar_url, date_of_birth 
             FROM users ${whereClause} 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );
        
        return sendResponse(res, 200, true, 'Users fetched successfully', {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount[0].total / limit),
                totalUsers: totalCount[0].total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Get user by ID with detailed information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user basic info
        const [users] = await pool.query(
            `SELECT * FROM users WHERE id = ?`,
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        const user = users[0];
        
        // Get user's smoking progress if exists
        let smokingProgress = null;
        try {
            const [progress] = await pool.query(
                `SELECT * FROM smoking_progress WHERE user_id = ? ORDER BY date DESC LIMIT 10`,
                [id]
            );
            smokingProgress = progress;
        } catch (err) {
            console.log('No smoking progress table found or no data');
        }
        
        // Get user's appointments
        let appointments = [];
        try {
            const [userAppointments] = await pool.query(
                `SELECT a.*, u.full_name as coach_name 
                 FROM appointments a 
                 LEFT JOIN users u ON a.coach_id = u.id 
                 WHERE a.user_id = ? 
                 ORDER BY a.date DESC LIMIT 5`,
                [id]
            );
            appointments = userAppointments;
        } catch (err) {
            console.log('No appointments table found or no data');
        }
        
        return sendResponse(res, 200, true, 'User details fetched successfully', {
            user,
            smokingProgress,
            appointments
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Create new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const createUser = async (req, res) => {
    try {
        const { username, email, password, full_name, role = 'user', phone, gender, date_of_birth, is_active = true } = req.body;
        
        // Validate required fields
        if (!username || !email || !password || !full_name) {
            return sendResponse(res, 400, false, 'Username, email, password and full_name are required', null);
        }
        
        // Check if username or email already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return sendResponse(res, 400, false, 'Username or email already exists', null);
        }
        
        // Hash password (assuming you have bcrypt imported)
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password, full_name, role, phone, gender, date_of_birth, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [username, email, hashedPassword, full_name, role, phone, gender, date_of_birth, is_active ? 1 : 0]
        );
        
        return sendResponse(res, 201, true, 'User created successfully', {
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Update user information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role, phone, gender, date_of_birth, is_active } = req.body;
        
        // Check if user exists
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        // Check if username or email already exists for other users
        if (username || email) {
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username || '', email || '', id]
            );
            
            if (existingUsers.length > 0) {
                return sendResponse(res, 400, false, 'Username or email already exists', null);
            }
        }
        
        // Update user
        await pool.query(
            `UPDATE users SET 
                username = ?, email = ?, full_name = ?, role = ?, 
                phone = ?, gender = ?, date_of_birth = ?, 
                is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [username, email, full_name, role, phone, gender, date_of_birth, is_active ? 1 : 0, id]
        );
        
        return sendResponse(res, 200, true, 'User updated successfully', null);
    } catch (error) {
        console.error('Error updating user:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Toggle user status (activate/deactivate)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get current status
        const [users] = await pool.query(
            'SELECT is_active FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        const newStatus = users[0].is_active ? 0 : 1;
        
        // Update status
        await pool.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, id]
        );
        
        return sendResponse(res, 200, true, `User ${newStatus ? 'activated' : 'deactivated'} successfully`, {
            isActive: Boolean(newStatus)
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};

/**
 * Delete user (soft delete)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return sendResponse(res, 404, false, 'User not found', null);
        }
        
        // Soft delete by deactivating
        await pool.query(
            'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
            [id]
        );
        
        return sendResponse(res, 200, true, 'User deleted successfully', null);
    } catch (error) {
        console.error('Error deleting user:', error);
        return sendResponse(res, 500, false, 'Internal server error', null);
    }
};
