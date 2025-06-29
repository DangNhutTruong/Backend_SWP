import QuitPlan from '../models/QuitPlan.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// @desc    Tạo kế hoạch cai thuốc mới
// @route   POST /api/plans
// @access  Private
export const createPlan = async (req, res) => {
  try {
    const { title, reason, startDate, expectedQuitDate, description, milestones } = req.body;
    const userId = req.user.UserID;

    // Kiểm tra input
    if (!title || !reason || !startDate || !expectedQuitDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Tạo plan mới
    const planData = {
      UserID: userId,
      Title: title,
      Reason: reason,
      StartDate: new Date(startDate),
      ExpectedQuitDate: new Date(expectedQuitDate),
      Description: description || '',
      Milestones: milestones ? JSON.stringify(milestones) : '[]',
      Status: 'active',
      Progress: 0
    };

    const plan = await QuitPlan.create(planData);

    res.status(201).json({
      success: true,
      message: 'Tạo kế hoạch thành công',
      data: plan.toJSON()
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo kế hoạch'
    });
  }
};

// @desc    Lấy tất cả kế hoạch của user
// @route   GET /api/plans
// @access  Private
export const getUserPlans = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const whereCondition = { UserID: userId };

    if (status) {
      whereCondition.Status = status;
    }

    const { count, rows: plans } = await QuitPlan.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['CreatedAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: plans.map(plan => plan.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get user plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách kế hoạch'
    });
  }
};

// @desc    Lấy chi tiết kế hoạch theo ID
// @route   GET /api/plans/:id
// @access  Private
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
        message: 'Kế hoạch không tồn tại'
      });
    }

    res.json({
      success: true,
      data: plan.toJSON()
    });

  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết kế hoạch'
    });
  }
};

// @desc    Cập nhật kế hoạch
// @route   PUT /api/plans/:id
// @access  Private
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const allowedUpdates = [
      'Title',
      'Reason',
      'ExpectedQuitDate',
      'Description',
      'Milestones',
      'Status',
      'Progress'
    ];

    // Lọc chỉ những field được phép update
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'Milestones' && typeof req.body[key] === 'object') {
          updates[key] = JSON.stringify(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    const [updatedRowsCount] = await QuitPlan.update(updates, {
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kế hoạch không tồn tại hoặc bạn không có quyền cập nhật'
      });
    }

    // Lấy kế hoạch đã cập nhật
    const updatedPlan = await QuitPlan.findOne({
      where: { PlanID: id }
    });

    res.json({
      success: true,
      message: 'Cập nhật kế hoạch thành công',
      data: updatedPlan.toJSON()
    });

  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật kế hoạch'
    });
  }
};

// @desc    Xóa kế hoạch
// @route   DELETE /api/plans/:id
// @access  Private
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const deletedRowsCount = await QuitPlan.destroy({
      where: {
        PlanID: id,
        UserID: userId
      }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kế hoạch không tồn tại hoặc bạn không có quyền xóa'
      });
    }

    res.json({
      success: true,
      message: 'Xóa kế hoạch thành công'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa kế hoạch'
    });
  }
};

// @desc    Lấy template kế hoạch mẫu
// @route   GET /api/plans/templates
// @access  Private
export const getPlanTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        title: 'Kế hoạch từ từ giảm',
        description: 'Giảm dần số lượng thuốc lá mỗi ngày',
        duration: '4 weeks',
        difficulty: 'easy',
        milestones: [
          { week: 1, target: 'Giảm 25% số thuốc hàng ngày' },
          { week: 2, target: 'Giảm 50% số thuốc hàng ngày' },
          { week: 3, target: 'Giảm 75% số thuốc hàng ngày' },
          { week: 4, target: 'Cai hoàn toàn' }
        ]
      },
      {
        id: 2,
        title: 'Kế hoạch cai đột ngột',
        description: 'Ngừng hút thuốc hoàn toàn ngay lập tức',
        duration: '1 day',
        difficulty: 'hard',
        milestones: [
          { day: 1, target: 'Ngừng hút thuốc hoàn toàn' }
        ]
      },
      {
        id: 3,
        title: 'Kế hoạch thay thế nicotine',
        description: 'Sử dụng các sản phẩm thay thế nicotine',
        duration: '8 weeks',
        difficulty: 'medium',
        milestones: [
          { week: 1, target: 'Bắt đầu sử dụng kẹo nicotine' },
          { week: 2, target: 'Giảm 50% thuốc lá, tăng kẹo nicotine' },
          { week: 4, target: 'Ngừng thuốc lá, chỉ dùng kẹo nicotine' },
          { week: 6, target: 'Giảm dần kẹo nicotine' },
          { week: 8, target: 'Ngừng hoàn toàn' }
        ]
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Get plan templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy template kế hoạch'
    });
  }
};

// @desc    Đánh dấu hoàn thành milestone
// @route   POST /api/plans/:id/milestones/:milestoneIndex/complete
// @access  Private
export const completeMilestone = async (req, res) => {
  try {
    const { id, milestoneIndex } = req.params;
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
        message: 'Kế hoạch không tồn tại'
      });
    }

    // Parse milestones
    let milestones = [];
    try {
      milestones = JSON.parse(plan.Milestones || '[]');
    } catch (e) {
      milestones = [];
    }

    const index = parseInt(milestoneIndex);
    if (index < 0 || index >= milestones.length) {
      return res.status(400).json({
        success: false,
        message: 'Milestone không hợp lệ'
      });
    }

    // Đánh dấu milestone hoàn thành
    milestones[index].completed = true;
    milestones[index].completedAt = new Date();

    // Tính toán progress
    const completedCount = milestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / milestones.length) * 100);

    // Cập nhật plan
    plan.Milestones = JSON.stringify(milestones);
    plan.Progress = progress;
    
    if (progress === 100) {
      plan.Status = 'completed';
      plan.CompletedAt = new Date();
    }

    await plan.save();

    res.json({
      success: true,
      message: 'Đánh dấu milestone hoàn thành',
      data: plan.toJSON()
    });

  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu milestone'
    });
  }
};
