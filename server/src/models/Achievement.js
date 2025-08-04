import { pool } from '../config/database.js';

class Achievement {
    /**
     * Bảng đã tồn tại trong database (achievement và user_achievement)
     * Không cần tạo mới
     */
    static async ensureTables() {
        try {
            // Bảng đã tồn tại, chỉ log thông báo
            console.log('✅ Sử dụng bảng achievement và user_achievement hiện có');
            
            console.log('✅ Achievement tables ensured');
        } catch (error) {
            console.error('❌ Error ensuring achievement tables:', error);
            throw error;
        }
    }

    /**
     * Get all achievements
     */
    static async findAll() {
        try {
            const [rows] = await pool.query('SELECT * FROM achievement ORDER BY id ASC');
            return rows;
        } catch (error) {
            console.error('Error fetching all achievements:', error);
            throw error;
        }
    }

    /**
     * Get achievement by ID
     */
    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM achievement WHERE id = ?', [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching achievement by id:', error);
            throw error;
        }
    }

    /**
     * Get all achievements for a user
     */
    static async findByUserId(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT a.*, ua.achieved_at
                FROM achievement a
                JOIN user_achievement ua ON a.id = ua.achievement_id
                WHERE ua.smoker_id = ?
                ORDER BY ua.achieved_at DESC
            `, [userId]);
            
            return rows;
        } catch (error) {
            console.error('Error fetching achievements for user:', error);
            throw error;
        }
    }

    /**
     * Add an achievement to a user
     */
    static async awardToUser(userId, achievementId) {
        try {
            // Kiểm tra xem người dùng đã có huy hiệu này chưa
            const [existing] = await pool.query(
                'SELECT id FROM user_achievement WHERE smoker_id = ? AND achievement_id = ?',
                [userId, achievementId]
            );
            
            // Nếu đã có, trả về thông tin huy hiệu
            if (existing.length > 0) {
                return await this.findById(achievementId);
            }
            
            // Nếu chưa có, thêm mới
            await pool.query(
                'INSERT INTO user_achievement (smoker_id, achievement_id) VALUES (?, ?)',
                [userId, achievementId]
            );
            
            return await this.findById(achievementId);
        } catch (error) {
            console.error('Error awarding achievement to user:', error);
            throw error;
        }
    }

    /**
     * Check if a user has a specific achievement
     */
    static async userHasAchievement(userId, achievementId) {
        try {
            const [rows] = await pool.query(
                'SELECT id FROM user_achievement WHERE smoker_id = ? AND achievement_id = ?',
                [userId, achievementId]
            );
            
            return rows.length > 0;
        } catch (error) {
            console.error('Error checking if user has achievement:', error);
            throw error;
        }
    }
    
    /**
     * Create default achievements if they don't exist
     */
    static async ensureDefaultAchievements() {
        try {
            const [existingRows] = await pool.query('SELECT COUNT(*) as count FROM achievement');
            
            if (existingRows[0].count === 0) {
                console.log('🏆 Creating default achievements...');
                
                // Mảng các thành tựu mặc định
                const defaultAchievements = [
                    // Thành tựu theo thời gian
                    {
                        name: '24 giờ không hút thuốc',
                        description: 'Đã vượt qua 24 giờ đầu tiên không hút thuốc. Cơ thể bạn đang bắt đầu quá trình hồi phục!',
                        icon_url: '/achievements/24-hours.png'
                    },
                    {
                        name: '3 ngày không hút thuốc',
                        description: 'Đã vượt qua 3 ngày không hút thuốc. Nicotine đã rời khỏi cơ thể bạn hoàn toàn!',
                        icon_url: '/achievements/3-days.png'
                    },
                    {
                        name: '1 tuần không hút thuốc',
                        description: 'Đã vượt qua 1 tuần không hút thuốc. Hơi thở của bạn đã bắt đầu tươi mát hơn!',
                        icon_url: '/achievements/1-week.png'
                    },
                    {
                        name: '1 tháng không hút thuốc',
                        description: 'Đã vượt qua 1 tháng không hút thuốc. Phổi của bạn đang hồi phục đáng kể!',
                        icon_url: '/achievements/1-month.png'
                    },
                    
                    // Thành tựu theo tiến độ
                    {
                        name: 'Giảm 25% lượng thuốc',
                        description: 'Đã giảm được 25% lượng thuốc lá hút hàng ngày. Bước đầu tiên quan trọng!',
                        icon_url: '/achievements/reduce-25.png'
                    },
                    {
                        name: 'Giảm 50% lượng thuốc',
                        description: 'Đã giảm được 50% lượng thuốc lá hút hàng ngày. Tiếp tục cố gắng!',
                        icon_url: '/achievements/reduce-50.png'
                    },
                    {
                        name: 'Giảm 75% lượng thuốc',
                        description: 'Đã giảm được 75% lượng thuốc lá hút hàng ngày. Bạn gần đạt được mục tiêu!',
                        icon_url: '/achievements/reduce-75.png'
                    },
                    {
                        name: 'Hoàn toàn cai thuốc',
                        description: 'Chúc mừng! Bạn đã hoàn toàn cai thuốc lá thành công!',
                        icon_url: '/achievements/quit-smoking.png'
                    }
                ];
                
                // Thêm từng thành tựu vào database
                for (const achievement of defaultAchievements) {
                    await pool.query(
                        'INSERT INTO achievement (name, description, icon_url) VALUES (?, ?, ?)',
                        [achievement.name, achievement.description, achievement.icon_url]
                    );
                }
                
                console.log('✅ Default achievements created successfully');
            } else {
                console.log('ℹ️ Achievements already exist, skipping creation');
            }
        } catch (error) {
            console.error('❌ Error ensuring default achievements:', error);
            throw error;
        }
    }
}

export default Achievement;
