/**
 * USER UTILITIES - QUẢN LÝ THÔNG TIN NGƯỜI DÙNG
 * 
 * File này cung cấp các utility functions để:
 * 1. Lấy thông tin user ID từ localStorage/sessionStorage
 * 2. Kiểm tra trạng thái đăng nhập
 * 3. Quản lý token authentication
 * 4. Hỗ trợ nhiều format dữ liệu user khác nhau
 * 
 * Được sử dụng bởi:
 * - CheckinHistory.jsx: Lấy userId để load/save data
 * - progressService.js: Authentication cho API calls
 * - AuthContext.jsx: Quản lý trạng thái đăng nhập
 */

/**
 * LẤY USER ID HIỆN TẠI TỪ STORAGE
 * Utility function để lấy user ID nhất quán trong toàn app
 * Hỗ trợ nhiều format dữ liệu và fallback options
 * @returns {string|null} User ID hoặc null nếu không tìm thấy
 */
export const getCurrentUserId = () => {
    // Priority order: auth system keys -> legacy keys -> user object fields -> null
    let userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    
    if (!userId) {
        // Check nosmoke_user first (main auth system)
        const userStr = localStorage.getItem('nosmoke_user') || localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userId = user.id || user.smoker_id || user.user_id;
            } catch (e) {
                console.warn('Error parsing user data from localStorage:', e);
            }
        }
    }
    
    // Try sessionStorage as backup
    if (!userId) {
        userId = sessionStorage.getItem('user_id') || sessionStorage.getItem('userId');
        
        if (!userId) {
            const userStr = sessionStorage.getItem('nosmoke_user') || sessionStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    userId = user.id || user.smoker_id || user.user_id;
                } catch (e) {
                    console.warn('Error parsing user data from sessionStorage:', e);
                }
            }
        }
    }
    
    return userId || null;
};

/**
 * KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
 * @returns {boolean} True nếu user đã đăng nhập (có userId và token)
 */
export const isUserLoggedIn = () => {
    const userId = getCurrentUserId();
    const token = getAuthToken();
    
    return !!(userId && token);
};

/**
 * LẤY THÔNG TIN USER OBJECT ĐẦY ĐỦ
 * @returns {object|null} User object hoặc null nếu không tìm thấy
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('nosmoke_user') || sessionStorage.getItem('nosmoke_user') || 
                   localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.warn('Error parsing user data:', e);
        }
    }
    
    return null;
};

/**
 * LẤY AUTH TOKEN HIỆN TẠI TỪ STORAGE
 * Tìm kiếm token trong localStorage và sessionStorage với nhiều key khác nhau
 * @returns {string|null} Auth token hoặc null nếu không tìm thấy
 */
export const getAuthToken = () => {
    return localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token') ||
           localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

/**
 * FALLBACK CHO DEVELOPMENT/TESTING - KHÔNG SỬ DỤNG TRONG PRODUCTION
 * @returns {string} Development user ID
 * @deprecated Chỉ dùng cho testing, không sử dụng trong production
 */
export const getDevelopmentUserId = () => {
    console.warn('🚨 Using development fallback user ID. This should not happen in production!');
    console.warn('🚨 Please ensure user is properly logged in.');
    return '13';
};

export default {
    getCurrentUserId,
    isUserLoggedIn,
    getCurrentUser,
    getAuthToken,
    getDevelopmentUserId
};
