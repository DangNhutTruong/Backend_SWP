import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../config/database.js';
import {
    createQuitPlan,
    getUserPlans,
    getPlanById,
    updatePlan,
    updatePlanStatus,
    deletePlan,
    getPlanTemplates
} from '../controllers/quitPlanController.js';

const router = express.Router();

// Create a new quit plan
router.post('/', authenticateToken, createQuitPlan);

// Get all quit plans for a user
router.get('/user', authenticateToken, getUserPlans);

// Get quit plans for a specific user (for coach dashboard)
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy tất cả kế hoạch của user
        const [plans] = await pool.execute(
            'SELECT * FROM quit_smoking_plan WHERE smoker_id = ? ORDER BY created_at DESC',
            [userId]
        );

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: `User ${userId} has no quit plans`
            });
        }

        // Parse weeks data và plan_details nếu có
        const processedPlans = plans.map(plan => {
            if (plan.weeks && typeof plan.weeks === 'string') {
                try {
                    plan.weeks = JSON.parse(plan.weeks);
                } catch (e) {
                    console.error('Error parsing weeks data:', e);
                }
            }

            if (plan.plan_details && typeof plan.plan_details === 'string') {
                try {
                    plan.plan_details = JSON.parse(plan.plan_details);
                } catch (e) {
                    console.error('Error parsing plan_details:', e);
                }
            }

            return plan;
        });

        return res.json({
            success: true,
            message: 'Quit plans retrieved successfully',
            data: processedPlans
        });
    } catch (error) {
        console.error('Error fetching user quit plans:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user quit plans',
            error: error.message
        });
    }
});

// Get quit plan templates
router.get('/templates', getPlanTemplates);

// Get user's active quit plan
router.get('/active', authenticateToken, async (req, res) => {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        const userId = req.user.id;

        // Lấy kế hoạch mới nhất được đánh dấu là active status
        const [activePlans] = await pool.execute(
            'SELECT * FROM quit_smoking_plan WHERE smoker_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        // Nếu không có kế hoạch active, thử lấy kế hoạch gần đây nhất
        if (activePlans.length === 0) {
            const [recentPlans] = await pool.execute(
                'SELECT * FROM quit_smoking_plan WHERE smoker_id = ? ORDER BY created_at DESC LIMIT 1',
                [userId]
            );

            if (recentPlans.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No quit plan found for user'
                });
            }

            // Parse weeks data if it exists and is a string
            const plan = recentPlans[0];
            if (plan.weeks && typeof plan.weeks === 'string') {
                try {
                    plan.weeks = JSON.parse(plan.weeks);
                } catch (e) {
                    console.error('Error parsing weeks data:', e);
                }
            }

            return res.json({
                success: true,
                message: 'Retrieved most recent quit plan',
                data: plan
            });
        }

        // Parse weeks data if it exists and is a string
        const plan = activePlans[0];
        if (plan.weeks && typeof plan.weeks === 'string') {
            try {
                plan.weeks = JSON.parse(plan.weeks);
            } catch (e) {
                console.error('Error parsing weeks data:', e);
            }
        }

        return res.json({
            success: true,
            message: 'Active quit plan retrieved successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error fetching active quit plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active quit plan',
            error: error.message
        });
    }
});

// Get a specific quit plan
router.get('/:id', authenticateToken, getPlanById);

// Update a quit plan
router.put('/:id', authenticateToken, updatePlan);

// Update plan status
router.patch('/:id/status', authenticateToken, updatePlanStatus);

// Delete a quit plan
router.delete('/:id', authenticateToken, deletePlan);

export default router;
