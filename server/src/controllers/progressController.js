import Progress from '../models/Progress.js';
import QuitPlan from '../models/QuitPlan.js';
import { Op } from 'sequelize';

// Get all progress entries for a user
export const getAllProgress = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    let whereCondition = { UserID: userId };
    
    if (startDate && endDate) {
      whereCondition.Date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: progressEntries } = await Progress.findAndCountAll({
      where: whereCondition,
      order: [['Date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: progressEntries,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting all progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy tiến độ'
    });
  }
};

// Create or update daily progress
export const createProgress = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const {
      date,
      cigarettesSmoked,
      moodRating,
      cravingLevel,
      notes,
      triggers,
      healthImprovements,
      moneySaved
    } = req.body;

    // Validate required fields
    if (!date || cigarettesSmoked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: date, cigarettesSmoked'
      });
    }

    // Validate date format
    const progressDate = new Date(date);
    if (isNaN(progressDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      });
    }

    // Convert to date only (no time)
    const dateOnly = progressDate.toISOString().split('T')[0];

    // Check if progress already exists for this date
    let existingProgress = await Progress.findOne({
      where: {
        UserID: userId,
        Date: dateOnly
      }
    });

    // Prepare progress data
    const progressData = {
      UserID: userId,
      Date: dateOnly,
      CigarettesSmoked: parseInt(cigarettesSmoked),
      MoodRating: moodRating ? parseInt(moodRating) : null,
      CravingLevel: cravingLevel ? parseInt(cravingLevel) : null,
      Notes: notes || null,
      Triggers: triggers ? JSON.stringify(triggers) : '[]',
      HealthImprovements: healthImprovements ? JSON.stringify(healthImprovements) : '[]',
      MoneySaved: moneySaved ? parseFloat(moneySaved) : 0.00,
      IsSuccessfulDay: parseInt(cigarettesSmoked) === 0
    };

    let progress;
    if (existingProgress) {
      // Update existing progress
      await existingProgress.update(progressData);
      progress = existingProgress;
    } else {
      // Create new progress
      progress = await Progress.create(progressData);
    }

    res.status(existingProgress ? 200 : 201).json({
      success: true,
      data: progress,
      message: existingProgress ? 'Cập nhật tiến độ thành công' : 'Ghi nhận tiến độ thành công'
    });

  } catch (error) {
    console.error('Error creating/updating progress:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Đã có dữ liệu tiến độ cho ngày này'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi ghi nhận tiến độ'
    });
  }
};

// Get progress for specific user (admin function)
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    // Check if requesting user is admin or the owner
    if (req.user.RoleID !== 1 && req.user.UserID !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập dữ liệu này'
      });
    }

    let whereCondition = { UserID: userId };
    
    if (startDate && endDate) {
      whereCondition.Date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: progressEntries } = await Progress.findAndCountAll({
      where: whereCondition,
      order: [['Date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: progressEntries,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy tiến độ người dùng'
    });
  }
};

// Update specific progress entry
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const {
      cigarettesSmoked,
      moodRating,
      cravingLevel,
      notes,
      triggers,
      healthImprovements,
      moneySaved
    } = req.body;

    const progress = await Progress.findOne({
      where: {
        ProgressID: id,
        UserID: userId
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu tiến độ'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (cigarettesSmoked !== undefined) {
      updateData.CigarettesSmoked = parseInt(cigarettesSmoked);
      updateData.IsSuccessfulDay = parseInt(cigarettesSmoked) === 0;
    }
    if (moodRating !== undefined) updateData.MoodRating = moodRating ? parseInt(moodRating) : null;
    if (cravingLevel !== undefined) updateData.CravingLevel = cravingLevel ? parseInt(cravingLevel) : null;
    if (notes !== undefined) updateData.Notes = notes;
    if (triggers !== undefined) updateData.Triggers = JSON.stringify(triggers);
    if (healthImprovements !== undefined) updateData.HealthImprovements = JSON.stringify(healthImprovements);
    if (moneySaved !== undefined) updateData.MoneySaved = parseFloat(moneySaved);

    await progress.update(updateData);

    res.json({
      success: true,
      data: progress,
      message: 'Cập nhật tiến độ thành công'
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật tiến độ'
    });
  }
};

// Delete progress entry
export const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const progress = await Progress.findOne({
      where: {
        ProgressID: id,
        UserID: userId
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dữ liệu tiến độ'
      });
    }

    await progress.destroy();

    res.json({
      success: true,
      message: 'Xóa dữ liệu tiến độ thành công'
    });

  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa dữ liệu tiến độ'
    });
  }
};

// Get progress statistics
export const getProgressStats = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { period = 30 } = req.query; // days

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Get progress entries for the period
    const progressEntries = await Progress.findAll({
      where: {
        UserID: userId,
        Date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['Date', 'ASC']]
    });

    // Calculate basic stats
    const totalDays = progressEntries.length;
    const successfulDays = progressEntries.filter(p => p.IsSuccessfulDay).length;
    const totalCigarettes = progressEntries.reduce((sum, p) => sum + p.CigarettesSmoked, 0);
    const totalMoneySaved = progressEntries.reduce((sum, p) => sum + parseFloat(p.MoneySaved), 0);

    // Calculate average mood and craving
    const entriesWithMood = progressEntries.filter(p => p.MoodRating !== null);
    const entriesWithCraving = progressEntries.filter(p => p.CravingLevel !== null);
    
    const avgMood = entriesWithMood.length > 0 
      ? entriesWithMood.reduce((sum, p) => sum + p.MoodRating, 0) / entriesWithMood.length 
      : null;
    
    const avgCraving = entriesWithCraving.length > 0 
      ? entriesWithCraving.reduce((sum, p) => sum + p.CravingLevel, 0) / entriesWithCraving.length 
      : null;

    // Get streak info
    const streakInfo = await Progress.getStreakInfo(userId);

    // Get recent trend (last 7 days vs previous 7 days)
    const last7Days = progressEntries.slice(-7);
    const previous7Days = progressEntries.slice(-14, -7);
    
    const last7DaysSuccess = last7Days.filter(p => p.IsSuccessfulDay).length;
    const previous7DaysSuccess = previous7Days.filter(p => p.IsSuccessfulDay).length;
    
    const trend = last7DaysSuccess > previous7DaysSuccess ? 'improving' : 
                  last7DaysSuccess < previous7DaysSuccess ? 'declining' : 'stable';

    res.json({
      success: true,
      data: {
        period: parseInt(period),
        totalDays,
        successfulDays,
        successRate: totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0,
        totalCigarettes,
        averageCigarettesPerDay: totalDays > 0 ? Math.round(totalCigarettes / totalDays) : 0,
        totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
        averageMood: avgMood ? Math.round(avgMood * 10) / 10 : null,
        averageCraving: avgCraving ? Math.round(avgCraving * 10) / 10 : null,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        trend,
        recentData: progressEntries.slice(-7).map(p => ({
          date: p.Date,
          cigarettesSmoked: p.CigarettesSmoked,
          isSuccessful: p.IsSuccessfulDay,
          moodRating: p.MoodRating,
          cravingLevel: p.CravingLevel
        }))
      }
    });

  } catch (error) {
    console.error('Error getting progress stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thống kê tiến độ'
    });
  }
};

export const getProgressChart = async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Get progress chart API - coming soon'
  });
};

// Get today's progress
export const getTodayProgress = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const today = new Date().toISOString().split('T')[0];

    const todayProgress = await Progress.findOne({
      where: {
        UserID: userId,
        Date: today
      }
    });

    if (!todayProgress) {
      return res.json({
        success: true,
        data: null,
        message: 'Chưa có dữ liệu tiến độ cho hôm nay'
      });
    }

    res.json({
      success: true,
      data: todayProgress
    });

  } catch (error) {
    console.error('Error getting today progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy tiến độ hôm nay'
    });
  }
};

// Get weekly chart data
export const getWeeklyChart = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { weeks = 4 } = req.query;

    const weeklyData = await Progress.getWeeklyStats(userId, parseInt(weeks));

    // Group by week
    const chartData = [];
    const endDate = new Date();
    
    for (let i = parseInt(weeks) - 1; i >= 0; i--) {
      const weekStart = new Date(endDate);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      
      const weekEnd = new Date(endDate);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));

      const weekData = weeklyData.filter(p => {
        const progressDate = new Date(p.Date);
        return progressDate >= weekStart && progressDate <= weekEnd;
      });

      const totalCigarettes = weekData.reduce((sum, p) => sum + p.CigarettesSmoked, 0);
      const successfulDays = weekData.filter(p => p.IsSuccessfulDay).length;
      const totalDays = weekData.length;

      chartData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        totalCigarettes,
        successfulDays,
        totalDays,
        successRate: totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0
      });
    }

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error getting weekly chart:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy biểu đồ tuần'
    });
  }
};

// Get monthly summary
export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { year, month } = req.query;

    const targetDate = new Date();
    if (year && month) {
      targetDate.setFullYear(parseInt(year), parseInt(month) - 1, 1);
    }

    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const progressEntries = await Progress.findAll({
      where: {
        UserID: userId,
        Date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['Date', 'ASC']]
    });

    const totalDays = progressEntries.length;
    const successfulDays = progressEntries.filter(p => p.IsSuccessfulDay).length;
    const totalCigarettes = progressEntries.reduce((sum, p) => sum + p.CigarettesSmoked, 0);
    const totalMoneySaved = progressEntries.reduce((sum, p) => sum + parseFloat(p.MoneySaved), 0);

    // Calculate daily average for the month
    const daysInMonth = endDate.getDate();
    const dailyAverage = totalDays > 0 ? totalCigarettes / totalDays : 0;

    res.json({
      success: true,
      data: {
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
        daysInMonth,
        daysLogged: totalDays,
        successfulDays,
        successRate: totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0,
        totalCigarettes,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
        dailyData: progressEntries.map(p => ({
          date: p.Date,
          cigarettesSmoked: p.CigarettesSmoked,
          isSuccessful: p.IsSuccessfulDay,
          moodRating: p.MoodRating,
          cravingLevel: p.CravingLevel,
          moneySaved: p.MoneySaved
        }))
      }
    });

  } catch (error) {
    console.error('Error getting monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy tổng kết tháng'
    });
  }
};
