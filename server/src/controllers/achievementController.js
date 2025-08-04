import Achievement from '../models/Achievement.js';
import AchievementProgressService from '../services/achievementProgressService.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Controller xử lý các chức năng liên quan đến huy hiệu
 */
export const getAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.findAll();
        sendSuccess(res, 'Lấy danh sách huy hiệu thành công', achievements);
    } catch (error) {
        console.error('Error getting achievements:', error);
        sendError(res, 'Không thể lấy danh sách huy hiệu', 500);
    }
};

/**
 * Lấy huy hiệu của người dùng đang đăng nhập
 */
export const getUserAchievements = async (req, res) => {
    try {
        console.log('🏆 getUserAchievements called');
        console.log('- req.user:', req.user);
        console.log('- req.user.id:', req.user?.id);
        
        const userId = req.user.id;
        const achievements = await Achievement.findByUserId(userId);
        
        console.log('- Found achievements:', achievements.length);
        
        sendSuccess(res, 'Lấy huy hiệu của người dùng thành công', achievements);
    } catch (error) {
        console.error('Error getting user achievements:', error);
        sendError(res, 'Không thể lấy huy hiệu của người dùng', 500);
    }
};

/**
 * Lấy huy hiệu của một người dùng cụ thể (theo ID)
 */
export const getSmokerAchievements = async (req, res) => {
    try {
        const { id } = req.params;
        const achievements = await Achievement.findByUserId(id);
        
        sendSuccess(res, 'Lấy huy hiệu thành công', achievements);
    } catch (error) {
        console.error('Error getting smoker achievements:', error);
        sendError(res, 'Không thể lấy huy hiệu của người dùng', 500);
    }
};

/**
 * Cấp huy hiệu cho người dùng đang đăng nhập
 */
export const awardAchievement = async (req, res) => {
    try {
        const { achievementId } = req.body;
        const userId = req.user.id;
        
        if (!achievementId) {
            return sendError(res, 'ID huy hiệu không hợp lệ', 400);
        }
        
        // Kiểm tra xem huy hiệu có tồn tại không
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return sendError(res, 'Huy hiệu không tồn tại', 404);
        }
        
        // Cấp huy hiệu cho người dùng
        const awardedAchievement = await Achievement.awardToUser(userId, achievementId);
        
        sendSuccess(res, 'Cấp huy hiệu thành công', awardedAchievement);
    } catch (error) {
        console.error('Error awarding achievement:', error);
        sendError(res, 'Không thể cấp huy hiệu', 500);
    }
};

/**
 * Admin cấp huy hiệu cho người dùng khác
 */
export const adminAwardAchievement = async (req, res) => {
    try {
        // Chỉ admin mới có quyền thực hiện
        if (req.user.role !== 'admin') {
            return sendError(res, 'Không có quyền thực hiện', 403);
        }
        
        const { userId, achievementId } = req.body;
        
        if (!userId || !achievementId) {
            return sendError(res, 'Thiếu thông tin người dùng hoặc huy hiệu', 400);
        }
        
        // Kiểm tra xem huy hiệu có tồn tại không
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return sendError(res, 'Huy hiệu không tồn tại', 404);
        }
        
        // Cấp huy hiệu cho người dùng
        const awardedAchievement = await Achievement.awardToUser(userId, achievementId);
        
        sendSuccess(res, 'Cấp huy hiệu thành công', awardedAchievement);
    } catch (error) {
        console.error('Error admin awarding achievement:', error);
        sendError(res, 'Không thể cấp huy hiệu', 500);
    }
};

/**
 * Kiểm tra xem người dùng đã đạt được huy hiệu hay chưa
 */
export const checkUserAchievement = async (req, res) => {
    try {
        const { achievementId } = req.params;
        const userId = req.user.id;
        
        if (!achievementId) {
            return sendError(res, 'ID huy hiệu không hợp lệ', 400);
        }
        
        const hasAchievement = await Achievement.userHasAchievement(userId, achievementId);
        
        sendSuccess(res, 'Kiểm tra huy hiệu thành công', { hasAchievement });
    } catch (error) {
        console.error('Error checking achievement:', error);
        sendError(res, 'Không thể kiểm tra huy hiệu', 500);
    }
};

/**
 * Kiểm tra và award huy hiệu dựa trên tiến trình cai thuốc
 */
export const checkProgressAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await AchievementProgressService.checkAndAwardAchievements(userId);
        
        sendSuccess(res, result.message, {
            awarded: result.awarded,
            count: result.awarded.length
        });
    } catch (error) {
        console.error('Error checking progress achievements:', error);
        sendError(res, 'Không thể kiểm tra huy hiệu tiến trình', 500);
    }
};

/**
 * Tạo dữ liệu test để có thể nhận achievement (chỉ cho testing)
 */
export const createTestProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { daysClean = 1 } = req.body;
        
        // Tạo dữ liệu test
        const progressData = await AchievementProgressService.createTestProgressData(userId, parseInt(daysClean));
        
        // Sau đó kiểm tra và award achievement
        const result = await AchievementProgressService.checkAndAwardAchievements(userId);
        
        sendSuccess(res, `Đã tạo dữ liệu test ${daysClean} ngày clean`, {
            progressData,
            achievements: result.awarded,
            message: result.message
        });
    } catch (error) {
        console.error('Error creating test progress:', error);
        sendError(res, 'Không thể tạo dữ liệu test', 500);
    }
};

/**
 * Award achievement thủ công (cho admin hoặc testing)
 */
export const manualAwardAchievement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { achievementId } = req.body;
        
        if (!achievementId) {
            return sendError(res, 'Achievement ID là bắt buộc', 400);
        }
        
        const achievement = await AchievementProgressService.manualAwardAchievement(userId, achievementId);
        
        sendSuccess(res, 'Đã award huy hiệu thành công', achievement);
    } catch (error) {
        console.error('Error manually awarding achievement:', error);
        sendError(res, 'Không thể award huy hiệu', 500);
    }
};
