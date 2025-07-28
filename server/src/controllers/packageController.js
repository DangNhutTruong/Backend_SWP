import Package from '../models/Package.js';
import { pool } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Lấy tất cả các gói dịch vụ
 * @route GET /api/packages
 */
export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.getAllPackages();
    
    if (!packages || !Array.isArray(packages)) {
      console.error('No valid packages returned from database');
      return sendError(res, 'Failed to retrieve packages - database returned invalid data', 500);
    }
    
    // Format response để phù hợp với frontend
    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price,
      period: pkg.period || 'tháng',
      membershipType: pkg.id === 1 ? 'free' : pkg.id === 2 ? 'premium' : pkg.id === 3 ? 'pro' : `package-${pkg.id}`,
      features: pkg.features || [],
      disabledFeatures: pkg.disabledFeatures || [],
      popular: pkg.popular === 1 || pkg.popular === true
    }));
    
    sendSuccess(res, 'Packages retrieved successfully', formattedPackages);
  } catch (error) {
    console.error('❌ Error getting packages:', error);
    sendError(res, 'Failed to retrieve packages: ' + error.message, 500);
  }
};

/**
 * Lấy chi tiết một gói dịch vụ theo ID
 * @route GET /api/packages/:id
 */
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return sendError(res, 'Invalid package ID', 400);
    }
    
    const package_data = await Package.getPackageById(id);
    
    if (!package_data) {
      return sendError(res, 'Package not found', 404);
    }
    
    // Format response để phù hợp với frontend
    const formattedPackage = {
      id: package_data.id,
      name: package_data.name || '',
      description: package_data.description || '',
      price: package_data.price,
      period: package_data.period || 'tháng',
      membershipType: package_data.id === 1 ? 'free' : package_data.id === 2 ? 'premium' : package_data.id === 3 ? 'pro' : `package-${package_data.id}`,
      features: package_data.features || [],
      disabledFeatures: package_data.disabledFeatures || [],
      popular: package_data.popular === 1 || package_data.popular === true
    };
    
    sendSuccess(res, 'Package retrieved successfully', formattedPackage);
  } catch (error) {
    console.error(`❌ Error getting package:`, error);
    sendError(res, 'Failed to retrieve package: ' + error.message, 500);
  }
};

/**
 * Lấy tính năng cho một gói cụ thể
 * @route GET /api/packages/features
 * @route GET /api/packages/:id/features
 */
export const getPackageFeatures = async (req, res) => {
  try {
    // Ưu tiên lấy packageId từ params (nếu route là /api/packages/:id/features)
    // Nếu không có, lấy từ query (package_id hoặc packageId)
    let packageId = req.params.id;
    if (!packageId) {
      packageId = req.query.package_id || req.query.packageId;
    }
    
    if (!packageId || isNaN(parseInt(packageId))) {
      return sendError(res, 'Invalid package ID', 400);
    }
    
    const package_data = await Package.getPackageById(packageId);
    
    if (!package_data) {
      return sendError(res, 'Package not found', 404);
    }
    
    // Tạo response phù hợp với cấu trúc mà frontend đang mong đợi
    const features = [];
    
    // Thêm các tính năng được bật
    if (Array.isArray(package_data.features)) {
      package_data.features.forEach(feature => {
        features.push({
          feature_name: feature,
          enabled: 1
        });
      });
    }
    
    // Thêm các tính năng bị tắt
    if (Array.isArray(package_data.disabledFeatures)) {
      package_data.disabledFeatures.forEach(feature => {
        features.push({
          feature_name: feature,
          enabled: 0
        });
      });
    }
    
    sendSuccess(res, 'Package features retrieved successfully', features);
  } catch (error) {
    console.error(`❌ Error getting package features:`, error);
    sendError(res, 'Failed to retrieve package features: ' + error.message, 500);
  }
};

/**
 * Mua gói dịch vụ
 * @route POST /api/packages/purchase
 */
export const purchasePackage = async (req, res) => {
  try {
    const { packageId, paymentMethod = 'free' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized - User ID required', 401);
    }

    if (!packageId) {
      return sendError(res, 'Package ID is required', 400);
    }

    console.log(`💰 User ${userId} purchasing package ${packageId} with payment method: ${paymentMethod}`);
    
    // Kiểm tra package tồn tại
    const packageData = await Package.getPackageById(packageId);
    if (!packageData) {
      return sendError(res, 'Package not found', 404);
    }

    // Xác định membership type từ package
    let membershipType = 'free';
    if (packageData.membership_type) {
      membershipType = packageData.membership_type;
    } else {
      // Fallback based on package ID
      membershipType = packageId === 1 ? 'free' : packageId === 2 ? 'premium' : packageId === 3 ? 'pro' : 'premium';
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Vô hiệu hóa membership hiện tại
      const [expireResult] = await connection.execute(`
        UPDATE user_memberships 
        SET status = 'expired', end_date = NOW() 
        WHERE user_id = ? AND status = 'active'
      `, [userId]);

      // Thêm membership mới
      const [membershipResult] = await connection.execute(`
        INSERT INTO user_memberships (user_id, package_id, start_date, status) 
        VALUES (?, ?, NOW(), 'active')
      `, [userId, packageId]);

      // Cập nhật membership trong bảng users
      await connection.execute(`
        UPDATE users 
        SET membership = ? 
        WHERE id = ?
      `, [membershipType, userId]);

      await connection.commit();
      
      console.log(`✅ Package ${packageId} purchased successfully for user ${userId}`);
      
      sendSuccess(res, 'Package purchased successfully', {
        packageId: parseInt(packageId),
        packageName: packageData.name,
        price: packageData.price,
        membershipType: membershipType,
        purchaseDate: new Date().toISOString(),
        membershipId: membershipResult.insertId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error purchasing package:', error);
    sendError(res, 'Failed to purchase package: ' + error.message, 500);
  }
};

/**
 * Lấy gói hiện tại của user
 * @route GET /api/packages/user/current
 */
export const getCurrentUserPackage = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized - User ID required', 401);
    }
    
    try {
      // Lấy membership hiện tại từ user_memberships
      const [rows] = await pool.execute(`
        SELECT um.*, p.name as package_name, p.description, p.price, p.membership_type
        FROM user_memberships um
        JOIN packages p ON um.package_id = p.id
        WHERE um.user_id = ? AND um.status = 'active'
        ORDER BY um.start_date DESC
        LIMIT 1
      `, [userId]);
      
      if (rows.length > 0) {
        const userMembership = rows[0];
        
        sendSuccess(res, 'Current package retrieved successfully', {
          package_id: userMembership.package_id,
          package_name: userMembership.package_name,
          description: userMembership.description,
          price: userMembership.price,
          membership_type: userMembership.membership_type,
          start_date: userMembership.start_date,
          end_date: userMembership.end_date,
          status: userMembership.status,
          created_at: userMembership.created_at
        });
      } else {
        // Không có membership nào, trả về gói free mặc định
        const freePackage = await Package.getPackageById(1);
        
        sendSuccess(res, 'Current package retrieved successfully', {
          package_id: 1,
          package_name: freePackage.name,
          description: freePackage.description,
          price: freePackage.price,
          membership_type: 'free',
          start_date: new Date().toISOString(),
          end_date: null,
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    } catch (dbError) {
      // Fallback: trả về gói free
      const freePackage = await Package.getPackageById(1);
      
      sendSuccess(res, 'Current package retrieved successfully', {
        userId,
        currentPackage: freePackage,
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true
      });
    }
  } catch (error) {
    console.error('❌ Error getting current user package:', error);
    sendError(res, 'Failed to get current package: ' + error.message, 500);
  }
};

/**
 * Lấy lịch sử mua gói của user
 * @route GET /api/packages/user/history
 */
export const getUserPackageHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized - User ID required', 401);
    }
    
    // TODO: Implement database lookup for user's package history
    // For now, return empty history
    sendSuccess(res, 'Package history retrieved successfully', {
      userId,
      history: [],
      totalPurchases: 0
    });
  } catch (error) {
    console.error('❌ Error getting user package history:', error);
    sendError(res, 'Failed to get package history: ' + error.message, 500);
  }
};

export default {
  getAllPackages,
  getPackageById,
  getPackageFeatures,
  purchasePackage,
  getCurrentUserPackage,
  getUserPackageHistory
};
