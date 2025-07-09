import { DailyCheckin, User } from '../models/index.js';
import { Op } from 'sequelize';

// POST /api/daily-checkins - Create daily check-in
export const createDailyCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const {
      mood_rating,
      craving_level,
      cigarettes_avoided = 0,
      money_saved = 0,
      notes,
      activities_done,
      triggers_faced,
      coping_strategies_used,
      is_smoke_free = true,
      health_improvements,
      motivation_level,
      checkin_time
    } = req.body;

    // Check if user already checked in today
    const existingCheckin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: today
      }
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today. Use PUT to update your check-in.'
      });
    }

    // Calculate streak count
    const previousCheckin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: {
          [Op.lt]: today
        }
      },
      order: [['checkin_date', 'DESC']]
    });

    let streak_count = 0;
    if (is_smoke_free) {
      if (previousCheckin && previousCheckin.is_smoke_free) {
        streak_count = previousCheckin.streak_count + 1;
      } else {
        streak_count = 1;
      }
    }

    // Create check-in
    const checkin = await DailyCheckin.create({
      user_id: userId,
      checkin_date: today,
      mood_rating,
      craving_level,
      cigarettes_avoided,
      money_saved,
      notes,
      activities_done,
      triggers_faced,
      coping_strategies_used,
      is_smoke_free,
      streak_count,
      health_improvements,
      motivation_level,
      checkin_time
    });

    res.status(201).json({
      success: true,
      message: 'Daily check-in created successfully',
      data: checkin
    });

  } catch (error) {
    console.error('Create daily check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create daily check-in',
      error: error.message
    });
  }
};

// GET /api/daily-checkins - Get user's daily check-ins
export const getDailyCheckins = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 30, start_date, end_date } = req.query;
    
    const whereClause = { user_id: userId };
    
    // Add date range filter if provided
    if (start_date || end_date) {
      whereClause.checkin_date = {};
      if (start_date) whereClause.checkin_date[Op.gte] = start_date;
      if (end_date) whereClause.checkin_date[Op.lte] = end_date;
    }

    const offset = (page - 1) * limit;

    const { count, rows: checkins } = await DailyCheckin.findAndCountAll({
      where: whereClause,
      order: [['checkin_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        checkins,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get daily check-ins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily check-ins',
      error: error.message
    });
  }
};

// GET /api/daily-checkins/today - Get today's check-in
export const getTodayCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: today
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for today'
      });
    }

    res.json({
      success: true,
      data: checkin
    });

  } catch (error) {
    console.error('Get today check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s check-in',
      error: error.message
    });
  }
};

// PUT /api/daily-checkins/today - Update today's check-in
export const updateTodayCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const checkin = await DailyCheckin.findOne({
      where: {
        user_id: userId,
        checkin_date: today
      }
    });

    if (!checkin) {
      return res.status(404).json({
        success: false,
        message: 'No check-in found for today. Create a new check-in first.'
      });
    }

    const {
      mood_rating,
      craving_level,
      cigarettes_avoided,
      money_saved,
      notes,
      activities_done,
      triggers_faced,
      coping_strategies_used,
      is_smoke_free,
      health_improvements,
      motivation_level,
      checkin_time
    } = req.body;

    // Recalculate streak if smoke-free status changed
    let streak_count = checkin.streak_count;
    if (is_smoke_free !== undefined && is_smoke_free !== checkin.is_smoke_free) {
      if (is_smoke_free) {
        // User changed to smoke-free, recalculate streak
        const previousCheckin = await DailyCheckin.findOne({
          where: {
            user_id: userId,
            checkin_date: {
              [Op.lt]: today
            }
          },
          order: [['checkin_date', 'DESC']]
        });

        if (previousCheckin && previousCheckin.is_smoke_free) {
          streak_count = previousCheckin.streak_count + 1;
        } else {
          streak_count = 1;
        }
      } else {
        // User smoked today, reset streak
        streak_count = 0;
      }
    }

    // Update check-in
    await checkin.update({
      mood_rating: mood_rating !== undefined ? mood_rating : checkin.mood_rating,
      craving_level: craving_level !== undefined ? craving_level : checkin.craving_level,
      cigarettes_avoided: cigarettes_avoided !== undefined ? cigarettes_avoided : checkin.cigarettes_avoided,
      money_saved: money_saved !== undefined ? money_saved : checkin.money_saved,
      notes: notes !== undefined ? notes : checkin.notes,
      activities_done: activities_done !== undefined ? activities_done : checkin.activities_done,
      triggers_faced: triggers_faced !== undefined ? triggers_faced : checkin.triggers_faced,
      coping_strategies_used: coping_strategies_used !== undefined ? coping_strategies_used : checkin.coping_strategies_used,
      is_smoke_free: is_smoke_free !== undefined ? is_smoke_free : checkin.is_smoke_free,
      streak_count,
      health_improvements: health_improvements !== undefined ? health_improvements : checkin.health_improvements,
      motivation_level: motivation_level !== undefined ? motivation_level : checkin.motivation_level,
      checkin_time: checkin_time !== undefined ? checkin_time : checkin.checkin_time
    });

    res.json({
      success: true,
      message: 'Daily check-in updated successfully',
      data: checkin
    });

  } catch (error) {
    console.error('Update daily check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily check-in',
      error: error.message
    });
  }
};

// GET /api/daily-checkins/stats - Get check-in statistics
export const getCheckinStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const checkins = await DailyCheckin.findAll({
      where: {
        user_id: userId,
        checkin_date: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['checkin_date', 'ASC']]
    });

    // Calculate statistics
    const totalCheckins = checkins.length;
    const smokeFreedays = checkins.filter(c => c.is_smoke_free).length;
    const currentStreak = checkins.length > 0 ? checkins[checkins.length - 1].streak_count : 0;
    const totalMoneySaved = checkins.reduce((sum, c) => sum + parseFloat(c.money_saved || 0), 0);
    const totalCigarettesAvoided = checkins.reduce((sum, c) => sum + parseInt(c.cigarettes_avoided || 0), 0);
    
    const avgMoodRating = checkins.length > 0 
      ? checkins.reduce((sum, c) => sum + (c.mood_rating || 0), 0) / checkins.filter(c => c.mood_rating).length 
      : 0;
    
    const avgCravingLevel = checkins.length > 0
      ? checkins.reduce((sum, c) => sum + (c.craving_level || 0), 0) / checkins.filter(c => c.craving_level).length
      : 0;

    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        total_checkins: totalCheckins,
        smoke_free_days: smokeFreedays,
        current_streak: currentStreak,
        success_rate: totalCheckins > 0 ? Math.round((smokeFreedays / totalCheckins) * 100) : 0,
        total_money_saved: totalMoneySaved,
        total_cigarettes_avoided: totalCigarettesAvoided,
        average_mood_rating: Math.round(avgMoodRating * 10) / 10,
        average_craving_level: Math.round(avgCravingLevel * 10) / 10,
        checkins
      }
    });

  } catch (error) {
    console.error('Get check-in stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get check-in statistics',
      error: error.message
    });
  }
};

// DELETE /api/daily-checkins/:date - Delete a specific check-in
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
        message: 'Check-in not found for the specified date'
      });
    }

    await checkin.destroy();

    res.json({
      success: true,
      message: 'Check-in deleted successfully'
    });

  } catch (error) {
    console.error('Delete check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete check-in',
      error: error.message
    });
  }
};
