// Progress API Service for Backend Connection
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Utility function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// POST /api/progress/checkin - Tạo checkin hàng ngày
export const createCheckin = async (checkinData) => {
    try {
        console.log('📊 Creating daily checkin:', checkinData);

        const response = await fetch(`${API_BASE_URL}/api/progress/checkin`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(checkinData)
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.');
            }
            throw new Error(data.message || 'Failed to create checkin');
        }

        console.log('✅ Checkin created successfully:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error creating checkin:', error);
        throw error;
    }
};

// GET /api/progress/user - Lấy tất cả progress của user
export const getUserProgress = async (planId = null, limit = 30) => {
    try {
        console.log('📊 Fetching user progress...');

        const queryParams = new URLSearchParams();
        if (planId) queryParams.append('plan_id', planId);
        if (limit) queryParams.append('limit', limit);

        const response = await fetch(`${API_BASE_URL}/api/progress/user?${queryParams}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch user progress');
        }

        console.log('✅ User progress fetched:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error fetching user progress:', error);
        throw error;
    }
};

// GET /api/progress/user/:date - Lấy progress theo ngày cụ thể
export const getProgressByDate = async (date) => {
    try {
        console.log('📊 Fetching progress by date:', date);

        const response = await fetch(`${API_BASE_URL}/api/progress/user/${date}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch progress by date');
        }

        console.log('✅ Progress by date fetched:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error fetching progress by date:', error);
        throw error;
    }
};

// PUT /api/progress/checkin/:date - Cập nhật checkin theo ngày
export const updateCheckin = async (date, updateData) => {
    try {
        console.log('📊 Updating checkin for date:', date, updateData);

        const response = await fetch(`${API_BASE_URL}/api/progress/checkin/${date}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update checkin');
        }

        console.log('✅ Checkin updated successfully:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error updating checkin:', error);
        throw error;
    }
};

// DELETE /api/progress/checkin/:date - Xóa checkin theo ngày
export const deleteCheckin = async (date, planId) => {
    try {
        console.log('📊 Deleting checkin for date:', date, 'plan:', planId);

        const response = await fetch(`${API_BASE_URL}/api/progress/checkin/${date}?plan_id=${planId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete checkin');
        }

        console.log('✅ Checkin deleted successfully:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error deleting checkin:', error);
        throw error;
    }
};

// GET /api/progress/stats - Lấy thống kê tổng quan
export const getProgressStats = async (planId = null) => {
    try {
        console.log('📊 Fetching progress stats...');

        const queryParams = new URLSearchParams();
        if (planId) queryParams.append('plan_id', planId);

        const response = await fetch(`${API_BASE_URL}/api/progress/stats?${queryParams}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch progress stats');
        }

        console.log('✅ Progress stats fetched:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error fetching progress stats:', error);
        throw error;
    }
};

// GET /api/progress/chart-data - Lấy dữ liệu cho biểu đồ
export const getChartData = async (planId = null, days = 30) => {
    try {
        console.log('📊 Fetching chart data...');

        const queryParams = new URLSearchParams();
        if (planId) queryParams.append('plan_id', planId);
        if (days) queryParams.append('days', days);

        const response = await fetch(`${API_BASE_URL}/api/progress/chart-data?${queryParams}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch chart data');
        }

        console.log('✅ Chart data fetched:', data);
        return data.data || data;
    } catch (error) {
        console.error('❌ Error fetching chart data:', error);
        throw error;
    }
};

// Hàm utility để chuyển đổi dữ liệu progress cho biểu đồ
export const convertProgressForChart = (progressData) => {
    if (!Array.isArray(progressData)) return [];
    
    return progressData.map(item => ({
        date: item.progress_date,
        actualCigarettes: item.cigarettes_smoked || 0,
        targetCigarettes: item.target_cigarettes || 0,
        mood: item.status || 'unknown', // 'good', 'average', 'bad'
        note: item.note || ''
    }));
};

// Hàm utility để tạo checkin data từ DailyCheckin component
export const createCheckinData = (planId, date, cigarettesSmoked, targetCigarettes, mood, note) => {
    return {
        plan_id: planId,
        progress_date: date,
        status: mood, // 'good', 'average', 'bad'
        note: note || '',
        cigarettes_smoked: cigarettesSmoked,
        target_cigarettes: targetCigarettes
    };
};

export default {
    createCheckin,
    getUserProgress,
    getProgressByDate,
    updateCheckin,
    deleteCheckin,
    getProgressStats,
    getChartData,
    convertProgressForChart,
    createCheckinData
};
