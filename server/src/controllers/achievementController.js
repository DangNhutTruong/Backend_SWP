import Achievement, { UserAchievement } from '../models/Achievement.js';
import Progress from '../models/Progress.js';
import { Op } from 'sequelize';

// Predefined achievements
const PREDEFINED_ACHIEVEMENTS = [
  {
    Title: 'Ngày đầu tiên',
    Description: 'Hoàn thành ngày đầu tiên không hút thuốc',
    Icon: 'first-day',
    Type: 'milestone',
    Category: 'smoke_free_days',
    Condition: JSON.stringify({ type: 'smoke_free_days', value: 1 }),
    Points: 50
  },
  {
    Title: 'Tuần đầu tiên',
    Description: 'Hoàn thành 7 ngày không hút thuốc',
    Icon: 'first-week',
    Type: 'milestone',
    Category: 'smoke_free_days',
    Condition: JSON.stringify({ type: 'smoke_free_days', value: 7 }),
    Points: 100
  },
  {
    Title: 'Tháng đầu tiên',
    Description: 'Hoàn thành 30 ngày không hút thuốc',
    Icon: 'first-month',
    Type: 'milestone',
    Category: 'smoke_free_days',
    Condition: JSON.stringify({ type: 'smoke_free_days', value: 30 }),
    Points: 500
  },
  {
    Title: 'Tiết kiệm 100k',
    Description: 'Tiết kiệm được 100,000 VNĐ từ việc bỏ thuốc',
    Icon: 'money-saved',
    Type: 'milestone',
    Category: 'money_saved',
    Condition: JSON.stringify({ type: 'money_saved', value: 100000 }),
    Points: 200
  },
  {
    Title: 'Tâm trạng tích cực',
    Description: 'Duy trì tâm trạng tốt (8+) trong 7 ngày liên tiếp',
    Icon: 'good-mood',
    Type: 'weekly',
    Category: 'mood_improvement',
    Condition: JSON.stringify({ type: 'consecutive_good_mood', value: 7, threshold: 8 }),
    Points: 150
  }
];

// Lấy achievements của user
export const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const userAchievements = await UserAchievement.findAll({
      where: {
        UserID: userId
      },
      include: [{
        model: Achievement,
        attributes: ['AchievementID', 'Title', 'Description', 'Icon', 'Type', 'Category', 'Points']
      }],
      order: [['UnlockedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: userAchievements
    });

  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thành tích',
      error: error.message
    });
  }
};

// Lấy tất cả achievements có sẵn
export const getAllAchievements = async (req, res) => {
  try {
    const userId = req.user.UserID;

    // Lấy tất cả achievements
    const allAchievements = await Achievement.findAll({
      where: {
        IsActive: true
      },
      order: [['Category', 'ASC'], ['Points', 'ASC']]
    });

    // Lấy achievements đã unlock của user
    const userAchievements = await UserAchievement.findAll({
      where: {
        UserID: userId
      },
      attributes: ['AchievementID', 'UnlockedAt']
    });

    const unlockedIds = new Set(userAchievements.map(ua => ua.AchievementID));

    // Thêm thông tin unlock status
    const achievementsWithStatus = allAchievements.map(achievement => ({
      ...achievement.toJSON(),
      IsUnlocked: unlockedIds.has(achievement.AchievementID),
      UnlockedAt: userAchievements.find(ua => ua.AchievementID === achievement.AchievementID)?.UnlockedAt || null
    }));

    res.json({
      success: true,
      data: achievementsWithStatus
    });

  } catch (error) {
    console.error('Error fetching all achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thành tích',
      error: error.message
    });
  }
};

// Kiểm tra và unlock achievements mới
export const checkAchievements = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const newAchievements = [];

    // Đảm bảo có predefined achievements trong database
    await ensurePredefinedAchievements();

    // Lấy tất cả achievements chưa unlock
    const unlockedAchievementIds = await UserAchievement.findAll({
      where: { UserID: userId },
      attributes: ['AchievementID']
    }).then(results => results.map(r => r.AchievementID));

    const availableAchievements = await Achievement.findAll({
      where: {
        IsActive: true,
        AchievementID: {
          [Op.notIn]: unlockedAchievementIds
        }
      }
    });

    // Lấy progress data của user
    const progressData = await Progress.findAll({
      where: { UserID: userId },
      order: [['Date', 'ASC']]
    });

    // Check từng achievement
    for (const achievement of availableAchievements) {
      const condition = JSON.parse(achievement.Condition);
      
      if (await checkAchievementCondition(userId, condition, progressData)) {
        // Unlock achievement
        await UserAchievement.create({
          UserID: userId,
          AchievementID: achievement.AchievementID,
          UnlockedAt: new Date()
        });

        newAchievements.push({
          ...achievement.toJSON(),
          UnlockedAt: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: newAchievements.length > 0 ? 
        `Chúc mừng! Bạn đã mở khóa ${newAchievements.length} thành tích mới!` : 
        'Không có thành tích mới được mở khóa',
      data: newAchievements
    });

  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra thành tích',
      error: error.message
    });
  }
};

// Chia sẻ achievement
export const shareAchievement = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const userAchievement = await UserAchievement.findOne({
      where: {
        UserID: userId,
        AchievementID: id
      },
      include: [{
        model: Achievement,
        attributes: ['Title', 'Description', 'Icon']
      }]
    });

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa mở khóa thành tích này'
      });
    }

    // Cập nhật trạng thái đã chia sẻ
    await userAchievement.update({
      IsShared: true,
      SharedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Thành tích đã được chia sẻ thành công!',
      data: {
        achievement: userAchievement.Achievement,
        sharedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error sharing achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chia sẻ thành tích',
      error: error.message
    });
  }
};

// Lấy chi tiết achievement
export const getAchievementById = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const achievement = await Achievement.findByPk(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành tích'
      });
    }

    // Kiểm tra user đã unlock chưa
    const userAchievement = await UserAchievement.findOne({
      where: {
        UserID: userId,
        AchievementID: id
      }
    });

    const achievementData = {
      ...achievement.toJSON(),
      IsUnlocked: !!userAchievement,
      UnlockedAt: userAchievement?.UnlockedAt || null,
      IsShared: userAchievement?.IsShared || false,
      SharedAt: userAchievement?.SharedAt || null
    };

    res.json({
      success: true,
      data: achievementData
    });

  } catch (error) {
    console.error('Error fetching achievement by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin thành tích',
      error: error.message
    });
  }
};

// Helper functions
async function ensurePredefinedAchievements() {
  for (const achievementData of PREDEFINED_ACHIEVEMENTS) {
    const existing = await Achievement.findOne({
      where: { Title: achievementData.Title }
    });
    
    if (!existing) {
      await Achievement.create(achievementData);
    }
  }
}

async function checkAchievementCondition(userId, condition, progressData) {
  switch (condition.type) {
    case 'smoke_free_days':
      return checkSmokeFreeStreak(progressData, condition.value);
    
    case 'money_saved':
      return checkMoneySaved(progressData, condition.value);
    
    case 'consecutive_good_mood':
      return checkConsecutiveGoodMood(progressData, condition.value, condition.threshold);
    
    default:
      return false;
  }
}

function checkSmokeFreeStreak(progressData, targetDays) {
  if (progressData.length < targetDays) return false;
  
  const recentData = progressData.slice(-targetDays);
  return recentData.every(p => p.CigarettesSmoked === 0);
}

function checkMoneySaved(progressData, targetAmount) {
  const totalSaved = progressData.reduce((sum, p) => sum + parseFloat(p.MoneySpent || 0), 0);
  return totalSaved >= targetAmount;
}

function checkConsecutiveGoodMood(progressData, targetDays, threshold) {
  if (progressData.length < targetDays) return false;
  
  const recentData = progressData.slice(-targetDays);
  return recentData.every(p => p.MoodLevel && p.MoodLevel >= threshold);
}
