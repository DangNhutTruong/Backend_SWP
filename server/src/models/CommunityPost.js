import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Blog Posts Model
 * Handles database operations for blog posts (community posts)
 */
class CommunityPost {
    /**
     * Ensure community posts tables exist
     */
    static async ensureTables() {
        try {
            const sqlPath = path.join(__dirname, '..', 'scripts', 'create-community-posts-table.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            // Split by semicolon and execute each statement
            const statements = sql.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await pool.query(statement);
                }
            }
            
            console.log('✅ Community posts tables ensured');
        } catch (error) {
            console.error('❌ Error ensuring community posts tables:', error);
            throw error;
        }
    }

    /**
     * Create a new community post
     * @param {Object} postData - Post data
     * @param {number} postData.smoker_id - ID of the user creating the post
     * @param {string} postData.title - Post title
     * @param {string} postData.content - Post content
     * @param {string} [postData.thumbnail_url] - Post thumbnail URL (optional)
     * @returns {Promise<Object>} Created post
     */
    static async create(postData) {
        try {
            const { smoker_id, title, content, thumbnail_url } = postData;
            
            console.log('🔍 Creating post with data:', { smoker_id, title, content: content?.substring(0, 50), thumbnail_url });
            
            const [result] = await pool.query(
                `INSERT INTO blog_post (smoker_id, title, content, thumbnail_url) 
                 VALUES (?, ?, ?, ?)`,
                [smoker_id, title, content, thumbnail_url]
            );
            
            console.log('🆔 Insert result:', result);
            console.log('📝 New post ID:', result.insertId);
            console.log('🔢 Affected rows:', result.affectedRows);

            if (result.affectedRows === 0) {
                console.error('❌ No rows were inserted!');
                throw new Error('Failed to insert post');
            }

            // Verify the post was actually inserted
            console.log('🔍 Verifying post insertion...');
            const [verifyResult] = await pool.query(
                'SELECT * FROM blog_post WHERE id = ?',
                [result.insertId]
            );
            console.log('✅ Verification query result:', verifyResult);

            // Get the created post with user information
            const createdPost = await this.findById(result.insertId);
            console.log('📖 Retrieved post:', createdPost);
            return createdPost;
        } catch (error) {
            console.error('Error creating community post:', error);
            throw error;
        }
    }

    /**
     * Get all community posts with user information
     * @param {Object} options - Query options
     * @param {number} [options.limit=20] - Number of posts to return
     * @param {number} [options.offset=0] - Offset for pagination
     * @returns {Promise<Array>} Array of posts
     */
    static async findAll(options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;
            
            const [posts] = await pool.query(
                `SELECT 
                    bp.*,
                    u.username,
                    u.full_name,
                    u.avatar_url,
                    NULL as membership,
                    NULL as membershipType,
                    0 as likes_count,
                    0 as comments_count
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 ORDER BY bp.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            // Format data for frontend
            const formattedPosts = posts.map(post => ({
                id: post.id,
                title: post.title,
                content: post.content,
                thumbnail_url: post.thumbnail_url,
                created_at: post.created_at,
                updated_at: post.updated_at,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                user_id: post.smoker_id,
                user_name: post.full_name || post.username || 'Anonymous',
                user_avatar: post.avatar_url || '/image/default-user-avatar.svg'
            }));

            return formattedPosts;
        } catch (error) {
            console.error('Error fetching community posts:', error);
            throw error;
        }
    }

    /**
     * Get a single post by ID
     * @param {number} id - Post ID
     * @returns {Promise<Object|null>} Post data or null if not found
     */
    static async findById(id) {
        try {
            const [posts] = await pool.query(
                `SELECT 
                    bp.*,
                    u.username,
                    u.full_name,
                    u.avatar_url,
                    NULL as membership,
                    NULL as membershipType,
                    0 as likes_count,
                    0 as comments_count
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 WHERE bp.id = ?`,
                [id]
            );

            if (posts.length === 0) return null;

            const post = posts[0];
            // Format data for frontend
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                thumbnail_url: post.thumbnail_url,
                created_at: post.created_at,
                updated_at: post.updated_at,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                user_id: post.smoker_id,
                user_name: post.full_name || post.username || 'Anonymous',
                user_avatar: post.avatar_url || '/image/default-user-avatar.svg'
            };
        } catch (error) {
            console.error('Error fetching community post by ID:', error);
            throw error;
        }
    }

    /**
     * Get posts by user ID
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of user's posts
     */
    static async findByUserId(userId, options = {}) {
        try {
            const { limit = 20, offset = 0 } = options;
            
            const [posts] = await pool.query(
                `SELECT 
                    bp.*,
                    u.username,
                    u.full_name,
                    u.avatar_url,
                    NULL as membership,
                    NULL as membershipType,
                    0 as likes_count,
                    0 as comments_count
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 WHERE bp.smoker_id = ?
                 ORDER BY bp.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // Format data for frontend
            const formattedPosts = posts.map(post => ({
                id: post.id,
                title: post.title,
                content: post.content,
                thumbnail_url: post.thumbnail_url,
                created_at: post.created_at,
                updated_at: post.updated_at,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                user_id: post.smoker_id,
                user_name: post.full_name || post.username || 'Anonymous',
                user_avatar: post.avatar_url || '/image/default-user-avatar.svg'
            }));

            return formattedPosts;
        } catch (error) {
            console.error('Error fetching user posts:', error);
            throw error;
        }
    }

    /**
     * Update a community post
     * @param {number} id - Post ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated post or null if not found
     */
    static async update(id, updateData) {
        try {
            const { title, content, thumbnail_url } = updateData;
            
            const [result] = await pool.query(
                `UPDATE blog_post 
                 SET title = COALESCE(?, title), 
                     content = COALESCE(?, content), 
                     thumbnail_url = COALESCE(?, thumbnail_url),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [title, content, thumbnail_url, id]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error updating community post:', error);
            throw error;
        }
    }

    /**
     * Delete a community post
     * @param {number} id - Post ID
     * @param {number} userId - User ID (for authorization)
     * @returns {Promise<boolean>} True if deleted, false if not found or unauthorized
     */
    static async delete(id, userId) {
        try {
            // First check if post exists and belongs to user
            const post = await this.findById(id);
            if (!post || post.user_id !== userId) {
                console.log(`Delete check failed - Post exists: ${!!post}, User match: ${post?.user_id === userId}`);
                return false;
            }

            const [result] = await pool.query(
                'DELETE FROM blog_post WHERE id = ? AND smoker_id = ?',
                [id, userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting community post:', error);
            throw error;
        }
    }

    /**
     * Get total count of posts
     * @returns {Promise<number>} Total count
     */
    static async getCount() {
        try {
            const [result] = await pool.query(
                'SELECT COUNT(*) as count FROM blog_post'
            );
            return result[0].count;
        } catch (error) {
            console.error('Error getting posts count:', error);
            throw error;
        }
    }
}

export default CommunityPost;
