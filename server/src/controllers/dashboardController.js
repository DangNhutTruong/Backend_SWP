import User from '../models/User.js';
import QuitPlan from '../models/QuitPlan.js';
import Progress from '../models/Progress.js';
import Achievement from '../models/Achievement.js';
import CommunityPost from '../models/CommunityPost.js';
import { Op } from 'sequelize';

// Get dashboard overview stats
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.UserID;

    // Get user's active plan
    const activePlan = await QuitPlan.findOne({
      where: {
        UserID: userId,
        Status: 'active'
      }
    });

    // Calculate days since quit (if applicable)
    let daysSinceQuit = 0;
    let smokeFreeStreak = 0;
    
    if (activePlan && activePlan.StartDate) {
      const startDate = new Date(activePlan.StartDate);
      const today = new Date();
      daysSinceQuit = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      
      // Get latest progress for streak calculation
      const latestProgress = await Progress.findOne({
        where: { UserID: userId },
        order: [['Date', 'DESC']]
      });
      
      if (latestProgress && latestProgress.SmokeFree) {
        smokeFreeStreak = daysSinceQuit;
      }
    }

    // Get progress stats for last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyProgress = await Progress.findAll({
      where: {
        UserID: userId,
        Date: {
          [Op.gte]: weekAgo
        }
      },
      order: [['Date', 'ASC']]
    });

    // Calculate money saved
    const user = await User.findByPk(userId);
    let moneySaved = 0;
    
    if (user && activePlan && daysSinceQuit > 0) {
      const dailyCost = (user.CostPerPack || 0) * (user.CigarettesPerDay || 0) / (user.CigarettesPerPack || 20);
      moneySaved = dailyCost * daysSinceQuit;
    }

    // Get achievements count
    const achievementsCount = await Achievement.count({
      include: [{
        model: User,
        where: { UserID: userId },
        through: { attributes: [] }
      }]
    });

    // Get recent community activity
    const recentPosts = await CommunityPost.count({
      where: {
        UserID: userId,
        CreatedAt: {
          [Op.gte]: weekAgo
        }
      }
    });

    const stats = {
      daysSinceQuit,
      smokeFreeStreak,
      moneySaved: Math.round(moneySaved),
      currency: 'VND',
      achievementsUnlocked: achievementsCount,
      weeklyProgressEntries: weeklyProgress.length,
      communityPostsThisWeek: recentPosts,
      activePlan: activePlan ? {
        id: activePlan.PlanID,
        title: activePlan.Title,
        progress: activePlan.Progress,
        status: activePlan.Status
      } : null
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thống kê dashboard'
    });
  }
};

// Get health improvements timeline
export const getHealthImprovements = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const activePlan = await QuitPlan.findOne({
      where: {
        UserID: userId,
        Status: { [Op.in]: ['active', 'completed'] }
      }
    });

    if (!activePlan || !activePlan.StartDate) {
      return res.json({
        success: true,
        data: []
      });
    }

    const startDate = new Date(activePlan.StartDate);
    const today = new Date();
    const daysSinceQuit = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    const healthMilestones = [
      {
        title: '20 phút: Nhịp tim và huyết áp giảm',
        description: 'Nhịp tim và huyết áp của bạn bắt đầu trở về bình thường',
        daysRequired: 0,
        achieved: daysSinceQuit >= 0,
        icon: 'heart'
      },
      {
        title: '12 giờ: Khí CO trong máu giảm',
        description: 'Lượng carbon monoxide trong máu giảm xuống mức bình thường',
        daysRequired: 0.5,
        achieved: daysSinceQuit >= 0.5,
        icon: 'lungs'
      },
      {
        title: '2 tuần: Lưu thông máu cải thiện',
        description: 'Lưu thông máu cải thiện và chức năng phổi tăng lên',
        daysRequired: 14,
        achieved: daysSinceQuit >= 14,
        icon: 'activity'
      },
      {
        title: '1 tháng: Ít ho và khó thở',
        description: 'Triệu chứng ho, khó thở giảm đáng kể',
        daysRequired: 30,
        achieved: daysSinceQuit >= 30,
        icon: 'wind'
      },
      {
        title: '3 tháng: Giảm nguy cơ đột quỵ',
        description: 'Nguy cơ đột quỵ giảm và chức năng phổi cải thiện rõ rệt',
        daysRequired: 90,
        achieved: daysSinceQuit >= 90,
        icon: 'shield'
      },
      {
        title: '1 năm: Giảm 50% nguy cơ tim mạch',
        description: 'Nguy cơ mắc bệnh tim mạch giảm một nửa so với người hút thuốc',
        daysRequired: 365,
        achieved: daysSinceQuit >= 365,
        icon: 'award'
      }
    ];

    res.json({
      success: true,
      data: {
        daysSinceQuit,
        milestones: healthMilestones
      }
    });

  } catch (error) {
    console.error('Error getting health improvements:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy cải thiện sức khỏe'
    });
  }
};

// Get weekly progress chart data
export const getWeeklyChart = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { weeks = 4 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const progressData = await Progress.findAll({
      where: {
        UserID: userId,
        Date: {
          [Op.gte]: startDate
        }
      },
      order: [['Date', 'ASC']]
    });

    // Group by week
    const weeklyData = [];
    const weekMap = new Map();

    progressData.forEach(progress => {
      const progressDate = new Date(progress.Date);
      const weekStart = new Date(progressDate);
      weekStart.setDate(progressDate.getDate() - progressDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          smokeFree: 0,
          cravings: 0,
          mood: 0,
          entries: 0
        });
      }

      const weekData = weekMap.get(weekKey);
      weekData.smokeFree += progress.SmokeFree ? 1 : 0;
      weekData.cravings += progress.CravingLevel || 0;
      weekData.mood += progress.MoodLevel || 0;
      weekData.entries += 1;
    });

    // Calculate averages
    weekMap.forEach((data, week) => {
      if (data.entries > 0) {
        data.smokeFreeRate = Math.round((data.smokeFree / data.entries) * 100);
        data.avgCravings = Math.round(data.cravings / data.entries);
        data.avgMood = Math.round(data.mood / data.entries);
      }
      weeklyData.push(data);
    });

    res.json({
      success: true,
      data: weeklyData
    });

  } catch (error) {
    console.error('Error getting weekly chart:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy biểu đồ tuần'
    });
  }
};
