import multiplePlansService from '../services/multiplePlansService.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { pool } from '../config/database.js';

/**
 * Multiple Plans Controller
 * Handles API endpoints for multiple quit plans management
 */

// GET /api/quit-plans/multiple - Get all plans for current user
export const getAllUserPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const plans = await multiplePlansService.getAllUserPlans(userId);
        
        return sendSuccess(res, 'User plans retrieved successfully', {
            total: plans.length,
            plans: plans
        });
    } catch (error) {
        console.error('Error getting user plans:', error);
        return sendError(res, 'Failed to retrieve user plans', 500);
    }
};

// POST /api/quit-plans/multiple - Create new plan (allows multiple)
export const createNewPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('📝 Creating new plan for user:', userId);
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        
        const planData = {
            userId,
            planName: req.body.planName || `Kế hoạch cai thuốc ${new Date().toLocaleDateString('vi-VN')}`,
            planDetails: {
                strategy: req.body.strategy || 'gradual',
                goal: req.body.goal || 'health',
                initialCigarettes: req.body.initialCigarettes || 20,
                weeks: req.body.weeks || [],
                totalWeeks: req.body.totalWeeks || 8,
                metadata: req.body.metadata || {}
            },
            startDate: req.body.startDate || new Date().toISOString().split('T')[0],
            endDate: req.body.endDate,
            initialCigarettes: req.body.initialCigarettes || 20,
            strategy: req.body.strategy || 'gradual',
            goal: req.body.goal || 'health',
            totalWeeks: req.body.totalWeeks || 8
        };

        console.log('📝 Plan data to create:', JSON.stringify(planData, null, 2));

        const result = await multiplePlansService.createMultiplePlan(planData);
        
        console.log('✅ Plan created successfully:', result);
        return sendSuccess(res, 'New quit plan created successfully', result, 201);
    } catch (error) {
        console.error('❌ Error creating new plan:', error);
        console.error('❌ Error stack:', error.stack);
        return sendError(res, 'Failed to create new plan: ' + error.message, 500);
    }
};

// PUT /api/quit-plans/multiple/:id/complete - Mark plan as completed/failed
export const completePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const completionData = {
            status: req.body.status || 'completed_success', // 'completed_success' | 'completed_failed'
            successRate: req.body.successRate || 0,
            endDate: req.body.endDate || new Date().toISOString().split('T')[0],
            failureReason: req.body.failureReason || null
        };

        const result = await multiplePlansService.updatePlanCompletion(planId, completionData);
        
        return sendSuccess(res, 'Plan completion status updated successfully', result);
    } catch (error) {
        console.error('Error completing plan:', error);
        return sendError(res, 'Failed to update plan completion', 500);
    }
};

// POST /api/quit-plans/multiple/:id/coach-interaction - Record coach interaction
export const recordCoachInteraction = async (req, res) => {
    try {
        const planId = req.params.id;
        const userId = req.user.id;
        
        const interactionData = {
            planId,
            userId,
            coachId: req.body.coachId || null,
            type: req.body.type || 'message', // 'message' | 'appointment' | 'feedback' | 'support_call' | 'emergency_help'
            data: req.body.data || {},
            summary: req.body.summary || ''
        };

        const result = await multiplePlansService.recordCoachInteraction(interactionData);
        
        return sendSuccess(res, 'Coach interaction recorded successfully', result);
    } catch (error) {
        console.error('Error recording coach interaction:', error);
        return sendError(res, 'Failed to record coach interaction', 500);
    }
};

// GET /api/quit-plans/multiple/statistics - Get user's plan statistics
export const getPlanStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        const timeRange = req.query.timeRange || '30_days'; // '30_days' | '90_days' | '1_year'
        
        const stats = await multiplePlansService.getPlanStatistics(userId, timeRange);
        
        return sendSuccess(res, 'Plan statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Error getting plan statistics:', error);
        return sendError(res, 'Failed to retrieve plan statistics', 500);
    }
};

// GET /api/quit-plans/multiple/:id/coach-interactions - Get coach interaction history for a plan
export const getCoachInteractions = async (req, res) => {
    try {
        const planId = req.params.id;
        
        const interactions = await multiplePlansService.getCoachInteractionHistory(planId);
        
        return sendSuccess(res, 'Coach interactions retrieved successfully', {
            total: interactions.length,
            interactions
        });
    } catch (error) {
        console.error('Error getting coach interactions:', error);
        return sendError(res, 'Failed to retrieve coach interactions', 500);
    }
};

// PUT /api/quit-plans/multiple/:id/activate - Set a plan as active (deactivate others)
export const setActivePlan = async (req, res) => {
    try {
        const planId = req.params.id;
        const userId = req.user.id;
        
        // Deactivate all other plans
        await pool.query(
            'UPDATE quit_smoking_plan SET is_active = FALSE WHERE smoker_id = ?',
            [userId]
        );
        
        // Activate selected plan
        await pool.query(
            'UPDATE quit_smoking_plan SET is_active = TRUE WHERE id = ? AND smoker_id = ?',
            [planId, userId]
        );
        
        return sendSuccess(res, 'Active plan updated successfully');
    } catch (error) {
        console.error('Error setting active plan:', error);
        return sendError(res, 'Failed to set active plan', 500);
    }
};

// GET /api/quit-plans/multiple/dashboard - Get dashboard data for multiple plans
export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [plans, stats] = await Promise.all([
            multiplePlansService.getAllUserPlans(userId),
            multiplePlansService.getPlanStatistics(userId, '30_days')
        ]);
        
        const activePlan = plans.find(plan => plan.is_active) || plans[0];
        
        const dashboardData = {
            activePlan,
            totalPlans: plans.length,
            statistics: stats.statistics,
            recentActivity: stats.recentActivity,
            planSummary: {
                ongoing: plans.filter(p => p.completion_status === 'ongoing').length,
                successful: plans.filter(p => p.completion_status === 'completed_success').length,
                failed: plans.filter(p => p.completion_status === 'completed_failed').length,
                cancelled: plans.filter(p => p.completion_status === 'cancelled').length
            }
        };
        
        return sendSuccess(res, 'Dashboard data retrieved successfully', dashboardData);
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        return sendError(res, 'Failed to retrieve dashboard data', 500);
    }
};

export default {
    getAllUserPlans,
    createNewPlan,
    completePlan,
    recordCoachInteraction,
    getPlanStatistics,
    getCoachInteractions,
    setActivePlan,
    getDashboardData
};
