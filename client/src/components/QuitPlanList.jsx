/**
 * QUIT PLAN LIST - COMPONENT HIỂN THỊ DANH SÁCH KẾ HOẠCH CAI THUỐC
 * 
 * Component này có chức năng:
 * 1. HIỂN THỊ DANH SÁCH: Load và hiển thị tất cả kế hoạch của user
 * 2. QUẢN LÝ TRẠNG THÁI: Cập nhật status kế hoạch (ongoing, completed, failed)
 * 3. XÓA KẾ HOẠCH: Cho phép user xóa kế hoạch không cần thiết
 * 4. ĐIỀU HƯỚNG: Navigate đến chi tiết kế hoạch hoặc tạo kế hoạch mới
 * 5. TÍNH TOÁN TIẾN ĐỘ: Hiển thị phần trăm hoàn thành của từng kế hoạch
 * 
 * Data Flow:
 * - Load plans từ quitPlanService.getUserPlans()
 * - Listen events từ JourneyStepper khi có plan mới/xóa
 * - Update UI real-time khi có thay đổi
 * 
 * Được sử dụng tại:
 * - /journey/plans: Route chính xem danh sách kế hoạch
 * - JourneyRouter: Tự động hiển thị khi user có kế hoạch
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserPlans, updatePlanStatus, deletePlan } from '../services/quitPlanService';
import { logDebug } from '../utils/debugHelpers';
import './QuitPlanList.css';

const QuitPlanList = () => {
    // ===== STATES QUẢN LÝ DANH SÁCH KẾ HOẠCH =====
    const [plans, setPlans] = useState([]);                    // Danh sách kế hoạch từ database
    const [loading, setLoading] = useState(true);              // Trạng thái loading khi fetch data
    const [error, setError] = useState(null);                  // Error message nếu có lỗi
    const [updatingPlanId, setUpdatingPlanId] = useState(null); // ID kế hoạch đang được update
    const navigate = useNavigate();

    /**
     * EFFECT: LOAD DANH SÁCH KẾ HOẠCH VÀ LISTEN EVENTS
     * Fetch plans khi component mount và setup event listeners
     */
    useEffect(() => {
        fetchPlans();

        // ===== EVENT LISTENERS CHO REAL-TIME UPDATES =====
        // Lắng nghe sự kiện khi có kế hoạch mới được tạo từ JourneyStepper
        const handlePlanCreated = () => {
            console.log('🔄 QuitPlanList - Nhận event kế hoạch mới được tạo, refresh danh sách...');
            fetchPlans();
        };

        // Lắng nghe sự kiện khi kế hoạch bị xóa từ JourneyStepper  
        const handlePlanDeleted = () => {
            console.log('🗑️ QuitPlanList - Nhận event kế hoạch bị xóa, refresh danh sách...');
            fetchPlans();
        };

        window.addEventListener('planCreated', handlePlanCreated);
        window.addEventListener('planDeleted', handlePlanDeleted);

        return () => {
            window.removeEventListener('planCreated', handlePlanCreated);
            window.removeEventListener('planDeleted', handlePlanDeleted);
        };
    }, []);

    // Hàm lấy danh sách kế hoạch từ API
    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError(null);

            logDebug('QuitPlanList', '📋 Fetching user plans...');
            const response = await getUserPlans();

            console.log('🔍 QuitPlanList - Raw API response:', response);

            if (response && Array.isArray(response)) {
                setPlans(response);
                console.log(`✅ QuitPlanList - Loaded ${response.length} plans:`, response);
                logDebug('QuitPlanList', `✅ Loaded ${response.length} plans`, response);
            } else {
                setPlans([]);
                console.log('📋 QuitPlanList - No plans found or invalid response');
                logDebug('QuitPlanList', '📋 No plans found');
            }

            setLoading(false);
        } catch (err) {
            console.error('❌ QuitPlanList - Error fetching plans:', err);
            setError('Không thể tải danh sách kế hoạch. Vui lòng thử lại sau.');
            setLoading(false);
            logDebug('QuitPlanList', '❌ Error fetching plans', err, true);
        }
    };

    // Hàm điều hướng đến trang tạo kế hoạch mới
    const handleCreateNewPlan = () => {
        navigate('/journey/create');
    };

    // Hàm điều hướng đến trang chi tiết kế hoạch
    const handleViewPlanDetails = (planId) => {
        navigate(`/journey/plan/${planId}`);
    };

    // Hàm cập nhật trạng thái kế hoạch
    const handleUpdateStatus = async (planId, newStatus, event) => {
        // Ngăn chặn sự kiện click lan ra ngoài
        event.stopPropagation();

        try {
            setUpdatingPlanId(planId);

            logDebug('QuitPlanList', `🔄 Updating plan ${planId} status to ${newStatus}`);
            await updatePlanStatus(planId, newStatus);

            // Cập nhật danh sách kế hoạch sau khi thay đổi trạng thái
            await fetchPlans();

            logDebug('QuitPlanList', `✅ Plan ${planId} status updated to ${newStatus}`);
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái kế hoạch:', err);
            alert('Không thể cập nhật trạng thái kế hoạch. Vui lòng thử lại sau.');
            logDebug('QuitPlanList', '❌ Error updating plan status', err, true);
        } finally {
            setUpdatingPlanId(null);
        }
    };

    // Hàm xóa kế hoạch
    const handleDeletePlan = async (planId, event) => {
        event.stopPropagation();

        if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch này không?')) {
            return;
        }

        try {
            setUpdatingPlanId(planId);

            logDebug('QuitPlanList', `🗑️ Deleting plan ${planId}`);
            await deletePlan(planId);

            // Cập nhật danh sách kế hoạch sau khi xóa
            await fetchPlans();

            logDebug('QuitPlanList', `✅ Plan ${planId} deleted successfully`);
        } catch (err) {
            console.error('Lỗi khi xóa kế hoạch:', err);
            alert('Không thể xóa kế hoạch. Vui lòng thử lại sau.');
            logDebug('QuitPlanList', '❌ Error deleting plan', err, true);
        } finally {
            setUpdatingPlanId(null);
        }
    };

    // Hàm định dạng ngày
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Hàm lấy tên trạng thái tiếng Việt
    const getStatusLabel = (status) => {
        switch (status) {
            case 'ongoing':
                return 'Đang thực hiện';
            case 'completed':
                return 'Hoàn thành';
            case 'failed':
                return 'Đã bỏ';
            default:
                return 'Đang thực hiện';
        }
    };

    // Hàm lấy class CSS cho trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'ongoing':
                return 'status-ongoing';
            case 'completed':
                return 'status-completed';
            case 'failed':
                return 'status-abandoned';
            case 'abandoned':
                return 'status-abandoned';
            default:
                return 'status-ongoing';
        }
    };

    // Hàm tính phần trăm tiến độ
    const calculateProgress = (plan) => {
        const startDate = new Date(plan.startDate || plan.start_date);
        const endDate = new Date(plan.endDate || plan.end_date);
        const today = new Date();

        if (today < startDate) return 0;
        if (today > endDate) return 100;

        const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
        const daysElapsed = (today - startDate) / (1000 * 60 * 60 * 24);

        return Math.round((daysElapsed / totalDays) * 100);
    };

    return (
        <div className="quit-plan-list-container">
            <div className="plan-list-header">
                <h1>Kế Hoạch Cai Thuốc</h1>
                <button className="btn-create-plan" onClick={handleCreateNewPlan}>
                    + Tạo kế hoạch mới
                </button>
            </div>

            {/* Debug info */}
            {console.log('🐛 QuitPlanList render - loading:', loading, 'error:', error, 'plans.length:', plans.length, 'plans:', plans)}

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Đang tải danh sách kế hoạch...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <div className="error-message">
                        <h3>⚠️ Có lỗi xảy ra</h3>
                        <p>{error}</p>
                        <button className="btn-retry" onClick={fetchPlans}>
                            🔄 Thử lại
                        </button>
                    </div>
                </div>
            ) : plans.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h2>Bạn chưa có kế hoạch cai thuốc nào</h2>
                    <p>Hãy tạo kế hoạch đầu tiên để bắt đầu hành trình cai thuốc lá của bạn!</p>
                    <button className="btn-create-first-plan" onClick={handleCreateNewPlan}>
                        🎯 Tạo kế hoạch ngay
                    </button>
                </div>
            ) : (
                <div className="plan-cards-grid">
                    {plans.map(plan => {
                        const progress = calculateProgress(plan);
                        const isUpdating = updatingPlanId === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`plan-card ${isUpdating ? 'updating' : ''}`}
                                onClick={() => !isUpdating && handleViewPlanDetails(plan.id)}
                            >
                                <div className="plan-card-header">
                                    <h3 className="plan-name">
                                        {plan.planName || plan.plan_name || `Kế hoạch #${plan.id}`}
                                    </h3>
                                    <div className={`plan-status ${getStatusClass(plan.status)}`}>
                                        {getStatusLabel(plan.status)}
                                    </div>
                                </div>

                                <div className="plan-details">
                                    <div className="plan-dates">
                                        <div className="date-item">
                                            <span className="date-label">📅 Bắt đầu:</span>
                                            <span className="date-value">{formatDate(plan.startDate || plan.start_date)}</span>
                                        </div>
                                        <div className="date-item">
                                            <span className="date-label">🏁 Kết thúc:</span>
                                            <span className="date-value">{formatDate(plan.endDate || plan.end_date)}</span>
                                        </div>
                                    </div>

                                    <div className="plan-info">
                                        <div className="info-item">
                                            <span className="info-label">🚬 Số điếu ban đầu:</span>
                                            <span className="info-value">
                                                {plan.initialCigarettes || plan.initial_cigarettes || 0} điếu/ngày
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">⚡ Chiến lược:</span>
                                            <span className="info-value">
                                                {plan.strategy === 'quick' ? 'Nhanh chóng' : 'Từ từ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="plan-progress">
                                    <div className="progress-header">
                                        <span className="progress-label">📈 Tiến độ</span>
                                        <span className="progress-percentage">{progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="plan-actions">
                                    <button
                                        className="btn-view-details"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewPlanDetails(plan.id);
                                        }}
                                    >
                                        👁️ Xem chi tiết
                                    </button>

                                    <div className="status-actions">
                                        <select
                                            className="status-select"
                                            value={plan.status}
                                            onChange={(e) => handleUpdateStatus(plan.id, e.target.value, e)}
                                            disabled={isUpdating}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="ongoing">Đang thực hiện</option>
                                            <option value="completed">Hoàn thành</option>
                                            <option value="failed">Đã bỏ</option>
                                        </select>

                                        <button
                                            className="btn-delete"
                                            onClick={(e) => handleDeletePlan(plan.id, e)}
                                            disabled={isUpdating}
                                            title="Xóa kế hoạch"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {isUpdating && (
                                    <div className="updating-overlay">
                                        <div className="updating-spinner"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuitPlanList;
