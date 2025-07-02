// import { Package, Register } from '../models/index.js';
import Package from '../models/Package.js';
import { Op } from 'sequelize';

// GET /api/packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      order: [['price', 'ASC']]
    });

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get packages',
      error: error.message
    });
  }
};

// GET /api/packages/:id
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findByPk(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: packageData
    });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get package',
      error: error.message
    });
  }
};

// POST /api/packages/purchase
export const purchasePackage = async (req, res) => {
  try {
    const { package_id } = req.body;
    const user_id = req.user.id;

    // Check if package exists
    const packageData = await Package.findByPk(package_id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Check if user already has an active registration for this package
    const existingRegistration = await Register.findOne({
      where: {
        user_id,
        package_id,
        status: 'active',
        expired_at: {
          [Op.gt]: new Date()
        }
      }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active registration for this package'
      });
    }

    // Calculate expiration date
    const registered_at = new Date();
    const expired_at = new Date();
    expired_at.setMonth(expired_at.getMonth() + packageData.duration_months);

    // Create registration
    const registration = await Register.create({
      user_id,
      package_id,
      registered_at,
      expired_at,
      status: 'active'
    });

    // Include package details in response
    const registrationWithPackage = await Register.findByPk(registration.id, {
      include: [{
        model: Package,
        as: 'package'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Package purchased successfully',
      data: registrationWithPackage
    });
  } catch (error) {
    console.error('Purchase package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase package',
      error: error.message
    });
  }
};

// GET /api/packages/user/current
export const getCurrentUserPackage = async (req, res) => {
  try {
    const user_id = req.user.id;

    const currentRegistration = await Register.findOne({
      where: {
        user_id,
        status: 'active',
        expired_at: {
          [Op.gt]: new Date()
        }
      },
      include: [{
        model: Package,
        as: 'package'
      }],
      order: [['registered_at', 'DESC']]
    });

    if (!currentRegistration) {
      return res.status(404).json({
        success: false,
        message: 'No active package found'
      });
    }

    res.json({
      success: true,
      data: currentRegistration
    });
  } catch (error) {
    console.error('Get current package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current package',
      error: error.message
    });
  }
};

// GET /api/packages/user/history
export const getUserPackageHistory = async (req, res) => {
  try {
    const user_id = req.user.id;

    const registrations = await Register.findAll({
      where: { user_id },
      include: [{
        model: Package,
        as: 'package'
      }],
      order: [['registered_at', 'DESC']]
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    console.error('Get package history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get package history',
      error: error.message
    });
  }
};
