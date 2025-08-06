/**
 * QUIT PLAN SERVICE - DỊCH VỤ QUẢN LÝ KẾ HOẠCH CAI THUỐC
 * 
 * Service layer cung cấp các API functions để:
 * 1. TẠO KẾ HOẠCH MỚI: Gửi data lên backend để lưu kế hoạch
 * 2. LẤY DANH SÁCH KẾ HOẠCH: Fetch tất cả kế hoạch của user
 * 3. LẤY KẾ HOẠCH ACTIVE: Lấy kế hoạch đang hoạt động
 * 4. CẬP NHẬT KẾ HOẠCH: Chỉnh sửa kế hoạch đã có
 * 5. XÓA KẾ HOẠCH: Xóa kế hoạch khỏi database
 * 6. QUẢN LÝ TRẠNG THÁI: Cập nhật status kế hoạch
 * 
 * Được sử dụng bởi:
 * - JourneyStepper.jsx: Tạo và quản lý kế hoạch
 * - QuitPlanList.jsx: Hiển thị danh sách kế hoạch
 * - Progress.jsx: Lấy kế hoạch active để tính toán tiến độ
 * - CoachDashboard: Xem kế hoạch của học viên
 */

import { logDebug } from '../utils/debugHelpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * HÀM TẠO AUTH HEADERS CHO API CALLS
 * Utility function để lấy token và tạo headers cho authentication
 * @returns {object} Headers object với Authorization token
 * @throws {Error} Nếu không tìm thấy token
 */
const getAuthHeaders = () => {
    // Tìm token từ cả localStorage và sessionStorage với đúng key
    const token = localStorage.getItem('nosmoke_token') ||
        sessionStorage.getItem('nosmoke_token') ||
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Access token is required');
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/**
 * TẠO KẾ HOẠCH CAI THUỐC MỚI
 * Gửi dữ liệu kế hoạch lên backend để lưu vào database
 * @param {object} planData - Dữ liệu kế hoạch từ JourneyStepper
 * @param {string} planData.planName - Tên kế hoạch
 * @param {string} planData.startDate - Ngày bắt đầu
 * @param {number} planData.initialCigarettes - Số điếu ban đầu
 * @param {Array} planData.weeks - Mảng timeline theo tuần
 * @returns {object} Response từ API với thông tin kế hoạch đã tạo
 */
export const createQuitPlan = async (planData) => {
    try {
        logDebug('QuitPlan', '🚀 Creating quit plan in database', planData);

        const response = await fetch(`${API_BASE_URL}/api/quit-plans`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(planData)
        });

        const data = await response.json();

        if (!response.ok) {
            // Nếu lỗi 401 (Unauthorized), có thể token hết hạn
            if (response.status === 401) {
                logDebug('QuitPlan', '⚠️ Token không hợp lệ hoặc đã hết hạn. Yêu cầu đăng nhập lại.', null, true);
                throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại để lưu kế hoạch.');
            }
            throw new Error(data.message || 'Failed to create quit plan');
        }

        logDebug('QuitPlan', '✅ Quit plan created successfully in database', data);
        return data.data || data;
    } catch (error) {
        logDebug('QuitPlan', '❌ Error creating quit plan in database', error, true);
        throw error;
    }
};

/**
 * LẤY TẤT CẢ KẾ HOẠCH CỦA USER HIỆN TẠI
 * Fetch danh sách kế hoạch từ backend để hiển thị trong QuitPlanList
 * @returns {Array} Mảng các kế hoạch của user, sorted theo thời gian tạo
 */
export const getUserPlans = async () => {
    try {
        logDebug('QuitPlan', '🚀 Fetching user quit plans from database...');

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/user`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch quit plans');
        }

        logDebug('QuitPlan', '✅ User quit plans fetched from database', data);
        // Backend trả về { success: true, message: "...", data: [...] }
        const plansData = data.data || data;

        if (plansData.length > 0) {
            logDebug('QuitPlan', `✅ Tìm thấy ${plansData.length} kế hoạch trong database`);
        } else {
            logDebug('QuitPlan', 'ℹ️ Không tìm thấy kế hoạch nào trong database', null, true); // Force print này
        }

        return plansData;
    } catch (error) {
        console.error('❌ Error fetching user plans from database:', error);
        throw error;
    }
};

/**
 * LẤY KẾ HOẠCH CỤ THỂ THEO ID
 * Fetch một kế hoạch cụ thể để xem chi tiết hoặc chỉnh sửa
 * @param {string|number} planId - ID của kế hoạch cần lấy
 * @returns {object} Thông tin chi tiết của kế hoạch
 */
export const getQuitPlan = async (planId) => {
    try {
        console.log('🚀 Fetching quit plan by ID:', planId);

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/${planId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch quit plan');
        }

        console.log('✅ Quit plan fetched:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error fetching quit plan:', error);
        throw error;
    }
};

// Get user's active quit plan
export const getUserActivePlan = async () => {
    try {
        console.log('🚀 Fetching user active quit plan from database...');

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/active`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 404) {
                // Không có kế hoạch active là một tình huống bình thường
                console.log('ℹ️ User has no active quit plan');
                return { success: false, message: 'No active plan found' };
            }
            throw new Error(data.message || 'Failed to fetch active quit plan');
        }

        console.log('✅ User active quit plan fetched:', data);

        // Process data to ensure proper structure
        const planData = data.data || data;

        // Ensure weeks data is properly parsed if it's a string
        if (planData.weeks && typeof planData.weeks === 'string') {
            try {
                planData.weeks = JSON.parse(planData.weeks);
            } catch (e) {
                console.error('Error parsing weeks data:', e);
            }
        }

        return {
            success: true,
            plan: planData,
            message: 'Active plan retrieved successfully'
        };
    } catch (error) {
        console.error('❌ Error fetching active quit plan:', error);
        return { success: false, message: error.message };
    }
};

// Update a quit plan
export const updateQuitPlan = async (planId, updateData) => {
    try {
        console.log('🚀 Updating quit plan:', planId, updateData);

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/${planId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update quit plan');
        }

        console.log('✅ Quit plan updated successfully:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error updating quit plan:', error);
        throw error;
    }
};

// Update plan status
export const updatePlanStatus = async (planId, status) => {
    try {
        logDebug('QuitPlan', `🚀 Updating plan ${planId} status to ${status}`);

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/${planId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update plan status');
        }

        logDebug('QuitPlan', `✅ Plan ${planId} status updated to ${status}`, data);
        return data.data || data;
    } catch (error) {
        logDebug('QuitPlan', `❌ Error updating plan ${planId} status:`, error, true);
        throw error;
    }
};

// Delete a quit plan
export const deletePlan = async (planId) => {
    try {
        console.log('🚀 Deleting quit plan:', planId);

        const response = await fetch(`${API_BASE_URL}/api/quit-plans/${planId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete quit plan');
        }

        console.log('✅ Quit plan deleted successfully:', data);

        // Clear progress data khi xóa plan
        try {
            console.log('🔍 Attempting to clear progress data...');
            const progressService = await import('./progressService');
            await progressService.default.forceCleanAllProgress();
            console.log('✅ Progress data cleared after deleting plan');
        } catch (progressError) {
            console.warn('⚠️ Could not clear progress data:', progressError);
        }

        return data.data || data;
    } catch (error) {
        console.error('❌ Error deleting quit plan:', error);
        throw error;
    }
};

// Get user's quit plans by user ID (for coach)
export const getUserPlansBySmokerId = async (userId) => {
    try {
        logDebug('QuitPlan', `🚀 Fetching quit plans for user ${userId} from database...`);

        // Try multiple endpoints to get user's plans
        const endpoints = [
            `${API_BASE_URL}/api/quit-plans/user/${userId}`,
            `${API_BASE_URL}/api/quit-plans?userId=${userId}`,
            `${API_BASE_URL}/api/quit-plans/by-user/${userId}`,
            `${API_BASE_URL}/api/user/${userId}/quit-plans`,
            `${API_BASE_URL}/api/quit-plans/all?user_id=${userId}`
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                logDebug('QuitPlan', `🔍 Trying endpoint: ${endpoint}`);

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    logDebug('QuitPlan', `✅ User ${userId} quit plans fetched from ${endpoint}`, data);

                    const plansData = data.data || data.plans || data;

                    if (Array.isArray(plansData) && plansData.length > 0) {
                        logDebug('QuitPlan', `✅ Tìm thấy ${plansData.length} kế hoạch cho user ${userId}`);
                        return plansData;
                    } else if (Array.isArray(plansData)) {
                        logDebug('QuitPlan', `ℹ️ Endpoint ${endpoint} trả về mảng rỗng`);
                    } else {
                        logDebug('QuitPlan', `⚠️ Endpoint ${endpoint} trả về dữ liệu không phải mảng:`, plansData);
                    }
                } else if (response.status === 404) {
                    logDebug('QuitPlan', `⚠️ Endpoint ${endpoint} not found (404)`);
                } else {
                    const errorData = await response.json();
                    logDebug('QuitPlan', `❌ Endpoint ${endpoint} failed:`, errorData);
                    lastError = errorData;
                }
            } catch (fetchError) {
                logDebug('QuitPlan', `❌ Error with endpoint ${endpoint}:`, fetchError);
                lastError = fetchError;
            }
        }

        // If no endpoint worked, log the issue and return empty array
        logDebug('QuitPlan', `⚠️ All endpoints failed for user ${userId}. Last error:`, lastError, true);
        logDebug('QuitPlan', `ℹ️ User ${userId} has no quit plans or endpoints not available`);
        return [];

    } catch (error) {
        logDebug('QuitPlan', `❌ Error fetching quit plans for user ${userId}:`, error, true);
        return [];
    }
};

export default {
    createQuitPlan,
    getUserPlans,
    getQuitPlan,
    getUserActivePlan,
    getUserPlansBySmokerId,
    updateQuitPlan,
    updatePlanStatus,
    deletePlan
};
