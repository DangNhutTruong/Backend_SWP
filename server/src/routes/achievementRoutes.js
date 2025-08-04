import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    getAchievements,
    getUserAchievements,
    getSmokerAchievements,
    awardAchievement,
    adminAwardAchievement,
    checkUserAchievement,
    checkProgressAchievements,
    createTestProgress,
    manualAwardAchievement
} from '../controllers/achievementController.js';

const router = express.Router();

// Lấy danh sách tất cả huy hiệu (công khai)
router.get('/achievements', getAchievements);

// Lấy huy hiệu của người dùng đang đăng nhập (yêu cầu đăng nhập)
router.get('/my-achievements', authenticateToken, getUserAchievements);

// Lấy huy hiệu của một người dùng cụ thể (công khai)
router.get('/user/:id/achievements', getSmokerAchievements);

// Kiểm tra xem người dùng đã đạt được huy hiệu cụ thể hay chưa
router.get('/check-achievement/:achievementId', authenticateToken, checkUserAchievement);

// Người dùng tự cấp huy hiệu (yêu cầu đăng nhập)
router.post('/award-achievement', authenticateToken, awardAchievement);

// Admin cấp huy hiệu cho người khác (yêu cầu quyền admin)
router.post('/admin/award-achievement', authenticateToken, adminAwardAchievement);

// =================== NEW ENDPOINTS ===================

// Kiểm tra và award huy hiệu dựa trên tiến trình cai thuốc
router.post('/check-progress', authenticateToken, checkProgressAchievements);

// Tạo dữ liệu test để có thể nhận achievement (testing only)
router.post('/test/create-progress', authenticateToken, createTestProgress);

// Award achievement thủ công 
router.post('/manual-award', authenticateToken, manualAwardAchievement);

export default router;
