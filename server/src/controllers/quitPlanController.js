import { pool } from '../config/database.js';
import { sendError, sendSuccess } from '../utils/response.js';

// Create a new quit plan
export const createQuitPlan = async (req, res) => {
    // Check if user is authenticated first
    if (!req.user || !req.user.id) {
        console.log('❌ createQuitPlan - No authenticated user found');
        return sendError(res, 'Authentication required', 401);
    }

    try {
        console.log('💡 createQuitPlan - Request body:', JSON.stringify(req.body, null, 2));
        console.log('💡 User ID from token:', req.user.id);

        // Accept both planName and plan_name to be more flexible
        const planName = req.body.planName || req.body.plan_name;
        console.log('📝 Plan name received:', planName);
        console.log('📝 Plan name from planName field:', req.body.planName);
        console.log('📝 Plan name from plan_name field:', req.body.plan_name);
        const startDate = req.body.startDate || req.body.start_date;
        const initialCigarettes = req.body.initialCigarettes || req.body.initial_cigarettes;
        // Accept planType as strategy or use strategy directly
        const strategy = req.body.strategy || req.body.planType || 'gradual';
        const goal = req.body.goal || req.body.motivation || 'health';

        // Enhanced validation with detailed error messages
        if (!planName || planName.trim() === '') {
            console.log('❌ Validation error: planName is missing or empty');
            return sendError(res, 'Plan name is required and cannot be empty', 400);
        }

        if (!startDate) {
            console.log('❌ Validation error: startDate is missing');
            return sendError(res, 'Start date is required', 400);
        }

        if (!initialCigarettes || isNaN(initialCigarettes) || parseInt(initialCigarettes) <= 0) {
            console.log('❌ Validation error: initialCigarettes is invalid:', initialCigarettes);
            return sendError(res, 'Initial cigarettes count must be a positive number', 400);
        }

        // Ensure weeks is always a valid array
        let weeks = req.body.weeks || [];
        if (!Array.isArray(weeks)) {
            console.log('❌ Validation error: weeks is not an array:', weeks);
            return sendError(res, 'Weeks data must be an array', 400);
        }

        const totalWeeks = req.body.totalWeeks || req.body.total_weeks || weeks.length || 8;

        if (weeks.length === 0) {
            console.log('💡 Generating default weeks array for totalWeeks:', totalWeeks);
            weeks = Array.from({ length: totalWeeks }, (_, i) => ({
                week: i + 1,
                target: Math.max(0, Math.round(initialCigarettes * (1 - ((i + 1) / totalWeeks))))
            }));
        }

        // Validate weeks structure
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            if (!week.week || isNaN(week.week)) {
                console.log('❌ Validation error: Invalid week number at index', i, ':', week);
                return sendError(res, `Invalid week number at position ${i + 1}`, 400);
            }
            if (week.target === undefined || isNaN(week.target)) {
                console.log('❌ Validation error: Invalid target at index', i, ':', week);
                return sendError(res, `Invalid target value at week ${week.week}`, 400);
            }
        }

        // Calculate end date based on total weeks
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + (totalWeeks * 7));
        const endDate = endDateObj.toISOString().split('T')[0];

        // Generate tips based on strategy and weeks
        const generateTips = (strategy, totalWeeks) => {
            const commonTips = [
                "Uống nhiều nước để giải độc cơ thể",
                "Tập thể dục nhẹ khi cảm thấy thèm thuốc",
                "Tránh xa những nơi và hoàn cảnh thường hút thuốc",
                "Nhai kẹo cao su hoặc ăn trái cây khi thèm"
            ];

            if (strategy === 'quick') {
                return [
                    ...commonTips,
                    "Quyết tâm cao sẽ giúp bạn vượt qua khó khăn ban đầu",
                    "Tự thưởng cho bản thân sau mỗi tuần thành công",
                    "Tìm hoạt động thay thế ngay lập tức khi thèm thuốc"
                ];
            } else {
                return [
                    ...commonTips,
                    "Giảm từ từ giúp cơ thể thích nghi tốt hơn",
                    "Ghi nhật ký cảm xúc và tiến trình mỗi ngày",
                    "Chia sẻ mục tiêu với gia đình để được hỗ trợ"
                ];
            }
        };

        // Generate milestones based on total weeks
        const generateMilestones = (totalWeeks, initialCigarettes) => {
            const milestones = [];
            const quarterWeek = Math.ceil(totalWeeks / 4);
            const halfWeek = Math.ceil(totalWeeks / 2);
            const threeQuarterWeek = Math.ceil(totalWeeks * 3 / 4);

            milestones.push({
                week: quarterWeek,
                achievement: `Giảm được ${Math.round(25)}% lượng thuốc`
            });

            milestones.push({
                week: halfWeek,
                achievement: `Giảm được ${Math.round(50)}% lượng thuốc - hơi thở bắt đầu tươi hơn`
            });

            milestones.push({
                week: threeQuarterWeek,
                achievement: `Giảm được ${Math.round(75)}% lượng thuốc - vị giác cải thiện`
            });

            milestones.push({
                week: totalWeeks,
                achievement: "🎉 Hoàn toàn cai thuốc thành công!"
            });

            return milestones;
        };

        // Create enhanced plan details JSON with all the information
        const planDetails = {
            planName: planName.trim(),
            strategy: strategy,
            goal: goal,
            initialCigarettes: parseInt(initialCigarettes),
            totalWeeks: parseInt(totalWeeks),
            weeks: weeks,
            // Use tips from frontend if provided, otherwise generate
            tips: req.body.tips && Array.isArray(req.body.tips) && req.body.tips.length > 0
                ? req.body.tips
                : generateTips(strategy, totalWeeks),
            // Use milestones from frontend if provided, otherwise generate
            milestones: req.body.milestones && Array.isArray(req.body.milestones) && req.body.milestones.length > 0
                ? req.body.milestones
                : generateMilestones(totalWeeks, parseInt(initialCigarettes)),
            metadata: {
                createdAt: new Date().toISOString(),
                version: "1.0"
            }
        };

        // Log what we're working with after transformations
        console.log('💡 Processed data:', {
            planName,
            startDate,
            endDate,
            initialCigarettes: parseInt(initialCigarettes),
            strategy,
            goal,
            weeksLength: weeks.length,
            totalWeeks: parseInt(totalWeeks),
            userId: req.user?.id
        });

        // Insert into database using the current schema (smoker_id instead of user_id)
        const [result] = await pool.query(
            `INSERT INTO quit_smoking_plan (
                smoker_id, plan_name, plan_details, start_date, end_date, status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                planName.trim(),
                JSON.stringify(planDetails),
                startDate,
                endDate,
                req.body.status || 'ongoing' // Cho phép client truyền trạng thái, mặc định là 'ongoing'
            ]
        );

        console.log('💡 Database insert result:', {
            insertId: result.insertId,
            affectedRows: result.affectedRows
        });

        // Fetch the created plan
        const [newPlan] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ?',
            [result.insertId]
        );

        if (!newPlan || newPlan.length === 0) {
            console.log('❌ Failed to fetch newly created plan');
            return sendError(res, 'Plan was created but could not be retrieved', 500);
        }

        console.log('✅ Successfully created plan:', newPlan[0].id);

        // Transform the response to match frontend expectations
        const responseData = {
            id: newPlan[0].id,
            planName: newPlan[0].plan_name,
            startDate: newPlan[0].start_date,
            endDate: newPlan[0].end_date,
            status: newPlan[0].status,
            ...planDetails // Include all the detailed plan information
        };

        return sendSuccess(res, 'Quit plan created successfully', responseData, 201);

    } catch (error) {
        console.error('❌ Create quit plan error:', error);

        // More specific error handling
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return sendError(res, 'Invalid user reference', 400);
        } else if (error.code === 'ER_DATA_TOO_LONG') {
            return sendError(res, 'Data provided is too long', 400);
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            return sendError(res, 'Required field is missing', 400);
        }
        // Đã loại bỏ lỗi ER_DUP_ENTRY vì giờ một user có thể tạo nhiều kế hoạch

        return sendError(res, `Failed to create quit plan: ${error.message}`, 500);
    }
};

// Get all quit plans for a user
export const getUserPlans = async (req, res) => {
    try {
        console.log('💡 getUserPlans - User ID:', req.user.id);

        const [plans] = await pool.query(
            `SELECT * FROM quit_smoking_plan 
            WHERE smoker_id = ? 
            ORDER BY created_at DESC`,
            [req.user.id]
        );

        console.log('💡 Found plans:', plans.length);

        // Transform the data to match frontend expectations
        const transformedPlans = plans.map(plan => {
            let planDetails = {};
            try {
                planDetails = typeof plan.plan_details === 'string'
                    ? JSON.parse(plan.plan_details)
                    : plan.plan_details || {};
            } catch (parseError) {
                console.warn('Error parsing plan_details for plan', plan.id, ':', parseError);
                planDetails = {};
            }

            return {
                id: plan.id,
                planName: plan.plan_name,
                plan_name: plan.plan_name, // Keep both for compatibility
                startDate: plan.start_date,
                start_date: plan.start_date,
                endDate: plan.end_date,
                end_date: plan.end_date,
                status: plan.status,
                created_at: plan.created_at,
                // Add is_active based on status
                is_active: plan.status === 'ongoing',
                // Extract data from plan_details JSON
                strategy: planDetails.strategy || 'gradual',
                planType: planDetails.strategy || 'gradual',
                goal: planDetails.goal || 'health',
                motivation: planDetails.goal || 'health',
                initialCigarettes: planDetails.initialCigarettes || 10,
                initial_cigarettes: planDetails.initialCigarettes || 10,
                totalWeeks: planDetails.totalWeeks || 8,
                total_weeks: planDetails.totalWeeks || 8,
                weeks: planDetails.weeks || [],
                // Add metadata for frontend compatibility
                metadata: planDetails.metadata || {
                    packPrice: planDetails.packPrice || 25000,
                    smokingYears: planDetails.smokingYears || 5,
                    selectedPlanId: planDetails.selectedPlanId || 1
                }
            };
        });

        return sendSuccess(res, 'Quit plans retrieved successfully', transformedPlans);
    } catch (error) {
        console.error('Get user plans error:', error);
        return sendError(res, 'Failed to retrieve quit plans', 500);
    }
};

// Get a specific quit plan by ID
export const getPlanById = async (req, res) => {
    try {
        const planId = req.params.id;

        const [plans] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ? AND smoker_id = ?',
            [planId, req.user.id]
        );

        if (!plans || plans.length === 0) {
            return sendError(res, 'Quit plan not found', 404);
        }

        // Transform the data similar to getUserPlans
        const plan = plans[0];
        let planDetails = {};
        try {
            planDetails = typeof plan.plan_details === 'string'
                ? JSON.parse(plan.plan_details)
                : plan.plan_details || {};
        } catch (parseError) {
            console.warn('Error parsing plan_details for plan', plan.id, ':', parseError);
            planDetails = {};
        }

        const transformedPlan = {
            id: plan.id,
            planName: plan.plan_name,
            plan_name: plan.plan_name,
            startDate: plan.start_date,
            start_date: plan.start_date,
            endDate: plan.end_date,
            end_date: plan.end_date,
            status: plan.status,
            created_at: plan.created_at,
            strategy: planDetails.strategy || 'gradual',
            planType: planDetails.strategy || 'gradual',
            goal: planDetails.goal || 'health',
            motivation: planDetails.goal || 'health',
            initialCigarettes: planDetails.initialCigarettes || 10,
            initial_cigarettes: planDetails.initialCigarettes || 10,
            totalWeeks: planDetails.totalWeeks || 8,
            total_weeks: planDetails.totalWeeks || 8,
            weeks: planDetails.weeks || []
        };

        return sendSuccess(res, 'Quit plan retrieved successfully', transformedPlan);
    } catch (error) {
        console.error('Get plan by ID error:', error);
        return sendError(res, 'Failed to retrieve quit plan', 500);
    }
};

// Update a quit plan
export const updatePlan = async (req, res) => {
    try {
        const planId = req.params.id;

        // First check if plan exists and belongs to user
        const [existingPlans] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ? AND smoker_id = ?',
            [planId, req.user.id]
        );

        if (!existingPlans || existingPlans.length === 0) {
            return sendError(res, 'Quit plan not found', 404);
        }

        const planName = req.body.planName || req.body.plan_name;
        let startDate = req.body.startDate || req.body.start_date;
        const initialCigarettes = req.body.initialCigarettes || req.body.initial_cigarettes;
        const strategy = req.body.strategy || req.body.planType || 'gradual';
        const goal = req.body.goal || req.body.motivation || 'health';
        let weeks = req.body.weeks || [];
        const totalWeeks = req.body.totalWeeks || req.body.total_weeks || weeks.length || 8;

        // Validate and set default startDate if not provided or invalid
        if (!startDate || isNaN(new Date(startDate).getTime())) {
            startDate = new Date().toISOString().split('T')[0];
        }

        // Calculate end date
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + (totalWeeks * 7));
        const endDate = endDateObj.toISOString().split('T')[0];

        // Create updated plan details
        const planDetails = {
            planName: planName,
            strategy: strategy,
            goal: goal,
            initialCigarettes: parseInt(initialCigarettes),
            totalWeeks: parseInt(totalWeeks),
            weeks: weeks
        };

        // Update the plan
        await pool.query(
            `UPDATE quit_smoking_plan 
            SET plan_name = ?, plan_details = ?, start_date = ?, end_date = ?
            WHERE id = ? AND smoker_id = ?`,
            [
                planName,
                JSON.stringify(planDetails),
                startDate,
                endDate,
                planId,
                req.user.id
            ]
        );

        // Fetch updated plan
        const [updatedPlans] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ?',
            [planId]
        );

        const responseData = {
            id: updatedPlans[0].id,
            planName: updatedPlans[0].plan_name,
            startDate: updatedPlans[0].start_date,
            endDate: updatedPlans[0].end_date,
            status: updatedPlans[0].status,
            ...planDetails
        };

        return sendSuccess(res, 'Quit plan updated successfully', responseData);
    } catch (error) {
        console.error('Update plan error:', error);
        return sendError(res, 'Failed to update quit plan', 500);
    }
};

// Delete a quit plan
export const deletePlan = async (req, res) => {
    try {
        const planId = req.params.id;

        // Check if plan exists and belongs to user
        const [existingPlans] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ? AND smoker_id = ?',
            [planId, req.user.id]
        );

        if (!existingPlans || existingPlans.length === 0) {
            return sendError(res, 'Quit plan not found', 404);
        }

        // Delete the plan
        await pool.query(
            'DELETE FROM quit_smoking_plan WHERE id = ? AND smoker_id = ?',
            [planId, req.user.id]
        );

        return sendSuccess(res, 'Quit plan deleted successfully', { id: planId });
    } catch (error) {
        console.error('Delete plan error:', error);
        return sendError(res, 'Failed to delete quit plan', 500);
    }
};

// Update plan status
export const updatePlanStatus = async (req, res) => {
    try {
        const planId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return sendError(res, 'Status is required', 400);
        }

        // Kiểm tra trạng thái hợp lệ
        const validStatuses = ['ongoing', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
            return sendError(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
        }

        // Kiểm tra kế hoạch tồn tại và thuộc về user
        const [existingPlans] = await pool.query(
            'SELECT * FROM quit_smoking_plan WHERE id = ? AND smoker_id = ?',
            [planId, req.user.id]
        );

        if (!existingPlans || existingPlans.length === 0) {
            return sendError(res, 'Quit plan not found', 404);
        }

        // Cập nhật trạng thái
        await pool.query(
            'UPDATE quit_smoking_plan SET status = ? WHERE id = ? AND smoker_id = ?',
            [status, planId, req.user.id]
        );

        return sendSuccess(res, 'Plan status updated successfully', {
            id: planId,
            status,
            is_active: status === 'ongoing'
        });

    } catch (error) {
        console.error('Update plan status error:', error);
        return sendError(res, 'Failed to update plan status', 500);
    }
};

// Get plan templates
export const getPlanTemplates = async (req, res) => {
    try {
        console.log('💡 getPlanTemplates called - Query:', req.query);
        const cigarettesPerDay = parseInt(req.query.cigarettesPerDay) || 10;

        // Simple templates for now
        const templates = [
            {
                name: "Kế hoạch nhanh",
                type: "quick",
                totalWeeks: cigarettesPerDay < 10 ? 4 : cigarettesPerDay <= 20 ? 6 : 8,
                description: `Giảm nhanh trong ${cigarettesPerDay < 10 ? 4 : cigarettesPerDay <= 20 ? 6 : 8} tuần`,
                subtitle: "Phù hợp cho người có ý chí mạnh"
            },
            {
                name: "Kế hoạch từ từ",
                type: "gradual",
                totalWeeks: cigarettesPerDay < 10 ? 6 : cigarettesPerDay <= 20 ? 8 : 12,
                description: `Giảm từ từ trong ${cigarettesPerDay < 10 ? 6 : cigarettesPerDay <= 20 ? 8 : 12} tuần`,
                subtitle: "Phù hợp cho cách tiếp cận ổn định"
            }
        ];

        return sendSuccess(res, 'Plan templates retrieved successfully', templates);
    } catch (error) {
        console.error('Get plan templates error:', error);
        return sendError(res, 'Failed to retrieve plan templates', 500);
    }
};
