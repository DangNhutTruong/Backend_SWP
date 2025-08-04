import Achievement from '../models/Achievement.js';
import { pool } from '../config/database.js';

/**
 * Service để tự động kiểm tra và award huy hiệu cho user dựa trên tiến trình cai thuốc
 */
class AchievementProgressService {
    
    /**
     * Kiểm tra và award huy hiệu cho user dựa trên tiến trình hiện tại
     */
    static async checkAndAwardAchievements(userId) {
        try {
            console.log(`🏆 Checking achievements for user ${userId}...`);
            
            // Lấy thông tin tiến trình mới nhất của user
            const [progressRows] = await pool.query(`
                SELECT * FROM daily_progress 
                WHERE smoker_id = ? 
                ORDER BY date DESC 
                LIMIT 1
            `, [userId]);
            
            if (progressRows.length === 0) {
                console.log(`ℹ️ No progress data found for user ${userId}`);
                return { awarded: [], message: 'Chưa có dữ liệu tiến trình' };
            }
            
            const progress = progressRows[0];
            const awardedAchievements = [];
            
            // Kiểm tra các achievement theo thời gian không hút thuốc
            await this.checkTimeBasedAchievements(userId, progress, awardedAchievements);
            
            // Kiểm tra các achievement theo tỷ lệ giảm thuốc
            await this.checkReductionAchievements(userId, progress, awardedAchievements);
            
            console.log(`✅ Awarded ${awardedAchievements.length} achievements to user ${userId}`);
            
            return {
                awarded: awardedAchievements,
                message: awardedAchievements.length > 0 
                    ? `Chúc mừng! Bạn đã đạt được ${awardedAchievements.length} huy hiệu mới!`
                    : 'Tiếp tục cố gắng để đạt thêm huy hiệu!'
            };
            
        } catch (error) {
            console.error('❌ Error checking achievements:', error);
            throw error;
        }
    }
    
    /**
     * Kiểm tra achievement dựa trên thời gian clean (days_clean)
     */
    static async checkTimeBasedAchievements(userId, progress, awardedAchievements) {
        const daysClean = progress.days_clean || 0;
        const hoursClean = daysClean * 24; // Chuyển sang giờ
        
        // Lấy tất cả achievement về thời gian
        const [timeAchievements] = await pool.query(`
            SELECT * FROM achievement 
            WHERE name LIKE '%giờ%' OR name LIKE '%ngày%' OR name LIKE '%tuần%' OR name LIKE '%tháng%'
        `);
        
        for (const achievement of timeAchievements) {
            // Kiểm tra xem user đã có achievement này chưa
            const hasAchievement = await Achievement.userHasAchievement(userId, achievement.id);
            if (hasAchievement) continue;
            
            let shouldAward = false;
            
            // Kiểm tra điều kiện cho từng loại achievement
            if (achievement.name.includes('24 giờ') && hoursClean >= 24) {
                shouldAward = true;
            } else if (achievement.name.includes('3 ngày') && daysClean >= 3) {
                shouldAward = true;
            } else if (achievement.name.includes('1 tuần') && daysClean >= 7) {
                shouldAward = true;
            } else if (achievement.name.includes('1 tháng') && daysClean >= 30) {
                shouldAward = true;
            }
            
            if (shouldAward) {
                await Achievement.awardToUser(userId, achievement.id);
                awardedAchievements.push(achievement);
                console.log(`🏆 Awarded "${achievement.name}" to user ${userId}`);
            }
        }
    }
    
    /**
     * Kiểm tra achievement dựa trên tỷ lệ giảm thuốc
     */
    static async checkReductionAchievements(userId, progress, awardedAchievements) {
        const progressPercentage = progress.progress_percentage || 0;
        
        // Lấy achievement về giảm lượng thuốc
        const [reductionAchievements] = await pool.query(`
            SELECT * FROM achievement 
            WHERE name LIKE '%Giảm%' OR name LIKE '%cai thuốc%'
        `);
        
        for (const achievement of reductionAchievements) {
            const hasAchievement = await Achievement.userHasAchievement(userId, achievement.id);
            if (hasAchievement) continue;
            
            let shouldAward = false;
            
            if (achievement.name.includes('25%') && progressPercentage >= 25) {
                shouldAward = true;
            } else if (achievement.name.includes('50%') && progressPercentage >= 50) {
                shouldAward = true;
            } else if (achievement.name.includes('75%') && progressPercentage >= 75) {
                shouldAward = true;
            } else if (achievement.name.includes('Hoàn toàn') && progressPercentage >= 100) {
                shouldAward = true;
            }
            
            if (shouldAward) {
                await Achievement.awardToUser(userId, achievement.id);
                awardedAchievements.push(achievement);
                console.log(`🏆 Awarded "${achievement.name}" to user ${userId}`);
            }
        }
    }
    
    /**
     * Award achievement thủ công cho user (cho admin hoặc testing)
     */
    static async manualAwardAchievement(userId, achievementId) {
        try {
            const achievement = await Achievement.awardToUser(userId, achievementId);
            console.log(`🏆 Manually awarded achievement ${achievementId} to user ${userId}`);
            return achievement;
        } catch (error) {
            console.error('❌ Error manually awarding achievement:', error);
            throw error;
        }
    }
    
    /**
     * Tạo dữ liệu test cho user để có thể nhận achievement
     */
    static async createTestProgressData(userId, daysClean = 1) {
        try {
            // Tạo hoặc cập nhật dữ liệu progress
            const [existing] = await pool.query(`
                SELECT id FROM daily_progress WHERE smoker_id = ? ORDER BY date DESC LIMIT 1
            `, [userId]);
            
            const progressData = {
                smoker_id: userId,
                date: new Date().toISOString().split('T')[0],
                days_clean: daysClean,
                progress_percentage: Math.min(100, daysClean * 3.33), // Giả sử 30 ngày = 100%
                cigarettes_avoided: daysClean * 20, // Giả sử tránh được 20 điếu/ngày
                money_saved: daysClean * 50000, // Giả sử tiết kiệm 50k/ngày
                health_score: Math.min(100, daysClean * 5),
                target_cigarettes: Math.max(0, 20 - daysClean), // Giảm dần từ 20 điếu
                actual_cigarettes: Math.max(0, 20 - daysClean),
                streak_days: daysClean
            };
            
            if (existing.length > 0) {
                await pool.query(`
                    UPDATE daily_progress SET 
                    days_clean = ?, progress_percentage = ?, cigarettes_avoided = ?,
                    money_saved = ?, health_score = ?, target_cigarettes = ?,
                    actual_cigarettes = ?, streak_days = ?, updated_at = NOW()
                    WHERE id = ?
                `, [
                    progressData.days_clean, progressData.progress_percentage, 
                    progressData.cigarettes_avoided, progressData.money_saved,
                    progressData.health_score, progressData.target_cigarettes,
                    progressData.actual_cigarettes, progressData.streak_days,
                    existing[0].id
                ]);
            } else {
                await pool.query(`
                    INSERT INTO daily_progress 
                    (smoker_id, date, days_clean, progress_percentage, cigarettes_avoided, 
                     money_saved, health_score, target_cigarettes, actual_cigarettes, streak_days)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    progressData.smoker_id, progressData.date, progressData.days_clean,
                    progressData.progress_percentage, progressData.cigarettes_avoided,
                    progressData.money_saved, progressData.health_score,
                    progressData.target_cigarettes, progressData.actual_cigarettes,
                    progressData.streak_days
                ]);
            }
            
            console.log(`✅ Created test progress data for user ${userId}: ${daysClean} days clean`);
            return progressData;
            
        } catch (error) {
            console.error('❌ Error creating test progress data:', error);
            throw error;
        }
    }
}

export default AchievementProgressService;
