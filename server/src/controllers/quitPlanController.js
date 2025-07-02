import { QuitSmokingPlan, User, Progress } from '../models/index.js';
import { Op } from 'sequelize';

// POST /api/quit-plans
export const createQuitPlan = async (req, res) => {
  try {
    const { plan_name, plan_details, start_date, end_date } = req.body;
    const smoker_id = req.user.id;

    // Check if user already has an active plan
    const existingPlan = await QuitSmokingPlan.findOne({
      where: {
        smoker_id,
        status: 'ongoing'
      }
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active quit smoking plan'
      });
    }

    const plan = await QuitSmokingPlan.create({
      smoker_id,
      plan_name,
      plan_details,
      start_date,
      end_date,
      status: 'ongoing'
    });

    res.status(201).json({
      success: true,
      message: 'Quit smoking plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create quit plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quit plan',
      error: error.message
    });
  }
};

// GET /api/quit-plans/user
export const getUserQuitPlans = async (req, res) => {
  try {
    const smoker_id = req.user.id;

    const plans = await QuitSmokingPlan.findAll({
      where: { smoker_id },
      include: [{
        model: Progress,
        as: 'progressRecords'
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get user quit plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quit plans',
      error: error.message
    });
  }
};

// GET /api/quit-plans/:id
export const getQuitPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const smoker_id = req.user.id;

    const plan = await QuitSmokingPlan.findOne({
      where: {
        id,
        smoker_id
      },
      include: [{
        model: Progress,
        as: 'progressRecords',
        order: [['progress_date', 'DESC']]
      }]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get quit plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quit plan',
      error: error.message
    });
  }
};

// PUT /api/quit-plans/:id
export const updateQuitPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_name, plan_details, start_date, end_date, status } = req.body;
    const smoker_id = req.user.id;

    const plan = await QuitSmokingPlan.findOne({
      where: {
        id,
        smoker_id
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    await plan.update({
      plan_name,
      plan_details,
      start_date,
      end_date,
      status
    });

    res.json({
      success: true,
      message: 'Quit plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update quit plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quit plan',
      error: error.message
    });
  }
};

// DELETE /api/quit-plans/:id
export const deleteQuitPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const smoker_id = req.user.id;

    const plan = await QuitSmokingPlan.findOne({
      where: {
        id,
        smoker_id
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Quit plan not found'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Quit plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete quit plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quit plan',
      error: error.message
    });
  }
};

// GET /api/quit-plans/templates
export const getQuitPlanTemplates = async (req, res) => {
  try {
    // Return predefined templates for quit smoking plans
    const templates = [
      {
        id: 1,
        name: "Cold Turkey Method",
        description: "Stop smoking completely from day one",
        details: "This method involves stopping smoking completely on your quit date. It's challenging but effective for many people.",
        duration_days: 30
      },
      {
        id: 2,
        name: "Gradual Reduction",
        description: "Gradually reduce the number of cigarettes",
        details: "Slowly decrease the number of cigarettes you smoke each day until you reach zero.",
        duration_days: 60
      },
      {
        id: 3,
        name: "21-Day Challenge",
        description: "Form new habits in 21 days",
        details: "Focus on building new healthy habits to replace smoking over 21 days.",
        duration_days: 21
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get quit plan templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quit plan templates',
      error: error.message
    });
  }
};
