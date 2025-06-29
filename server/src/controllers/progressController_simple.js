// Temporary simplified progressController
export const getAllProgress = async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Get all progress API - coming soon'
  });
};

export const createProgress = async (req, res) => {
  res.json({
    success: true,
    message: 'Create progress API - coming soon'
  });
};

export const getUserProgress = async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Get user progress API - coming soon'
  });
};

export const updateProgress = async (req, res) => {
  res.json({
    success: true,
    message: 'Update progress API - coming soon'
  });
};

export const deleteProgress = async (req, res) => {
  res.json({
    success: true,
    message: 'Delete progress API - coming soon'
  });
};

export const getProgressStats = async (req, res) => {
  res.json({
    success: true,
    data: {
      totalDays: 0,
      successfulDays: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    message: 'Get progress stats API - coming soon'
  });
};

export const getProgressChart = async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Get progress chart API - coming soon'
  });
};
