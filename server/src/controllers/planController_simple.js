// Temporary simplified planController
export const createPlan = async (req, res) => {
  res.json({
    success: true,
    message: 'Create plan API - coming soon'
  });
};

export const getUserPlans = async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Get user plans API - coming soon'
  });
};

export const getPlanById = async (req, res) => {
  res.json({
    success: true,
    data: null,
    message: 'Get plan by ID API - coming soon'
  });
};

export const updatePlan = async (req, res) => {
  res.json({
    success: true,
    message: 'Update plan API - coming soon'
  });
};

export const deletePlan = async (req, res) => {
  res.json({
    success: true,
    message: 'Delete plan API - coming soon'
  });
};

export const getPlanTemplates = async (req, res) => {
  const templates = [
    {
      id: 1,
      title: 'Kế hoạch từ từ giảm',
      description: 'Giảm dần số lượng thuốc lá mỗi ngày',
      duration: '4 weeks',
      difficulty: 'easy'
    },
    {
      id: 2,
      title: 'Kế hoạch cai đột ngột',
      description: 'Ngừng hút thuốc hoàn toàn ngay lập tức',
      duration: '1 day',
      difficulty: 'hard'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
};

export const completeMilestone = async (req, res) => {
  res.json({
    success: true,
    message: 'Complete milestone API - coming soon'
  });
};
