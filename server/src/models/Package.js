import { pool } from '../config/database.js';

class Package {
    static async findAll() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM packages WHERE is_active = TRUE ORDER BY price ASC'
            );
            return rows;
        } catch (error) {
            console.error('Error finding all packages:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM packages WHERE id = ? AND is_active = TRUE',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding package by id:', error);
            throw error;
        }
    }

    static async findByType(type) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM packages WHERE type = ? AND is_active = TRUE',
                [type]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding package by type:', error);
            throw error;
        }
    }

    static async create(packageData) {
        const {
            name,
            type,
            description,
            price,
            duration_days = 30,
            features = []
        } = packageData;

        try {
            const [result] = await pool.query(
                'INSERT INTO packages (name, type, description, price, duration_days, features) VALUES (?, ?, ?, ?, ?, ?)',
                [name, type, description, price, duration_days, JSON.stringify(features)]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating package:', error);
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

            // Convert features to JSON string if present
            if (updateData.features) {
                const featureIndex = keys.indexOf('features');
                values[featureIndex] = JSON.stringify(updateData.features);
            }

            const setClause = keys.map(key => `${key} = ?`).join(', ');
            const query = `UPDATE packages SET ${setClause} WHERE id = ?`;

            const [result] = await pool.query(query, [...values, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating package:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.query(
                'UPDATE packages SET is_active = FALSE WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting package:', error);
            throw error;
        }
    }
}

export default Package;
