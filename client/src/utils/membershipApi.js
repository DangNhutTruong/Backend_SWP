/**
 * Membership API service
 */
import api from './api';

/**
 * Get user current membership from the new API endpoint
 * @returns {Promise<Object>} API response with current membership data
 */
export const getCurrentMembership = async () => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = api.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication required'
      };
    }
    
    const options = api.addAuthHeader({
      method: 'GET'
    });
    
    const response = await api.fetch('/api/packages/user/current', options);
    
    // Update membership in storage if successful
    if (response.success && response.data) {
      // Xác định membership từ tên gói
      let membershipValue = 'free';
      
      if (response.data.package_name) {
        const packageName = response.data.package_name.toLowerCase();
        if (packageName.includes('pro')) {
          membershipValue = 'pro';
        } else if (packageName.includes('premium')) {
          membershipValue = 'premium';
        } else if (response.data.package_id !== 1) {
          membershipValue = 'premium'; // Default for non-free packages
        }
      }
      
      // Cập nhật cả trong localStorage và sessionStorage tùy theo remember me
      const isRememberMe = localStorage.getItem('nosmoke_remember') === 'true';
      
      // Cập nhật trong storage phù hợp
      if (isRememberMe) {
        const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
        currentUser.membership = membershipValue;
        currentUser.membershipType = membershipValue;
        currentUser.packageDetails = response.data;
        localStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
      } else {
        const currentUser = JSON.parse(sessionStorage.getItem('nosmoke_user') || '{}');
        currentUser.membership = membershipValue;
        currentUser.membershipType = membershipValue;
        currentUser.packageDetails = response.data;
        sessionStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
      }
      
      // Phát sự kiện để thông báo membership đã được cập nhật
      window.dispatchEvent(new CustomEvent('membership-updated', { 
        detail: { 
          membership: membershipValue,
          packageDetails: response.data
        }
      }));
      
      // Thêm thông tin membership vào response để tiện sử dụng
      response.membership = membershipValue;
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error in getCurrentMembership:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to get current membership' 
    };
  }
};

/**
 * Get user membership history
 * @returns {Promise<Object>} API response with membership history
 */
export const getMembershipHistory = async () => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = api.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication required'
      };
    }
    
    const options = api.addAuthHeader({
      method: 'GET'
    });
    
    const response = await api.fetch('/api/packages/user/history', options);
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to get membership history' 
    };
  }
};

/**
 * Purchase a membership package
 * @param {number} packageId - ID of the package to purchase
 * @param {string} paymentMethod - Payment method (e.g., 'momo', 'vnpay')
 * @returns {Promise<Object>} API response with purchase result
 */
export const purchasePackage = async (packageId, paymentMethod) => {
  try {
    const options = api.addAuthHeader({
      method: 'POST',
      body: JSON.stringify({ packageId, paymentMethod })
    });
    
    const response = await api.fetch('/api/packages/purchase', options);
    
    // If purchase successful, update local user data
    if (response.success && response.data) {
      // Get membership value from package name or package ID
      let membershipValue = 'free';
      if (response.data.packageName) {
        const packageName = response.data.packageName.toLowerCase();
        if (packageName.includes('pro')) {
          membershipValue = 'pro';
        } else if (packageName.includes('premium')) {
          membershipValue = 'premium';
        } else if (response.data.packageId !== 1) {
          membershipValue = 'premium'; // Default for non-free packages
        }
      } else if (response.data.packageId) {
        // Determine membership from package ID
        membershipValue = response.data.packageId === 1 ? 'free' : 
                         response.data.packageId === 2 ? 'premium' : 
                         response.data.packageId === 3 ? 'pro' : 'premium';
      }
      
      // Update user data in both localStorage and sessionStorage
      const isRememberMe = localStorage.getItem('nosmoke_remember') === 'true';
      
      if (isRememberMe) {
        const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
        currentUser.membership = membershipValue;
        currentUser.membershipType = membershipValue;
        currentUser.packageDetails = response.data;
        localStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
      } else {
        const currentUser = JSON.parse(sessionStorage.getItem('nosmoke_user') || '{}');
        currentUser.membership = membershipValue;
        currentUser.membershipType = membershipValue;
        currentUser.packageDetails = response.data;
        sessionStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
      }
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('membership-purchased', { 
        detail: { 
          membership: membershipValue,
          packageDetails: response.data
        }
      }));
    }
    
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to purchase package' 
    };
  }
};

/**
 * Kiểm tra quyền truy cập tính năng dựa trên membership từ backend
 * @param {string|Array} requiredMembership - Loại membership yêu cầu hoặc mảng các loại membership cho phép
 * @returns {Promise<Object>} Kết quả kiểm tra quyền truy cập
 */
export const checkFeatureAccessFromBackend = async (requiredMembership) => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = api.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        hasAccess: false
      };
    }
    
    // Đảm bảo cập nhật membership từ backend trước khi kiểm tra
    const membershipResponse = await getCurrentMembership();
    
    if (!membershipResponse.success) {
      return {
        success: false,
        message: 'Không thể lấy thông tin membership từ backend',
        hasAccess: false
      };
    }
    
    // Lấy membership của user từ dữ liệu đã được cập nhật vào localStorage
    const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
    const rawUserMembership = currentUser.membership || 'free';
    
    // Normalize membership - chuẩn hóa "PRE" thành "premium"
    const normalizeMembership = (membership) => {
      if (!membership) return 'free';
      const normalized = membership.toString().toLowerCase().trim();
      // Map các variant membership về chuẩn
      if (normalized === 'pre' || normalized === 'premium') return 'premium';
      if (normalized === 'pro' || normalized === 'professional') return 'pro';
      return normalized === 'free' ? 'free' : 'premium'; // Default fallback
    };
    
    const userMembership = normalizeMembership(rawUserMembership);
    
    // Chuyển đổi requiredMembership thành mảng nếu là string
    const requiredMemberships = Array.isArray(requiredMembership) 
      ? requiredMembership 
      : [requiredMembership];
    
    // Xác định membership level tối thiểu cần thiết
    const membershipLevels = ['free', 'premium', 'pro'];
    
    // Sắp xếp các membership yêu cầu theo thứ tự tăng dần
    const minRequiredMembership = requiredMemberships.sort((a, b) => {
      return membershipLevels.indexOf(a) - membershipLevels.indexOf(b);
    })[0];
    
    const userLevel = membershipLevels.indexOf(userMembership);
    const requiredLevel = membershipLevels.indexOf(minRequiredMembership);
    
    // Người dùng có quyền nếu họ có membership cấp cao hơn hoặc bằng yêu cầu
    const hasAccess = userLevel >= requiredLevel;
    
    return {
      success: true,
      message: hasAccess ? 'Có quyền truy cập' : 'Không có quyền truy cập',
      hasAccess,
      userMembership,
      requiredMembership: minRequiredMembership
    };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi khi kiểm tra quyền truy cập',
      hasAccess: false
    };
  }
};

export default {
  getCurrentMembership,
  getMembershipHistory,
  purchasePackage,
  checkFeatureAccessFromBackend
};

