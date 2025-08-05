import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaCalendarAlt, FaSync } from 'react-icons/fa';
import { getUserPlans } from '../services/quitPlanService';
import { getCurrentUserId } from '../utils/userUtils';
import './ActivePlanSelector.css';

const ActivePlanSelector = ({ selectedPlan, onPlanChange, isLoading = false }) => {
    const [availablePlans, setAvailablePlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Load available plans on component mount
    useEffect(() => {
        loadAvailablePlans();
    }, []);

    // Sync with selectedPlan prop changes
    useEffect(() => {
        console.log('🔄 ActivePlanSelector - selectedPlan prop changed:', selectedPlan);
    }, [selectedPlan]);

    const loadAvailablePlans = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            console.log('🔍 ActivePlanSelector - Loading plans for user:', userId);
            const plans = await getUserPlans();

            if (Array.isArray(plans) && plans.length > 0) {
                // Filter only active and ongoing plans
                const activePlans = plans.filter(plan =>
                    plan.status === 'ongoing' ||
                    plan.is_active === true ||
                    plan.status === 'active'
                );

                setAvailablePlans(activePlans);
                console.log('✅ ActivePlanSelector - Loaded plans:', activePlans.length);
            } else {
                setAvailablePlans([]);
                console.log('📋 ActivePlanSelector - No plans found');
            }
        } catch (err) {
            console.error('❌ ActivePlanSelector - Error loading plans:', err);
            setError('Không thể tải danh sách kế hoạch');
            setAvailablePlans([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan) => {
        console.log('📋 ActivePlanSelector - Plan selected:', plan.plan_name || plan.planName);
        console.log('📋 ActivePlanSelector - Plan details:', plan);

        // Update localStorage
        localStorage.setItem('activePlan', JSON.stringify(plan));
        console.log('💾 ActivePlanSelector - Saved to localStorage:', localStorage.getItem('activePlan'));

        // Force component re-render
        setForceUpdate(prev => prev + 1);

        // Notify parent component
        if (onPlanChange) {
            onPlanChange(plan);
        }

        // Close dropdown
        setIsDropdownOpen(false);

        // Test if event listeners are working
        console.log('🔔 ActivePlanSelector - About to dispatch event...');

        // Trigger reload event for other components
        const event = new CustomEvent('localStorageChanged', {
            detail: { key: 'activePlan', planId: plan.id, planName: plan.plan_name || plan.planName }
        });
        window.dispatchEvent(event);

        console.log('🔔 ActivePlanSelector - Event dispatched:', event);
        console.log('✅ ActivePlanSelector - Plan change completed');

        // Also try manual trigger to test
        setTimeout(() => {
            console.log('🧪 Testing manual event dispatch...');
            window.dispatchEvent(new CustomEvent('localStorageChanged', {
                detail: { key: 'activePlan', test: true }
            }));
        }, 100);
    };

    const formatPlanName = (plan) => {
        return plan.plan_name || plan.planName || `Kế hoạch #${plan.id}`;
    };

    const formatPlanInfo = (plan) => {
        console.log('🔍 formatPlanInfo - plan data:', plan);

        const startDate = plan.start_date || plan.startDate;
        const totalWeeks = plan.total_weeks || plan.totalWeeks || (plan.weeks ? plan.weeks.length : 0);

        // Lấy số điếu ban đầu từ nhiều nguồn có thể
        let cigarettes = 0;
        if (plan.initial_cigarettes) {
            cigarettes = plan.initial_cigarettes;
        } else if (plan.initialCigarettes) {
            cigarettes = plan.initialCigarettes;
        } else if (plan.daily_cigarettes) {
            cigarettes = plan.daily_cigarettes;
        } else if (plan.dailyCigarettes) {
            cigarettes = plan.dailyCigarettes;
        } else if (plan.weeks && plan.weeks.length > 0) {
            // Lấy từ tuần đầu tiên
            const firstWeek = plan.weeks[0];
            cigarettes = firstWeek.amount || firstWeek.cigarettes || firstWeek.dailyCigarettes || firstWeek.daily_cigarettes || firstWeek.target || 0;
        }

        console.log('🔍 formatPlanInfo - processed data:', {
            startDate: startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa rõ',
            duration: `${totalWeeks} tuần`,
            cigarettes: cigarettes
        });

        return {
            startDate: startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa rõ',
            duration: `${totalWeeks} tuần`,
            cigarettes: cigarettes
        };
    };

    const getSelectedPlanDisplay = () => {
        if (!selectedPlan) {
            return 'Chọn kế hoạch để theo dõi';
        }

        const info = formatPlanInfo(selectedPlan);
        return (
            <div className="selected-plan-display">
                <div className="plan-name">{formatPlanName(selectedPlan)}</div>
                <div className="plan-info">
                    <span>{info.startDate}</span> • <span>{info.duration}</span> • <span>{info.cigarettes} điếu/ngày</span>
                </div>
            </div>
        );
    };

    if (loading && availablePlans.length === 0) {
        return (
            <div className="active-plan-selector loading">
                <div className="selector-header">
                    <FaCalendarAlt className="header-icon" />
                    <span>Đang tải kế hoạch...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="active-plan-selector error">
                <div className="selector-header">
                    <FaCalendarAlt className="header-icon" />
                    <span>{error}</span>
                    <button
                        className="retry-btn"
                        onClick={loadAvailablePlans}
                        disabled={loading}
                    >
                        <FaSync />
                    </button>
                </div>
            </div>
        );
    }

    if (availablePlans.length === 0) {
        return (
            <div className="active-plan-selector empty">
                <div className="selector-header">
                    <FaCalendarAlt className="header-icon" />
                    <span>Không có kế hoạch nào đang thực hiện</span>
                </div>
            </div>
        );
    }

    return (
        <div className="active-plan-selector">
            <div className="selector-label">
                <FaCalendarAlt className="label-icon" />
                <span>Kế hoạch đang theo dõi:</span>
            </div>

            <div className="plan-dropdown">
                <div
                    className={`dropdown-trigger ${isDropdownOpen ? 'open' : ''} ${isLoading ? 'disabled' : ''}`}
                    onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
                >
                    {getSelectedPlanDisplay()}
                    <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </div>

                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        <div className="dropdown-header">
                            <span>Chọn kế hoạch để theo dõi</span>
                            <button
                                className="refresh-plans-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    loadAvailablePlans();
                                }}
                                disabled={loading}
                                title="Làm mới danh sách"
                            >
                                <FaSync className={loading ? 'spinning' : ''} />
                            </button>
                        </div>

                        <div className="plans-list">
                            {availablePlans.map((plan) => {
                                const info = formatPlanInfo(plan);
                                const isSelected = selectedPlan?.id === plan.id;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`plan-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handlePlanSelect(plan)}
                                    >
                                        <div className="plan-main-info">
                                            <div className="plan-name">{formatPlanName(plan)}</div>
                                            <div className="plan-status">
                                                {plan.status === 'ongoing' ? '🟢 Đang thực hiện' : '📅 Đã lên kế hoạch'}
                                            </div>
                                        </div>
                                        <div className="plan-details">
                                            <span className="plan-start">📅 {info.startDate}</span>
                                            <span className="plan-duration">⏱️ {info.duration}</span>
                                            <span className="plan-cigarettes">🚬 {info.cigarettes} điếu/ngày</span>
                                        </div>
                                        {isSelected && (
                                            <div className="selected-indicator">✓</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Click overlay to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="dropdown-overlay"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
};

export default ActivePlanSelector;
