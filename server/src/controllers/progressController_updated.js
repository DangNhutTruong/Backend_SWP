import { DailyCheckin } from '../models/index.js';
import { Op } from 'sequelize';

// Get all checkins for a user
export const getAllCheckins = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { page = 1, limit = 30, startDate, endDate } = req.query;

    let whereCondition = { user_id: userId };
    
    if (startDate && endDate) {
      whereCondition.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: checkins } = await DailyCheckin.findAndCountAll({
      where: whereCondition,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: checkins,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting all checkins:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách check-in'
    });
  }
};

// Create or update daily checkin
export const createCheckin = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const {
      date,
      smoking_status,
      cigarettes_smoked = 0,
      mood,
      craving_level,
      withdrawal_symptoms,
      alternative_activities,
      notes,
      self_rating,
      tomorrow_goal,
      stress_level,
      stress_factors,
      achievements
    } = req.body;

    // Validate required fields
    if (!smoking_status || !mood || craving_level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: smoking_status, mood, craving_level'
      });
    }

    // Validate enums
    const validSmokingStatus = ['smoke-free', 'reduced', 'relapsed'];
    const validMoods = ['great', 'good', 'neutral', 'bad', 'awful'];

    if (!validSmokingStatus.includes(smoking_status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái hút thuốc không hợp lệ'
      });
    }

    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Tâm trạng không hợp lệ'
      });
    }

    // Validate craving level
    if (craving_level < 1 || craving_level > 10) {
      return res.status(400).json({
        success: false,
        message: 'Mức độ thèm thuốc phải từ 1 đến 10'
      });
    }

    // Use provided date or today
    const checkinDate = date ? new Date(date) : new Date();
    const dateOnly = checkinDate.toISOString().split('T')[0];

    // Check if checkin already exists for this date
    let existingCheckin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        date: dateOnly
      }
    });

    // Prepare checkin data
    const checkinData = {
      user_id: userId,
      date: dateOnly,
      smoking_status,
      cigarettes_smoked: parseInt(cigarettes_smoked) || 0,
      mood,
      craving_level: parseInt(craving_level),
      withdrawal_symptoms: withdrawal_symptoms || null,
      alternative_activities: alternative_activities || null,
      notes: notes || null,
      self_rating: self_rating ? parseInt(self_rating) : null,
      tomorrow_goal: tomorrow_goal || null,
      stress_level: stress_level ? parseInt(stress_level) : null,
      stress_factors: stress_factors || null,
      achievements: achievements || null
    };

    let checkin;
    if (existingCheckin) {
      // Update existing checkin
      await existingCheckin.update(checkinData);
      checkin = existingCheckin;
    } else {
      // Create new checkin
      checkin = await DailyCheckin.create(checkinData);
    }

    res.json({
      success: true,
      message: existingCheckin ? 'Cập nhật check-in thành công' : 'Tạo check-in thành công',
      data: checkin
    });

  } catch (error) {
    console.error('Error creating/updating checkin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo/cập nhật check-in'
    });
  }
};

// Get checkin by date
export const getCheckinByDate = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { date } = req.params;

    // Validate date
    const checkinDate = new Date(date);
    if (isNaN(checkinDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ'
      });
    }

    const dateOnly = checkinDate.toISOString().split('T')[0];

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        date: dateOnly
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
    console.error('Error getting checkin by date:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy check-in'
    });
  }
};

// Update checkin
export const updateCheckin = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const checkin = await DailyCheckin.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy check-in'
      });
    }

    const {
      smoking_status,
      cigarettes_smoked,
      mood,
      craving_level,
      withdrawal_symptoms,
      alternative_activities,
      notes,
      self_rating,
      tomorrow_goal,
      stress_level,
      stress_factors,
      achievements
    } = req.body;

    // Validate enums if provided
    if (smoking_status) {
      const validSmokingStatus = ['smoke-free', 'reduced', 'relapsed'];
      if (!validSmokingStatus.includes(smoking_status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái hút thuốc không hợp lệ'
        });
      }
    }

    if (mood) {
      const validMoods = ['great', 'good', 'neutral', 'bad', 'awful'];
      if (!validMoods.includes(mood)) {
        return res.status(400).json({
          success: false,
          message: 'Tâm trạng không hợp lệ'
        });
      }
    }

    // Validate craving level if provided
    if (craving_level !== undefined && (craving_level < 1 || craving_level > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Mức độ thèm thuốc phải từ 1 đến 10'
      });
    }

    // Update checkin
    const updateData = {};
    if (smoking_status !== undefined) updateData.smoking_status = smoking_status;
    if (cigarettes_smoked !== undefined) updateData.cigarettes_smoked = parseInt(cigarettes_smoked);
    if (mood !== undefined) updateData.mood = mood;
    if (craving_level !== undefined) updateData.craving_level = parseInt(craving_level);
    if (withdrawal_symptoms !== undefined) updateData.withdrawal_symptoms = withdrawal_symptoms;
    if (alternative_activities !== undefined) updateData.alternative_activities = alternative_activities;
    if (notes !== undefined) updateData.notes = notes;
    if (self_rating !== undefined) updateData.self_rating = self_rating ? parseInt(self_rating) : null;
    if (tomorrow_goal !== undefined) updateData.tomorrow_goal = tomorrow_goal;
    if (stress_level !== undefined) updateData.stress_level = stress_level ? parseInt(stress_level) : null;
    if (stress_factors !== undefined) updateData.stress_factors = stress_factors;
    if (achievements !== undefined) updateData.achievements = achievements;

    await checkin.update(updateData);

    res.json({
      success: true,
      message: 'Cập nhật check-in thành công',
      data: checkin
    });

  } catch (error) {
    console.error('Error updating checkin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật check-in'
    });
  }
};

// Delete checkin
export const deleteCheckin = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { id } = req.params;

    const checkin = await DailyCheckin.findOne({
      where: {
        id: id,
        user_id: userId
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy check-in'
      });
    }

    await checkin.destroy();

    res.json({
      success: true,
      message: 'Xóa check-in thành công'
    });

  } catch (error) {
    console.error('Error deleting checkin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa check-in'
    });
  }
};

// Get user's smoking streak
export const getStreak = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const streak = await DailyCheckin.getUserStreak(userId);

    res.json({
      success: true,
      data: {
        streak: streak,
        message: streak > 0 ? `Bạn đã ${streak} ngày không hút thuốc!` : 'Hãy bắt đầu hành trình bỏ thuốc!'
      }
    });

  } catch (error) {
    console.error('Error getting streak:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy streak'
    });
  }
};

// Get chart data for progress visualization
export const getChartData = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const checkins = await DailyCheckin.findByUserAndDateRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Prepare chart data
    const chartData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const checkin = checkins.find(c => c.date === dateStr);

      chartData.push({
        date: dateStr,
        smoking_status: checkin ? checkin.smoking_status : null,
        cigarettes_smoked: checkin ? checkin.cigarettes_smoked : null,
        mood: checkin ? checkin.mood : null,
        craving_level: checkin ? checkin.craving_level : null
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy dữ liệu biểu đồ'
    });
  }
};

// Get progress statistics
export const getStatistics = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const checkins = await DailyCheckin.findByUserAndDateRange(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Calculate statistics
    const totalCheckins = checkins.length;
    const smokeFreeCheckins = checkins.filter(c => c.smoking_status === 'smoke-free').length;
    const reducedCheckins = checkins.filter(c => c.smoking_status === 'reduced').length;
    const relapsedCheckins = checkins.filter(c => c.smoking_status === 'relapsed').length;

    const totalCigarettes = checkins.reduce((sum, c) => sum + (c.cigarettes_smoked || 0), 0);
    const averageCravingLevel = checkins.length > 0 
      ? checkins.reduce((sum, c) => sum + c.craving_level, 0) / checkins.length 
      : 0;

    const moodDistribution = {
      great: checkins.filter(c => c.mood === 'great').length,
      good: checkins.filter(c => c.mood === 'good').length,
      neutral: checkins.filter(c => c.mood === 'neutral').length,
      bad: checkins.filter(c => c.mood === 'bad').length,
      awful: checkins.filter(c => c.mood === 'awful').length
    };

    const currentStreak = await DailyCheckin.getUserStreak(userId);

    res.json({
      success: true,
      data: {
        period: `${days} ngày gần đây`,
        total_checkins: totalCheckins,
        smoke_free_days: smokeFreeCheckins,
        reduced_days: reducedCheckins,
        relapsed_days: relapsedCheckins,
        smoke_free_percentage: totalCheckins > 0 ? Math.round((smokeFreeCheckins / totalCheckins) * 100) : 0,
        total_cigarettes_avoided: Math.max(0, (parseInt(days) * 20) - totalCigarettes), // Assuming 20 cigarettes per day baseline
        average_craving_level: Math.round(averageCravingLevel * 10) / 10,
        mood_distribution: moodDistribution,
        current_streak: currentStreak
      }
    });

  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thống kê'
    });
  }
};

// Legacy aliases for backward compatibility
export const getAllProgress = getAllCheckins;
export const createProgress = createCheckin;
export const getProgressByDate = getCheckinByDate;
export const updateProgress = updateCheckin;
export const deleteProgress = deleteCheckin;
