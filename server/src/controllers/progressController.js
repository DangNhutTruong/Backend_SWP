import DailyCheckin from '../models/DailyCheckin.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// POST /api/progress/checkin - Tạo check-in mới
export const createCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      checkin_date,
      target_cigarettes,
      actual_cigarettes,
      mood_rating,
      craving_level,
      achievements = [],
      challenges = [],
      notes,
      money_saved = 0
    } = req.body;

    // Kiểm tra xem đã có check-in trong ngày này chưa
    const existingCheckin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date
      }
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã check-in cho ngày này rồi'
      });
    }

    // Tính toán xem có thành công không (actual <= target)
    const is_success_day = actual_cigarettes <= target_cigarettes;

    const newCheckin = await DailyCheckin.create({
      user_id: userId,
      checkin_date,
      target_cigarettes,
      actual_cigarettes,
      mood_rating,
      craving_level,
      achievements,
      challenges,
      notes,
      is_success_day,
      money_saved
    });

    res.status(201).json({
      success: true,
      message: 'Check-in thành công',
      data: newCheckin
    });
  } catch (error) {
    console.error('Create checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo check-in',
      error: error.message
    });
  }
};

// GET /api/progress/user - Lấy tất cả progress của user
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 30, offset = 0, sort = 'desc' } = req.query;

    const checkins = await DailyCheckin.findAll({
      where: { user_id: userId },
      order: [['checkin_date', sort.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Tính toán thống kê cơ bản
    const totalCheckins = await DailyCheckin.count({
      where: { user_id: userId }
    });

    const successDays = await DailyCheckin.count({
      where: {
        user_id: userId,
        is_success_day: true
      }
    });

    const totalMoneySaved = await DailyCheckin.sum('money_saved', {
      where: { user_id: userId }
    });

    const totalCigarettesReduced = await DailyCheckin.sum('target_cigarettes', {
      where: { user_id: userId }
    }) - await DailyCheckin.sum('actual_cigarettes', {
      where: { user_id: userId }
    });

    res.json({
      success: true,
      data: {
        checkins,
        stats: {
          total_checkins: totalCheckins,
          success_days: successDays,
          success_rate: totalCheckins > 0 ? ((successDays / totalCheckins) * 100).toFixed(1) : 0,
          total_money_saved: totalMoneySaved || 0,
          total_cigarettes_reduced: totalCigarettesReduced || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tiến trình',
      error: error.message
    });
  }
};

// GET /api/progress/user/:date - Lấy progress theo ngày cụ thể
export const getProgressByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: date
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy check-in cho ngày này'
      });
    }

    res.json({
      success: true,
      data: checkin
    });
  } catch (error) {
    console.error('Get progress by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tiến trình theo ngày',
      error: error.message
    });
  }
};

// PUT /api/progress/checkin/:date - Cập nhật check-in theo ngày
export const updateCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    const updateData = req.body;

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: date
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy check-in cho ngày này'
      });
    }

    // Nếu có cập nhật target_cigarettes hoặc actual_cigarettes, tính lại is_success_day
    if (updateData.target_cigarettes !== undefined || updateData.actual_cigarettes !== undefined) {
      const target = updateData.target_cigarettes !== undefined ? updateData.target_cigarettes : checkin.target_cigarettes;
      const actual = updateData.actual_cigarettes !== undefined ? updateData.actual_cigarettes : checkin.actual_cigarettes;
      updateData.is_success_day = actual <= target;
    }

    await checkin.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật check-in thành công',
      data: checkin
    });
  } catch (error) {
    console.error('Update checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật check-in',
      error: error.message
    });
  }
};

// DELETE /api/progress/checkin/:date - Xóa check-in theo ngày
export const deleteCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: date
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy check-in cho ngày này'
      });
    }

    await checkin.destroy();

    res.json({
      success: true,
      message: 'Xóa check-in thành công'
    });
  } catch (error) {
    console.error('Delete checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa check-in',
      error: error.message
    });
  }
};

// GET /api/progress/stats - Lấy thống kê tổng quan
export const getProgressStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // Số ngày gần đây, mặc định 30 ngày

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const checkins = await DailyCheckin.findAll({
      where: {
        user_id: userId,
        checkin_date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['checkin_date', 'ASC']]
    });

    // Tính toán các thống kê
    const totalCheckins = checkins.length;
    const successDays = checkins.filter(c => c.is_success_day).length;
    const successRate = totalCheckins > 0 ? ((successDays / totalCheckins) * 100).toFixed(1) : 0;

    const totalMoneySaved = checkins.reduce((sum, c) => sum + parseFloat(c.money_saved || 0), 0);
    const totalCigarettesReduced = checkins.reduce((sum, c) => sum + (c.target_cigarettes - c.actual_cigarettes), 0);

    // Tính streak (chuỗi ngày thành công liên tiếp)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = checkins.length - 1; i >= 0; i--) {
      if (checkins[i].is_success_day) {
        tempStreak++;
        if (i === checkins.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Tính mood và craving trung bình
    const moodRatings = checkins.filter(c => c.mood_rating).map(c => c.mood_rating);
    const cravingLevels = checkins.filter(c => c.craving_level).map(c => c.craving_level);

    const avgMood = moodRatings.length > 0 ? (moodRatings.reduce((a, b) => a + b) / moodRatings.length).toFixed(1) : 0;
    const avgCraving = cravingLevels.length > 0 ? (cravingLevels.reduce((a, b) => a + b) / cravingLevels.length).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        period_days: parseInt(period),
        total_checkins: totalCheckins,
        success_days: successDays,
        success_rate: parseFloat(successRate),
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_money_saved: totalMoneySaved,
        total_cigarettes_reduced: totalCigarettesReduced,
        average_mood: parseFloat(avgMood),
        average_craving: parseFloat(avgCraving)
      }
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tiến trình',
      error: error.message
    });
  }
};

// GET /api/progress/chart-data - Lấy dữ liệu cho biểu đồ
export const getChartData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30', type = 'cigarettes' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const checkins = await DailyCheckin.findAll({
      where: {
        user_id: userId,
        checkin_date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['checkin_date', 'ASC']]
    });

    let chartData = [];

    switch (type) {
      case 'cigarettes':
        chartData = checkins.map(c => ({
          date: c.checkin_date,
          target: c.target_cigarettes,
          actual: c.actual_cigarettes,
          success: c.is_success_day
        }));
        break;

      case 'mood':
        chartData = checkins.filter(c => c.mood_rating).map(c => ({
          date: c.checkin_date,
          mood: c.mood_rating
        }));
        break;

      case 'craving':
        chartData = checkins.filter(c => c.craving_level).map(c => ({
          date: c.checkin_date,
          craving: c.craving_level
        }));
        break;

      case 'money':
        let cumulativeSaved = 0;
        chartData = checkins.map(c => {
          cumulativeSaved += parseFloat(c.money_saved || 0);
          return {
            date: c.checkin_date,
            daily_saved: parseFloat(c.money_saved || 0),
            cumulative_saved: cumulativeSaved
          };
        });
        break;

      case 'streak':
        let streak = 0;
        chartData = checkins.map(c => {
          if (c.is_success_day) {
            streak++;
          } else {
            streak = 0;
          }
          return {
            date: c.checkin_date,
            streak: streak,
            success: c.is_success_day
          };
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Loại biểu đồ không hợp lệ. Chọn: cigarettes, mood, craving, money, streak'
        });
    }

    res.json({
      success: true,
      data: {
        type,
        period_days: parseInt(period),
        chart_data: chartData
      }
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu biểu đồ',
      error: error.message
    });
  }
};
