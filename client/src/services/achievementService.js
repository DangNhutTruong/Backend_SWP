import API_CONFIG from '../config/apiConfig';
import { handleApiResponse } from '../utils/apiUtils';

/**
 * Service quản lý API liên quan đến huy hiệu
 */
const achievementService = {
  /**
   * Lấy tất cả huy hiệu
   */
  getAllAchievements: async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/achievements`, {
        method: 'GET',
        headers: API_CONFIG.headers
      });
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ',
        data: null
      };
    }
  },

  /**
   * Lấy huy hiệu của người dùng đang đăng nhập
   */
  getMyAchievements: async () => {
    try {
      // Kiểm tra token trong cả localStorage và sessionStorage
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      
      console.log('🔍 Token check in service:');
      console.log('- localStorage nosmoke_token:', localStorage.getItem('nosmoke_token') ? 'có' : 'không');
      console.log('- sessionStorage nosmoke_token:', sessionStorage.getItem('nosmoke_token') ? 'có' : 'không');
      console.log('- final token:', token ? 'có token' : 'không có token');
      
      if (!token) {
        return {
          success: false,
          message: 'Chưa đăng nhập',
          data: null
        };
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/my-achievements`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`
        }
      });
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ',
        data: null
      };
    }
  },

  /**
   * Lấy huy hiệu của một người dùng theo ID
   */
  getUserAchievements: async (userId) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/user/${userId}/achievements`, {
        method: 'GET',
        headers: API_CONFIG.headers
      });
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ',
        data: null
      };
    }
  },

  /**
   * Award huy hiệu cho người dùng đang đăng nhập
   */
  awardAchievement: async (achievementId) => {
    try {
      const token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token');
      
      if (!token) {
        return {
          success: false,
          message: 'Chưa đăng nhập',
          data: null
        };
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/award-achievement`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ achievementId })
      });
      
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ',
        data: null
      };
    }
  }
};

export default achievementService;
