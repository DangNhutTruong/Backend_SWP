import Package from '../models/Package.js';
import { Op } from 'sequelize';

// Get all packages
export const getPackages = async (req, res) => {
  try {
    const {
      type,
      category,
      status = 'active',
      featured,
      popular,
      sortBy = 'SortOrder',
      sortOrder = 'ASC'
    } = req.query;

    const whereConditions = {};

    // Apply filters
    if (status) {
      whereConditions.Status = status;
    }

    if (type) {
      whereConditions.Type = type;
    }

    if (category) {
      whereConditions.Category = category;
    }

    if (featured !== undefined) {
      whereConditions.IsFeatured = featured === 'true';
    }

    if (popular !== undefined) {
      whereConditions.IsPopular = popular === 'true';
    }

    const packages = await Package.findAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách gói dịch vụ'
    });
  }
};

// Get a specific package by ID
export const getPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findOne({
      where: {
        PackageID: id,
        Status: 'active'
      }
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói dịch vụ'
      });
    }

    res.json({
      success: true,
      data: packageData
    });

  } catch (error) {
    console.error('Error getting package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin gói dịch vụ'
    });
  }
};

// Create a new package (Admin only)
export const createPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      currency,
      duration,
      durationType,
      features,
      type,
      category,
      maxUsers,
      maxCoachSessions,
      maxSupportTickets,
      accessLevel,
      trialDays,
      sortOrder,
      metaData
    } = req.body;

    // Validate required fields
    if (!name || price === undefined || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Tên gói, giá và thời hạn là bắt buộc'
      });
    }

    const packageData = await Package.create({
      Name: name,
      Description: description,
      ShortDescription: shortDescription,
      Price: price,
      OriginalPrice: originalPrice,
      Currency: currency || 'VND',
      Duration: duration,
      DurationType: durationType || 'days',
      Features: features || [],
      Type: type || 'basic',
      Category: category || 'coaching',
      MaxUsers: maxUsers,
      MaxCoachSessions: maxCoachSessions,
      MaxSupportTickets: maxSupportTickets,
      AccessLevel: accessLevel || 1,
      TrialDays: trialDays || 0,
      SortOrder: sortOrder || 0,
      MetaData: metaData || {}
    });

    res.status(201).json({
      success: true,
      data: packageData,
      message: 'Tạo gói dịch vụ thành công'
    });

  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo gói dịch vụ'
    });
  }
};

// Update a package (Admin only)
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const packageData = await Package.findByPk(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói dịch vụ'
      });
    }

    await packageData.update(updateData);

    res.json({
      success: true,
      data: packageData,
      message: 'Cập nhật gói dịch vụ thành công'
    });

  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật gói dịch vụ'
    });
  }
};

// Delete a package (Admin only)
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findByPk(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói dịch vụ'
      });
    }

    // Soft delete by setting status to archived
    await packageData.update({ Status: 'archived' });

    res.json({
      success: true,
      message: 'Xóa gói dịch vụ thành công'
    });

  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa gói dịch vụ'
    });
  }
};

// Get featured packages
export const getFeaturedPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      where: {
        IsFeatured: true,
        Status: 'active'
      },
      order: [['SortOrder', 'ASC'], ['Price', 'ASC']]
    });

    res.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Error getting featured packages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy gói dịch vụ nổi bật'
    });
  }
};

// Get popular packages
export const getPopularPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      where: {
        IsPopular: true,
        Status: 'active'
      },
      order: [['SortOrder', 'ASC'], ['Price', 'ASC']]
    });

    res.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Error getting popular packages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy gói dịch vụ phổ biến'
    });
  }
};

// Get package categories
export const getPackageCategories = async (req, res) => {
  try {
    const categories = await Package.findAll({
      attributes: ['Category'],
      where: { Status: 'active' },
      group: ['Category'],
      raw: true
    });

    const categoryList = categories.map(cat => cat.Category).filter(Boolean);

    res.json({
      success: true,
      data: categoryList
    });

  } catch (error) {
    console.error('Error getting package categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh mục gói dịch vụ'
    });
  }
};

// Compare packages
export const comparePackages = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách ID gói dịch vụ để so sánh'
      });
    }

    const packageIds = ids.split(',').map(id => parseInt(id.trim()));

    if (packageIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Cần ít nhất 2 gói dịch vụ để so sánh'
      });
    }

    const packages = await Package.findAll({
      where: {
        PackageID: {
          [Op.in]: packageIds
        },
        Status: 'active'
      },
      order: [['Price', 'ASC']]
    });

    if (packages.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đủ gói dịch vụ để so sánh'
      });
    }

    res.json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Error comparing packages:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi so sánh gói dịch vụ'
    });
  }
};
