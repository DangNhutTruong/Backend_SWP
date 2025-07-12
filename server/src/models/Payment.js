import { pool } from '../config/database.js';

class Payment {
    static async create(paymentData) {
        const {
            user_id,
            package_id,
            amount,
            method = 'bank_transfer',
            tx_content,
            expected_content,
            bank_code = 'VCB'
        } = paymentData;

        try {
            const [result] = await pool.query(
                `INSERT INTO payments (
                    user_id, package_id, amount, method, tx_content, 
                    expected_content, bank_code, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [user_id, package_id, amount, method, tx_content, expected_content, bank_code]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT p.*, pkg.name as package_name, pkg.type as package_type, u.email, u.username
                 FROM payments p 
                 LEFT JOIN packages pkg ON p.package_id = pkg.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding payment by id:', error);
            throw error;
        }
    }

    static async findByUser(userId, status = null) {
        try {
            let query = `
                SELECT p.*, pkg.name as package_name, pkg.type as package_type
                FROM payments p 
                LEFT JOIN packages pkg ON p.package_id = pkg.id
                WHERE p.user_id = ?
            `;
            let params = [userId];

            if (status) {
                query += ` AND p.status = ?`;
                params.push(status);
            }

            query += ` ORDER BY p.created_at DESC`;

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error finding payments by user:', error);
            throw error;
        }
    }

    static async findByTxContent(txContent) {
        try {
            const [rows] = await pool.query(
                `SELECT p.*, pkg.name as package_name, pkg.type as package_type, u.email, u.username
                 FROM payments p 
                 LEFT JOIN packages pkg ON p.package_id = pkg.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.tx_content = ? OR p.expected_content = ?`,
                [txContent, txContent]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding payment by tx_content:', error);
            throw error;
        }
    }

    static async updateStatus(id, status, verifiedAt = null, transactionId = null) {
        try {
            let query = 'UPDATE payments SET status = ?';
            let params = [status];

            if (verifiedAt) {
                query += ', verified_at = ?';
                params.push(verifiedAt);
            }

            if (transactionId) {
                query += ', transaction_id = ?';
                params.push(transactionId);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const [result] = await pool.query(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating payment status:', error);
            throw error;
        }
    }

    static async findPendingPayments() {
        try {
            const [rows] = await pool.query(
                `SELECT p.*, pkg.name as package_name, pkg.type as package_type, u.email, u.username
                 FROM payments p 
                 LEFT JOIN packages pkg ON p.package_id = pkg.id
                 LEFT JOIN users u ON p.user_id = u.id
                 WHERE p.status = 'pending' 
                 ORDER BY p.created_at DESC`
            );
            return rows;
        } catch (error) {
            console.error('Error finding pending payments:', error);
            throw error;
        }
    }

    static async generateTxContent(userId, packageId) {
        try {
            const timestamp = Date.now().toString().slice(-6);
            const txContent = `NOUPGRADE${userId}${packageId}${timestamp}`;
            return txContent;
        } catch (error) {
            console.error('Error generating tx content:', error);
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const keys = Object.keys(updateData);
            const values = Object.values(updateData);

            if (keys.length === 0) {
                return false;
            }

            const setClause = keys.map(key => `${key} = ?`).join(', ');
            const query = `UPDATE payments SET ${setClause} WHERE id = ?`;

            const [result] = await pool.query(query, [...values, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    }
}

export default Payment;
