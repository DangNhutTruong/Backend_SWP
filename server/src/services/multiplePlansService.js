import { pool } from '../config/database.js';

/**
 * Multiple Quit Plans Management Service
 * Handles multiple quit plans, outcome tracking, and coach interactions
 */

// Get all plans for a user with detailed status
export const getAllUserPlans = async (userId) => {
    try {
        const [plans] = await pool.query(`
            SELECT 
                qsp.*,
                COUNT(DISTINCT ci.id) as total_coach_interactions,
                COUNT(DISTINCT pm.id) as total_milestones,
                COUNT(DISTINCT CASE WHEN pm.is_achieved = 1 THEN pm.id END) as achieved_milestones,
                MAX(ci.created_at) as last_coach_interaction_date
            FROM quit_smoking_plan qsp
            LEFT JOIN coach_interactions ci ON qsp.id = ci.plan_id
            LEFT JOIN plan_milestones pm ON qsp.id = pm.plan_id
            WHERE qsp.smoker_id = ?
            GROUP BY qsp.id
            ORDER BY qsp.created_at DESC
        `, [userId]);

        return plans.map(plan => ({
            ...plan,
            plan_details: typeof plan.plan_details === 'string' 
                ? JSON.parse(plan.plan_details) 
                : plan.plan_details,
            success_percentage: plan.total_milestones > 0 
                ? ((plan.achieved_milestones / plan.total_milestones) * 100).toFixed(2)
                : 0
        }));
    } catch (error) {
        console.error('Error getting user plans:', error);
        throw error;
    }
};

// Create a new quit plan (allows multiple active plans)
export const createMultiplePlan = async (planData) => {
    const connection = await pool.getConnection();
    try {
        console.log('🔄 Starting transaction for plan creation...');
        await connection.beginTransaction();

        console.log('📝 Inserting main plan with data:', JSON.stringify(planData, null, 2));

        // Insert main plan
        const [planResult] = await connection.query(`
            INSERT INTO quit_smoking_plan (
                smoker_id, plan_name, plan_details, start_date, end_date, 
                status, initial_cigarettes, strategy, 
                goal, total_weeks, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            planData.userId,
            planData.planName,
            JSON.stringify(planData.planDetails),
            planData.startDate,
            planData.endDate,
            'active',
            planData.initialCigarettes,
            planData.strategy,
            planData.goal,
            planData.totalWeeks,
            true
        ]);

        const planId = planResult.insertId;
        console.log('✅ Plan inserted with ID:', planId);

        // Create plan history entry
        await connection.query(`
            INSERT INTO quit_plan_history (plan_id, event_type, event_description)
            VALUES (?, 'created', ?)
        `, [planId, `Plan "${planData.planName}" created`]);

        console.log('✅ Plan history entry created');

        // Create milestones based on plan weeks
        if (planData.planDetails.weeks && Array.isArray(planData.planDetails.weeks)) {
            console.log('📝 Creating milestones for weeks:', planData.planDetails.weeks.length);
            
            const milestones = planData.planDetails.weeks.map((week, index) => [
                planId,
                'weekly_goal',
                `Week ${index + 1} Target`,
                week.target || week.amount,
                0,
                false
            ]);

            if (milestones.length > 0) {
                await connection.query(`
                    INSERT INTO plan_milestones 
                    (plan_id, milestone_type, milestone_name, target_value, current_value, is_achieved)
                    VALUES ?
                `, [milestones]);
                console.log('✅ Milestones created:', milestones.length);
            }
        } else {
            console.log('⚠️ No weeks data found in planDetails');
        }

        await connection.commit();
        console.log('✅ Transaction committed successfully');
        
        return { id: planId, success: true };
    } catch (error) {
        console.error('❌ Error in createMultiplePlan:', error);
        console.error('❌ Error stack:', error.stack);
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Update plan status and completion
export const updatePlanCompletion = async (planId, completionData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Update plan status (without completion_status column)
        await connection.query(`
            UPDATE quit_smoking_plan 
            SET success_rate = ?, 
                end_date = ?,
                failure_reason = ?,
                is_active = ?
            WHERE id = ?
        `, [
            completionData.successRate || 0,
            completionData.endDate || new Date(),
            completionData.failureReason || null,
            completionData.status === 'ongoing',
            planId
        ]);

        // Add history entry
        await connection.query(`
            INSERT INTO quit_plan_history (plan_id, event_type, event_description, event_data)
            VALUES (?, ?, ?, ?)
        `, [
            planId,
            completionData.status === 'completed_success' ? 'completed' : 'failed',
            `Plan ${completionData.status === 'completed_success' ? 'completed successfully' : 'failed'}`,
            JSON.stringify(completionData)
        ]);

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Record coach interaction
export const recordCoachInteraction = async (interactionData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Insert interaction record
        await connection.query(`
            INSERT INTO coach_interactions 
            (plan_id, user_id, coach_id, interaction_type, interaction_data, interaction_summary)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            interactionData.planId,
            interactionData.userId,
            interactionData.coachId || null,
            interactionData.type,
            JSON.stringify(interactionData.data || {}),
            interactionData.summary || ''
        ]);

        // Update plan's coach interaction count
        await connection.query(`
            UPDATE quit_smoking_plan 
            SET coach_interactions = coach_interactions + 1,
                last_coach_interaction = NOW()
            WHERE id = ?
        `, [interactionData.planId]);

        // Add history entry
        await connection.query(`
            INSERT INTO quit_plan_history (plan_id, event_type, event_description)
            VALUES (?, 'coach_interaction', ?)
        `, [interactionData.planId, `Coach interaction: ${interactionData.type}`]);

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Get plan statistics for reporting
export const getPlanStatistics = async (userId, timeRange = '30_days') => {
    try {
        const dateFilter = timeRange === '30_days' ? 'DATE_SUB(NOW(), INTERVAL 30 DAY)' : 
                          timeRange === '90_days' ? 'DATE_SUB(NOW(), INTERVAL 90 DAY)' : 
                          'DATE_SUB(NOW(), INTERVAL 1 YEAR)';

        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_plans,
                COUNT(CASE WHEN completion_status = 'completed_success' THEN 1 END) as successful_plans,
                COUNT(CASE WHEN completion_status = 'completed_failed' THEN 1 END) as failed_plans,
                COUNT(CASE WHEN completion_status = 'ongoing' THEN 1 END) as ongoing_plans,
                AVG(success_rate) as average_success_rate,
                SUM(coach_interactions) as total_coach_interactions,
                AVG(total_check_ins) as average_check_ins
            FROM quit_smoking_plan 
            WHERE smoker_id = ? AND created_at >= ${dateFilter}
        `, [userId]);

        const [recentActivity] = await pool.query(`
            SELECT 
                qph.event_type,
                qph.event_description,
                qph.created_at,
                qsp.plan_name
            FROM quit_plan_history qph
            JOIN quit_smoking_plan qsp ON qph.plan_id = qsp.id
            WHERE qsp.smoker_id = ? AND qph.created_at >= ${dateFilter}
            ORDER BY qph.created_at DESC
            LIMIT 10
        `, [userId]);

        return {
            statistics: stats[0],
            recentActivity
        };
    } catch (error) {
        console.error('Error getting plan statistics:', error);
        throw error;
    }
};

// Get coach interaction history
export const getCoachInteractionHistory = async (planId) => {
    try {
        const [interactions] = await pool.query(`
            SELECT 
                ci.*,
                u.username as coach_name
            FROM coach_interactions ci
            LEFT JOIN users u ON ci.coach_id = u.id
            WHERE ci.plan_id = ?
            ORDER BY ci.created_at DESC
        `, [planId]);

        return interactions.map(interaction => ({
            ...interaction,
            interaction_data: typeof interaction.interaction_data === 'string' 
                ? JSON.parse(interaction.interaction_data) 
                : interaction.interaction_data
        }));
    } catch (error) {
        console.error('Error getting coach interactions:', error);
        throw error;
    }
};

export default {
    getAllUserPlans,
    createMultiplePlan,
    updatePlanCompletion,
    recordCoachInteraction,
    getPlanStatistics,
    getCoachInteractionHistory
};
