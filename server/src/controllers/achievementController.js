import { User } from '../models/index.js';
// import Achievement, UserAchievement, Share, CommunityPost later when needed
import { Op } from 'sequelize';

// GET /api/achievements/user
export const getUserAchievements = async (req, res) => {
  try {
    const user_id = req.user.id;

    const userAchievements = await UserAchievement.findAll({
      where: { smoker_id: user_id },
      include: [{
        model: Achievement,
        as: 'achievement'
      }],
      order: [['achieved_at', 'DESC']]
    });

    res.json({
      success: true,
      data: userAchievements
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user achievements',
      error: error.message
    });
  }
};

// GET /api/achievements/all
export const getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.findAll({
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get all achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
      error: error.message
    });
  }
};

// POST /api/achievements/check
export const checkAchievements = async (req, res) => {
  try {
    const user_id = req.user.id;

    // This would contain logic to check if user has earned new achievements
    // Based on their progress, smoking status, etc.
    // For now, return a placeholder response

    // Example: Check if user has achieved "7 days smoke-free"
    // You would implement actual achievement checking logic here

    res.json({
      success: true,
      message: 'Achievement check completed',
      data: {
        newAchievements: [], // Array of newly earned achievements
        message: 'No new achievements earned at this time'
      }
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check achievements',
      error: error.message
    });
  }
};

// POST /api/achievements/share/:id
export const shareAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image_url } = req.body;
    const user_id = req.user.id;

    // Check if user has this achievement
    const userAchievement = await UserAchievement.findOne({
      where: {
        smoker_id: user_id,
        achievement_id: id
      }
    });

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found or not earned by user'
      });
    }

    // Create a community post
    const communityPost = await CommunityPost.create({
      author_id: user_id,
      content: content || `I just earned a new achievement!`,
      image_url
    });

    // Create a share record
    const share = await Share.create({
      smoker_id: user_id,
      achievement_id: id,
      community_post_id: communityPost.id
    });

    // Get the complete data for response
    const shareWithDetails = await Share.findByPk(share.id, {
      include: [
        {
          model: Achievement,
          as: 'achievement'
        },
        {
          model: CommunityPost,
          as: 'communityPost'
        },
        {
          model: User,
          as: 'smoker',
          attributes: { exclude: ['password_hash'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Achievement shared successfully',
      data: shareWithDetails
    });
  } catch (error) {
    console.error('Share achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share achievement',
      error: error.message
    });
  }
};

// GET /api/achievements/:id
export const getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findByPk(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    // Optionally include stats about how many users have earned this achievement
    const earnedCount = await UserAchievement.count({
      where: { achievement_id: id }
    });

    res.json({
      success: true,
      data: {
        ...achievement.toJSON(),
        earnedByCount: earnedCount
      }
    });
  } catch (error) {
    console.error('Get achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievement',
      error: error.message
    });
  }
};
