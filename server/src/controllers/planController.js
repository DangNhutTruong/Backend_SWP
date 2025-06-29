import QuitPlan from '../models/QuitPlan.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// Create a new quit plan
export const createPlan = async (req, res) => {
  try {
    const { title, reason, startDate, expectedQuitDate, description, milestones } = req.body;
    const userId = req.user.UserID;

    // Validate required fields
    if (!title || !reason || !startDate || !expectedQuitDate) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: title, reason, startDate, expectedQuitDate'
      });
    }

    // Check if user has an active plan
    const activePlan = await QuitPlan.findOne({
      where: {
        UserID: userId,
        Status: 'active'
      }
    });

    if (activePlan) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có một kế hoạch đang hoạt động. Vui lòng hoàn thành hoặc hủy kế hoạch hiện tại trước khi tạo kế hoạch mới.'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const expectedEnd = new Date(expectedQuitDate);
    
    if (start >= expectedEnd) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu phải trước ngày dự kiến kết thúc'
      });
    }

    // Parse and validate milestones
    let parsedMilestones = [];
    if (milestones) {
      if (typeof milestones === 'string') {
        try {
          parsedMilestones = JSON.parse(milestones);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng milestones không hợp lệ'
          });
        }
      } else if (Array.isArray(milestones)) {
        parsedMilestones = milestones;
      }
    }

    // Create the plan
    const plan = await QuitPlan.create({
      UserID: userId,
      Title: title,
      Reason: reason,
      StartDate: start,
      ExpectedQuitDate: expectedEnd,
      Description: description || null,
      Milestones: JSON.stringify(parsedMilestones),
      Status: 'active',
      Progress: 0
    });

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Tạo kế hoạch cai thuốc thành công'
    });

  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo kế hoạch'
    });
  }
};

// Get all plans for a user
export const getUserPlans = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { status, page = 1, limit = 10 } = req.query;

    let whereCondition = { UserID: userId };
    if (status) {
      whereCondition.Status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: plans } = await QuitPlan.findAndCountAll({
      where: whereCondition,
      order: [['CreatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: plans,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting user plans:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách kế hoạch'
    });
  }
};

// Get a specific plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const plan = await QuitPlan.findOne({
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch'
      });
    }

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Error getting plan by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin kế hoạch'
    });
  }
};

// Update a plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const { title, reason, expectedQuitDate, description, milestones, status } = req.body;

    const plan = await QuitPlan.findOne({
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (title !== undefined) updateData.Title = title;
    if (reason !== undefined) updateData.Reason = reason;
    if (expectedQuitDate !== undefined) {
      const expectedEnd = new Date(expectedQuitDate);
      if (expectedEnd <= plan.StartDate) {
        return res.status(400).json({
          success: false,
          message: 'Ngày dự kiến kết thúc phải sau ngày bắt đầu'
        });
      }
      updateData.ExpectedQuitDate = expectedEnd;
    }
    if (description !== undefined) updateData.Description = description;
    if (status !== undefined) {
      if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }
      updateData.Status = status;
      
      if (status === 'completed' && !plan.CompletedAt) {
        updateData.CompletedAt = new Date();
        updateData.Progress = 100;
      }
    }
    
    if (milestones !== undefined) {
      let parsedMilestones = [];
      if (typeof milestones === 'string') {
        try {
          parsedMilestones = JSON.parse(milestones);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng milestones không hợp lệ'
          });
        }
      } else if (Array.isArray(milestones)) {
        parsedMilestones = milestones;
      }
      
      updateData.Milestones = JSON.stringify(parsedMilestones);
      
      // Recalculate progress based on completed milestones
      if (parsedMilestones.length > 0) {
        const completedCount = parsedMilestones.filter(m => m.completed).length;
        updateData.Progress = Math.round((completedCount / parsedMilestones.length) * 100);
      }
    }

    await plan.update(updateData);

    res.json({
      success: true,
      data: plan,
      message: 'Cập nhật kế hoạch thành công'
    });

  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật kế hoạch'
    });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const plan = await QuitPlan.findOne({
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Xóa kế hoạch thành công'
    });

  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa kế hoạch'
    });
  }
};

// Get plan templates
export const getPlanTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        title: 'Kế hoạch từ từ giảm',
        description: 'Giảm dần số lượng thuốc lá mỗi ngày trong 4 tuần',
        duration: '4 weeks',
        difficulty: 'easy',
        milestones: [
          {
            id: 1,
            title: 'Tuần 1: Giảm 25%',
            description: 'Giảm xuống còn 75% số lượng thuốc lá hàng ngày',
            targetDate: 7,
            completed: false
          },
          {
            id: 2,
            title: 'Tuần 2: Giảm 50%',
            description: 'Giảm xuống còn 50% số lượng thuốc lá ban đầu',
            targetDate: 14,
            completed: false
          },
          {
            id: 3,
            title: 'Tuần 3: Giảm 75%',
            description: 'Chỉ hút 25% số lượng thuốc lá ban đầu',
            targetDate: 21,
            completed: false
          },
          {
            id: 4,
            title: 'Tuần 4: Hoàn toàn bỏ thuốc',
            description: 'Ngừng hút thuốc hoàn toàn',
            targetDate: 28,
            completed: false
          }
        ]
      },
      {
        id: 2,
        title: 'Kế hoạch cai đột ngột',
        description: 'Ngừng hút thuốc hoàn toàn ngay lập tức',
        duration: '1 day',
        difficulty: 'hard',
        milestones: [
          {
            id: 1,
            title: 'Ngày đầu tiên không thuốc',
            description: 'Vượt qua ngày đầu tiên không hút thuốc',
            targetDate: 1,
            completed: false
          },
          {
            id: 2,
            title: '3 ngày không thuốc',
            description: 'Hoàn thành 3 ngày đầu không hút thuốc',
            targetDate: 3,
            completed: false
          },
          {
            id: 3,
            title: '1 tuần không thuốc',
            description: 'Hoàn thành tuần đầu tiên không hút thuốc',
            targetDate: 7,
            completed: false
          },
          {
            id: 4,
            title: '1 tháng không thuốc',
            description: 'Hoàn thành tháng đầu tiên không hút thuốc',
            targetDate: 30,
            completed: false
          }
        ]
      },
      {
        id: 3,
        title: 'Kế hoạch thay thế dần',
        description: 'Thay thế thuốc lá bằng các hoạt động khác trong 6 tuần',
        duration: '6 weeks',
        difficulty: 'medium',
        milestones: [
          {
            id: 1,
            title: 'Xác định trigger',
            description: 'Xác định những tình huống khiến bạn muốn hút thuốc',
            targetDate: 3,
            completed: false
          },
          {
            id: 2,
            title: 'Tìm hoạt động thay thế',
            description: 'Tìm 3-5 hoạt động có thể thay thế việc hút thuốc',
            targetDate: 7,
            completed: false
          },
          {
            id: 3,
            title: 'Thực hành thay thế',
            description: 'Thực hành thay thế 50% số lần hút thuốc',
            targetDate: 21,
            completed: false
          },
          {
            id: 4,
            title: 'Hoàn toàn thay thế',
            description: 'Thay thế hoàn toàn việc hút thuốc bằng các hoạt động khác',
            targetDate: 42,
            completed: false
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error getting plan templates:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy mẫu kế hoạch'
    });
  }
};

// Complete a milestone
export const completeMilestone = async (req, res) => {
  try {
    const { planId, milestoneId } = req.params;
    const userId = req.user.UserID;

    const plan = await QuitPlan.findOne({
      where: {
        PlanID: planId,
        UserID: userId
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch'
      });
    }

    // Parse current milestones
    let milestones = [];
    if (typeof plan.Milestones === 'string') {
      try {
        milestones = JSON.parse(plan.Milestones);
      } catch (e) {
        milestones = [];
      }
    } else if (Array.isArray(plan.Milestones)) {
      milestones = plan.Milestones;
    }

    // Find and update the milestone
    const milestoneIndex = milestones.findIndex(m => m.id == milestoneId);
    
    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mốc tiến độ'
      });
    }

    // Mark milestone as completed
    milestones[milestoneIndex].completed = true;
    milestones[milestoneIndex].completedAt = new Date();

    // Calculate new progress
    const completedCount = milestones.filter(m => m.completed).length;
    const newProgress = Math.round((completedCount / milestones.length) * 100);

    // Update plan
    await plan.update({
      Milestones: JSON.stringify(milestones),
      Progress: newProgress,
      Status: newProgress === 100 ? 'completed' : plan.Status,
      CompletedAt: newProgress === 100 ? new Date() : plan.CompletedAt
    });

    res.json({
      success: true,
      data: {
        milestone: milestones[milestoneIndex],
        progress: newProgress,
        isCompleted: newProgress === 100
      },
      message: 'Hoàn thành mốc tiến độ thành công'
    });

  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hoàn thành mốc tiến độ'
    });
  }
};

// Get active plan for user
export const getActivePlan = async (req, res) => {
  try {
    const userId = req.user.UserID;

    const activePlan = await QuitPlan.findOne({
      where: {
        UserID: userId,
        Status: 'active'
      },
      order: [['CreatedAt', 'DESC']]
    });

    if (!activePlan) {
      return res.status(404).json({
        success: false,
        message: 'Không có kế hoạch đang hoạt động'
      });
    }

    res.json({
      success: true,
      data: activePlan
    });

  } catch (error) {
    console.error('Error getting active plan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy kế hoạch đang hoạt động'
    });
  }
};

// Pause/Resume plan
export const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const plan = await QuitPlan.findOne({
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch'
      });
    }

    if (plan.Status === 'completed' || plan.Status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi trạng thái kế hoạch đã hoàn thành hoặc đã hủy'
      });
    }

    const newStatus = plan.Status === 'active' ? 'paused' : 'active';
    
    await plan.update({
      Status: newStatus
    });

    res.json({
      success: true,
      data: plan,
      message: `${newStatus === 'active' ? 'Tiếp tục' : 'Tạm dừng'} kế hoạch thành công`
    });

  } catch (error) {
    console.error('Error toggling plan status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thay đổi trạng thái kế hoạch'
    });
  }
};
