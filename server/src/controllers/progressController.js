import { Progress, QuitSmokingPlan } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// POST /api/progress/checkin
export const createCheckin = async (req, res) => {
  try {
    const { plan_id, progress_date, status, note } = req.body;
    const user_id = req.user.id;

    // Verify the plan belongs to the user
    const plan = await QuitSmokingPlan.findOne({
      where: {
        id: plan_id,
        smoker_id: user_id
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    // Check if checkin already exists for this date
    const existingCheckin = await Progress.findOne({
      where: {
        plan_id,
        progress_date
      }
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: 'Checkin already exists for this date'
      });
    }

    const checkin = await Progress.create({
      plan_id,
      progress_date,
      status,
      note
    });

    res.status(201).json({
      success: true,
      message: 'Checkin created successfully',
      data: checkin
    });
  } catch (error) {
    console.error('Create checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkin',
      error: error.message
    });
  }
};

// GET /api/progress/user
export const getUserProgress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { plan_id, limit = 30 } = req.query;

    let whereClause = {};
    if (plan_id) {
      // Verify the plan belongs to the user
      const plan = await QuitSmokingPlan.findOne({
        where: {
          id: plan_id,
          smoker_id: user_id
        }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Quit plan not found'
        });
      }

      whereClause.plan_id = plan_id;
    } else {
      // Get progress for all user's plans
      const userPlans = await QuitSmokingPlan.findAll({
        where: { smoker_id: user_id },
        attributes: ['id']
      });

      if (userPlans.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      whereClause.plan_id = {
        [Op.in]: userPlans.map(p => p.id)
      };
    }

    const progress = await Progress.findAll({
      where: whereClause,
      include: [{
        model: QuitSmokingPlan,
        as: 'plan',
        attributes: ['id', 'plan_name', 'status']
      }],
      order: [['progress_date', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress',
      error: error.message
    });
  }
};

// GET /api/progress/user/:date
export const getProgressByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const user_id = req.user.id;

    // Get all user's plans
    const userPlans = await QuitSmokingPlan.findAll({
      where: { smoker_id: user_id },
      attributes: ['id']
    });

    if (userPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quit plans found'
      });
    }

    const progress = await Progress.findAll({
      where: {
        plan_id: {
          [Op.in]: userPlans.map(p => p.id)
        },
        progress_date: date
      },
      include: [{
        model: QuitSmokingPlan,
        as: 'plan',
        attributes: ['id', 'plan_name', 'status']
      }]
    });

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get progress by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress',
      error: error.message
    });
  }
};

// PUT /api/progress/checkin/:date
export const updateCheckin = async (req, res) => {
  try {
    const { date } = req.params;
    const { plan_id, status, note } = req.body;
    const user_id = req.user.id;

    // Verify the plan belongs to the user
    const plan = await QuitSmokingPlan.findOne({
      where: {
        id: plan_id,
        smoker_id: user_id
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    const progress = await Progress.findOne({
      where: {
        plan_id,
        progress_date: date
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Checkin not found for this date'
      });
    }

    await progress.update({
      status,
      note
    });

    res.json({
      success: true,
      message: 'Checkin updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Update checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checkin',
      error: error.message
    });
  }
};

// DELETE /api/progress/checkin/:date
export const deleteCheckin = async (req, res) => {
  try {
    const { date } = req.params;
    const { plan_id } = req.query;
    const user_id = req.user.id;

    // Verify the plan belongs to the user
    const plan = await QuitSmokingPlan.findOne({
      where: {
        id: plan_id,
        smoker_id: user_id
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    const progress = await Progress.findOne({
      where: {
        plan_id,
        progress_date: date
      }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Checkin not found for this date'
      });
    }

    await progress.destroy();

    res.json({
      success: true,
      message: 'Checkin deleted successfully'
    });
  } catch (error) {
    console.error('Delete checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete checkin',
      error: error.message
    });
  }
};

// GET /api/progress/stats
export const getProgressStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { plan_id } = req.query;

    let whereClause = {};
    if (plan_id) {
      // Verify the plan belongs to the user
      const plan = await QuitSmokingPlan.findOne({
        where: {
          id: plan_id,
          smoker_id: user_id
        }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Quit plan not found'
        });
      }

      whereClause.plan_id = plan_id;
    } else {
      // Get stats for all user's plans
      const userPlans = await QuitSmokingPlan.findAll({
        where: { smoker_id: user_id },
        attributes: ['id']
      });

      if (userPlans.length === 0) {
        return res.json({
          success: true,
          data: {
            totalCheckins: 0,
            goodDays: 0,
            averageDays: 0,
            badDays: 0,
            successRate: 0
          }
        });
      }

      whereClause.plan_id = {
        [Op.in]: userPlans.map(p => p.id)
      };
    }

    const stats = await Progress.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const totalCheckins = stats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
    const goodDays = stats.find(s => s.status === 'good')?.count || 0;
    const averageDays = stats.find(s => s.status === 'average')?.count || 0;
    const badDays = stats.find(s => s.status === 'bad')?.count || 0;
    const successRate = totalCheckins > 0 ? ((goodDays + averageDays) / totalCheckins * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalCheckins,
        goodDays: parseInt(goodDays),
        averageDays: parseInt(averageDays),
        badDays: parseInt(badDays),
        successRate: parseFloat(successRate)
      }
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress stats',
      error: error.message
    });
  }
};

// GET /api/progress/chart-data
export const getChartData = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { plan_id, days = 30 } = req.query;

    let whereClause = {
      progress_date: {
        [Op.gte]: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)
      }
    };

    if (plan_id) {
      // Verify the plan belongs to the user
      const plan = await QuitSmokingPlan.findOne({
        where: {
          id: plan_id,
          smoker_id: user_id
        }
      });

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Quit plan not found'
        });
      }

      whereClause.plan_id = plan_id;
    } else {
      // Get data for all user's plans
      const userPlans = await QuitSmokingPlan.findAll({
        where: { smoker_id: user_id },
        attributes: ['id']
      });

      if (userPlans.length === 0) {
        return res.json({
          success: true,
          data: []
        });
      }

      whereClause.plan_id = {
        [Op.in]: userPlans.map(p => p.id)
      };
    }

    const chartData = await Progress.findAll({
      where: whereClause,
      attributes: ['progress_date', 'status'],
      order: [['progress_date', 'ASC']]
    });

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chart data',
      error: error.message
    });
  }
};
