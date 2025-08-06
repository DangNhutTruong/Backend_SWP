// Updated Progress.jsx with plan selector integration
import React, { useState, useEffect } from 'react';
import ActivePlanSelector from '../components/ActivePlanSelector';
import CheckinHistory from '../components/CheckinHistory';
import DailyCheckin from '../components/DailyCheckin';
import progressService from '../services/progressService_updated'; // Use updated service
import { getCurrentUserId } from '../utils/userUtils';

const Progress = () => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const userId = getCurrentUserId();

    // Load progress data when plan changes
    useEffect(() => {
        if (selectedPlan?.id) {
            loadProgressData(selectedPlan.id);
        } else {
            setProgressData([]);
        }
    }, [selectedPlan]);

    const loadProgressData = async (planId) => {
        if (!planId) return;

        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Loading progress data for plan:', planId);

            const result = await progressService.getUserProgress(userId, planId);
            setProgressData(result.data || []);

            console.log('✅ Progress data loaded:', result.data?.length || 0, 'records');

        } catch (error) {
            console.error('❌ Error loading progress data:', error);
            setError(error.message);
            setProgressData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCheckin = async (checkinData) => {
        if (!selectedPlan?.id) {
            alert('Vui lòng chọn kế hoạch trước khi checkin');
            return;
        }

        try {
            console.log('🎯 Creating checkin for plan:', selectedPlan.id);

            await progressService.createCheckin(
                userId,
                checkinData.date,
                checkinData,
                selectedPlan.id
            );

            // Reload data for selected plan
            await loadProgressData(selectedPlan.id);

            alert('Checkin thành công!');

        } catch (error) {
            console.error('❌ Error creating checkin:', error);
            alert('Lỗi tạo checkin: ' + error.message);
        }
    };

    const handleDeleteCheckin = async (date) => {
        if (!selectedPlan?.id) {
            alert('Vui lòng chọn kế hoạch');
            return;
        }

        if (!confirm('Bạn có chắc muốn xóa checkin này?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting checkin for plan:', selectedPlan.id, 'date:', date);

            await progressService.deleteCheckin(userId, date, selectedPlan.id);

            // Reload data for selected plan
            await loadProgressData(selectedPlan.id);

            alert('Xóa checkin thành công!');

        } catch (error) {
            console.error('❌ Error deleting checkin:', error);
            alert('Lỗi xóa checkin: ' + error.message);
        }
    };

    const handleUpdateCheckin = async (date, updateData) => {
        if (!selectedPlan?.id) {
            alert('Vui lòng chọn kế hoạch');
            return;
        }

        try {
            console.log('📝 Updating checkin for plan:', selectedPlan.id, 'date:', date);

            await progressService.updateCheckin(userId, date, updateData, selectedPlan.id);

            // Reload data for selected plan
            await loadProgressData(selectedPlan.id);

            alert('Cập nhật checkin thành công!');

        } catch (error) {
            console.error('❌ Error updating checkin:', error);
            alert('Lỗi cập nhật checkin: ' + error.message);
        }
    };

    const handlePlanChange = (plan) => {
        console.log('🔄 Plan changed:', plan);
        setSelectedPlan(plan);
        // Progress data will be loaded automatically by useEffect
    };

    return (
        <div className="progress-page">
            <div className="progress-header">
                <h1>Tiến trình cai thuốc</h1>

                {/* Plan Selector */}
                <div className="plan-selector-container">
                    <label>Chọn kế hoạch:</label>
                    <ActivePlanSelector
                        selectedPlan={selectedPlan}
                        onPlanChange={handlePlanChange}
                        isLoading={loading}
                    />
                </div>
            </div>

            {/* Show message if no plan selected */}
            {!selectedPlan && (
                <div className="no-plan-message">
                    <p>📋 Vui lòng chọn một kế hoạch để xem lịch sử checkin</p>
                </div>
            )}

            {/* Show error if any */}
            {error && (
                <div className="error-message">
                    <p>❌ Lỗi: {error}</p>
                    <button onClick={() => loadProgressData(selectedPlan?.id)}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* Progress content */}
            {selectedPlan && (
                <div className="progress-content">
                    {/* Daily Checkin */}
                    <DailyCheckin
                        selectedPlan={selectedPlan}
                        onCheckinCreate={handleCreateCheckin}
                    />

                    {/* Progress Stats */}
                    <div className="progress-stats">
                        <h2>Thống kê kế hoạch: {selectedPlan.name}</h2>
                        {loading ? (
                            <p>Đang tải...</p>
                        ) : (
                            <p>Tổng số checkin: {progressData.length}</p>
                        )}
                    </div>

                    {/* Checkin History */}
                    <CheckinHistory
                        selectedPlan={selectedPlan}
                        progressData={progressData}
                        loading={loading}
                        onCheckinDelete={handleDeleteCheckin}
                        onCheckinUpdate={handleUpdateCheckin}
                    />
                </div>
            )}
        </div>
    );
};

export default Progress;
