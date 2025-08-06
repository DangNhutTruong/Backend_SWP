// Updated progressService.js with plan_id support
import axios from '../utils/axiosConfig';
import { getCurrentUserId, getAuthToken } from '../utils/userUtils';

const API_URL = '/api/progress';

const progressService = {
    // Tạo check-in mới với plan_id
    createCheckin: async (userId, date, checkinData, planId) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            const checkinDate = date || new Date().toISOString().split('T')[0];
            console.log('📅 Creating check-in for date:', checkinDate, 'userId:', userId, 'planId:', planId);

            const targetCigs = parseInt(checkinData.targetCigarettes || 0);
            const actualCigs = parseInt(checkinData.actualCigarettes || 0);
            const initialCigs = parseInt(checkinData.initialCigarettes || checkinData.dailyCigarettes || 50);

            const cigarettesAvoided = Math.max(0, initialCigs - actualCigs);
            const costPerCigarette = checkinData.packPrice ? (checkinData.packPrice / 20) : 1250;
            const moneySaved = cigarettesAvoided * costPerCigarette;
            const healthScore = initialCigs > 0 ? Math.round((cigarettesAvoided / initialCigs) * 100) : 0;

            const dataToSend = {
                date: checkinDate,
                plan_id: planId, // BẮT BUỘC
                targetCigarettes: targetCigs,
                actualCigarettes: actualCigs,
                initialCigarettes: initialCigs,
                cigarettesAvoided: cigarettesAvoided,
                moneySaved: moneySaved,
                healthScore: healthScore,
                notes: checkinData.notes || '',
                toolType: 'quit_smoking_plan'
            };

            console.log('📤 Sending checkin data:', dataToSend);

            const response = await fetch('/api/progress/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create checkin');
            }

            console.log('✅ Checkin created successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Error creating checkin:', error);
            throw error;
        }
    },

    // Lấy tiến trình user theo plan_id
    getUserProgress: async (userId, planId, startDate = null, endDate = null, limit = null) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('📊 Fetching user progress for planId:', planId);

            const params = new URLSearchParams({
                plan_id: planId
            });

            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (limit) params.append('limit', limit);

            const response = await fetch(`/api/progress/user?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch progress');
            }

            console.log('✅ User progress fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Error fetching user progress:', error);
            throw error;
        }
    },

    // Lấy checkin theo ngày và plan_id
    getCheckinByDate: async (userId, date, planId) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('📅 Fetching checkin for date:', date, 'planId:', planId);

            const response = await fetch(`/api/progress/checkin/${date}?plan_id=${planId}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // No checkin found
                }
                throw new Error(result.message || 'Failed to fetch checkin');
            }

            console.log('✅ Checkin fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Error fetching checkin:', error);
            throw error;
        }
    },

    // Cập nhật checkin với plan_id
    updateCheckin: async (userId, date, updateData, planId) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('📝 Updating checkin for date:', date, 'planId:', planId);

            const dataToSend = {
                ...updateData,
                plan_id: planId // BẮT BUỘC
            };

            const response = await fetch(`/api/progress/checkin/${date}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update checkin');
            }

            console.log('✅ Checkin updated successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Error updating checkin:', error);
            throw error;
        }
    },

    // Xóa checkin với plan_id
    deleteCheckin: async (userId, date, planId) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('🗑️ Deleting checkin for date:', date, 'planId:', planId);

            const response = await fetch(`/api/progress/checkin/${date}?plan_id=${planId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete checkin');
            }

            console.log('✅ Checkin deleted successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Error deleting checkin:', error);
            throw error;
        }
    },

    // Lấy thống kê theo plan_id
    getProgressStats: async (userId, planId, days = 30) => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('📈 Fetching progress stats for planId:', planId);

            const response = await fetch(`/api/progress/stats?plan_id=${planId}&days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch stats');
            }

            console.log('✅ Progress stats fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Error fetching progress stats:', error);
            throw error;
        }
    },

    // Lấy dữ liệu chart theo plan_id
    getChartData: async (userId, planId, days = 30, type = 'cigarettes') => {
        try {
            if (!planId) {
                throw new Error('Plan ID is required');
            }

            console.log('📊 Fetching chart data for planId:', planId);

            const response = await fetch(`/api/progress/chart-data?plan_id=${planId}&days=${days}&type=${type}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch chart data');
            }

            console.log('✅ Chart data fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Error fetching chart data:', error);
            throw error;
        }
    }
};

export default progressService;
