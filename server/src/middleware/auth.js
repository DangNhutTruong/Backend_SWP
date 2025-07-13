import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { sendError } from '../utils/response.js';

export const authenticateToken = async (req, res, next) => {
    try {
        console.log('🔐 AUTH MIDDLEWARE - Request to:', req.path);
        
        const authHeader = req.headers['authorization'];
        console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
        
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            console.log('❌ No token provided');
            return sendError(res, 'Access token is required', 401);
        }

        console.log('🔐 Token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔐 Token decoded for user ID:', decoded.userId);        // Check if user still exists and is active
        const [users] = await pool.execute(
            `SELECT id, username, email, full_name, phone, date_of_birth, gender, 
                    role, email_verified, is_active, created_at 
             FROM users 
             WHERE id = ? AND is_active = true`,
            [decoded.userId]
        );

        if (users.length === 0) {
            console.log('❌ User not found or deactivated');
            return sendError(res, 'User not found or account deactivated', 401);
        }

        console.log('✅ User authenticated:', users[0].username);        // Add user info to request object
        req.user = {
            id: users[0].id,
            username: users[0].username,
            email: users[0].email,
            fullName: users[0].full_name,
            phone: users[0].phone,
            dateOfBirth: users[0].date_of_birth,
            gender: users[0].gender,
            role: users[0].role,
            emailVerified: users[0].email_verified,
            isActive: users[0].is_active,
            createdAt: users[0].created_at
        };

        // Also set userId for backward compatibility
        req.userId = users[0].id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return sendError(res, 'Invalid token', 401);
        }
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Token expired', 401);
        }
        console.error('Auth middleware error:', error);
        return sendError(res, 'Authentication failed', 500);
    }
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); const [users] = await pool.execute(
                `SELECT id, username, email, full_name, phone, date_of_birth, gender, 
                        role, email_verified, is_active, created_at 
                 FROM users 
                 WHERE id = ? AND is_active = true`,
                [decoded.userId]
            ); if (users.length > 0) {
                req.user = {
                    id: users[0].id,
                    username: users[0].username,
                    email: users[0].email,
                    fullName: users[0].full_name,
                    phone: users[0].phone,
                    dateOfBirth: users[0].date_of_birth,
                    gender: users[0].gender,
                    role: users[0].role,
                    emailVerified: users[0].email_verified,
                    isActive: users[0].is_active,
                    createdAt: users[0].created_at
                };

                // Also set userId for backward compatibility
                req.userId = users[0].id;
            }
        }

        next();
    } catch (error) {
        // For optional auth, continue even if token is invalid
        next();
    }
};
