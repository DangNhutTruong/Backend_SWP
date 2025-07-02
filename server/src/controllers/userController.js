import { User, SmokingStatus } from '../models/index.js';
import { hashPassword, comparePassword } from '../middleware/auth.js';

// GET /api/users/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, gender, date_of_birth } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      full_name,
      phone,
      gender,
      date_of_birth,
      updated_at: new Date()
    });

    // Return user without password
    const { password_hash: _, ...userWithoutPassword } = user.toJSON();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// POST /api/users/avatar
export const uploadAvatar = async (req, res) => {
  try {
    // This would typically handle file upload
    // For now, expecting avatar_url in body
    const { avatar_url } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({
      avatar_url,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar_url: user.avatar_url }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

// GET /api/users/smoking-status
export const getSmokingStatus = async (req, res) => {
  try {
    const smokingStatus = await SmokingStatus.findOne({
      where: { smoker_id: req.user.id },
      order: [['recorded_at', 'DESC']]
    });

    res.json({
      success: true,
      data: smokingStatus
    });
  } catch (error) {
    console.error('Get smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get smoking status',
      error: error.message
    });
  }
};

// PUT /api/users/smoking-status
export const updateSmokingStatus = async (req, res) => {
  try {
    const { status, cigarettes_per_day } = req.body;

    // Create new smoking status record
    const smokingStatus = await SmokingStatus.create({
      smoker_id: req.user.id,
      status,
      cigarettes_per_day
    });

    res.json({
      success: true,
      message: 'Smoking status updated successfully',
      data: smokingStatus
    });
  } catch (error) {
    console.error('Update smoking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update smoking status',
      error: error.message
    });
  }
};

// DELETE /api/users/account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password before deletion
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // In a real app, you might want to soft delete or anonymize data
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};