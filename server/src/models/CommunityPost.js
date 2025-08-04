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
            // Run database migration for thumbnail_url column
            const migrationPath = path.join(__dirname, '..', 'scripts', 'update-community-posts-schema.sql');
            
            try {
                const migrationSql = fs.readFileSync(migrationPath, 'utf8');
                await pool.query(migrationSql);
                console.log('✅ Blog post table migration completed');
            } catch (migrationError) {
                console.log('ℹ️ Migration script not found or already applied');
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
            const { smoker_id, title, content, thumbnail_url, achievements } = postData;
            
            console.log('🔍 Creating post with data:', { 
                smoker_id, 
                title, 
                content: content?.substring(0, 50), 
                thumbnail_size: thumbnail_url ? thumbnail_url.length : null,
                achievements_count: achievements ? achievements.length : 0,
                achievements_sample: achievements ? achievements[0] : null,
                achievements_type: typeof achievements,
                achievements_isArray: Array.isArray(achievements)
            });

            // Check achievements data type and serialize properly
            let achievementsJson = null;
            if (achievements) {
                console.log('🔍 Raw achievements received:', achievements);
                console.log('🔍 Type of achievements:', typeof achievements);
                console.log('🔍 Is Array:', Array.isArray(achievements));
                
                if (Array.isArray(achievements) && achievements.length > 0) {
                    achievementsJson = JSON.stringify(achievements);
                } else if (typeof achievements === 'string') {
                    // Already a JSON string
                    achievementsJson = achievements;
                } else if (typeof achievements === 'object') {
                    // Convert object to JSON string
                    achievementsJson = JSON.stringify(achievements);
                }
            }
            
            // Test if achievements column exists
            try {
                await pool.query('SELECT achievements FROM blog_post LIMIT 1');
            } catch (columnError) {
                // Try to add the column if it doesn't exist
                try {
                    await pool.query('ALTER TABLE blog_post ADD COLUMN achievements JSON NULL');
                } catch (alterError) {
                    console.error('Could not add achievements column:', alterError.message);
                }
            }
            
            const [result] = await pool.query(
                `INSERT INTO blog_post (smoker_id, title, content, thumbnail_url, \`achievements\`) 
                 VALUES (?, ?, ?, ?, ?)`,
                [smoker_id, title, content, thumbnail_url, achievementsJson]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('Failed to insert post');
            }

            // Get the created post with user information
            const createdPost = await this.findById(result.insertId);
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
                    u.avatar_url
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 ORDER BY bp.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            // Format data for frontend
            const formattedPosts = posts.map(post => {
                // Parse achievements JSON if present
                let achievements = null;
                if (post.achievements) {
                    try {
                        if (typeof post.achievements === 'string') {
                            // Check if it's a malformed object string
                            if (post.achievements.includes('[object Object]')) {
                                console.warn('Found malformed achievement data for post', post.id, '- skipping');
                                achievements = null;
                            } else {
                                achievements = JSON.parse(post.achievements);
                            }
                        } else if (typeof post.achievements === 'object') {
                            // Already an object, use directly
                            achievements = post.achievements;
                        }
                    } catch (error) {
                        console.warn('Error parsing achievements JSON for post', post.id, error);
                        achievements = null;
                    }
                }

                return {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    thumbnail_url: post.thumbnail_url,
                    achievements: achievements,
                    created_at: post.created_at,
                    updated_at: post.updated_at,
                    likes_count: 0,
                    comments_count: 0,
                    user_id: post.smoker_id,
                    user_name: post.full_name || post.username || 'Anonymous',
                    user_avatar: post.avatar_url || '/image/default-user-avatar.svg'
                };
            });

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
                    u.avatar_url
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 WHERE bp.id = ?`,
                [id]
            );

            if (posts.length === 0) return null;

            const post = posts[0];
            
            // Parse achievements JSON if present
            let achievements = null;
            if (post.achievements) {
                try {
                    if (typeof post.achievements === 'string') {
                        // Check if it's a malformed object string
                        if (post.achievements.includes('[object Object]')) {
                            achievements = null;
                        } else {
                            achievements = JSON.parse(post.achievements);
                        }
                    } else if (typeof post.achievements === 'object') {
                        // Already an object, use directly
                        achievements = post.achievements;
                    }
                    console.log('✅ Parsed achievements:', achievements);
                } catch (error) {
                    console.warn('Error parsing achievements JSON for post', post.id, error);
                    achievements = null;
                }
            } else {
                console.log('❌ No achievements data found');
            }
            
            // Format data for frontend
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                thumbnail_url: post.thumbnail_url,
                achievements: achievements,
                created_at: post.created_at,
                updated_at: post.updated_at,
                likes_count: 0,
                comments_count: 0,
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
                    u.avatar_url
                 FROM blog_post bp
                 LEFT JOIN users u ON bp.smoker_id = u.id
                 WHERE bp.smoker_id = ?
                 ORDER BY bp.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            // Format data for frontend
            const formattedPosts = posts.map(post => {
                // Parse achievements JSON if present
                let achievements = null;
                if (post.achievements) {
                    try {
                        if (typeof post.achievements === 'string') {
                            // Check if it's a malformed object string
                            if (post.achievements.includes('[object Object]')) {
                                console.warn('Found malformed achievement data for post', post.id, '- skipping');
                                achievements = null;
                            } else {
                                achievements = JSON.parse(post.achievements);
                            }
                        } else if (typeof post.achievements === 'object') {
                            // Already an object, use directly
                            achievements = post.achievements;
                        }
                    } catch (error) {
                        console.warn('Error parsing achievements JSON for post', post.id, error);
                        achievements = null;
                    }
                }

                return {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    thumbnail_url: post.thumbnail_url,
                    achievements: achievements,
                    created_at: post.created_at,
                    updated_at: post.updated_at,
                    likes_count: 0,
                    comments_count: 0,
                    user_id: post.smoker_id,
                    user_name: post.full_name || post.username || 'Anonymous',
                    user_avatar: post.avatar_url || '/image/default-user-avatar.svg'
                };
            });

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
