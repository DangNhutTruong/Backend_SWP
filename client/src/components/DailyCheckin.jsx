import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCalendarCheck, FaSave } from 'react-icons/fa';
import progressService from '../services/progressService';
import { getCurrentUserId } from '../utils/userUtils';
import { useAuth } from '../context/AuthContext';

const DailyCheckin = ({ onProgressUpdate, selectedPlan }) => {
    const { user } = useAuth(); // Lấy thông tin user từ AuthContext

    const [todayData, setTodayData] = useState({
        date: new Date().toISOString().split('T')[0],
        targetCigarettes: 0, // Sẽ được tính từ kế hoạch thực tế của user
        actualCigarettes: 0,
        initialCigarettes: 0, // Sẽ được lấy từ plan của user, mặc định là 0
        notes: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(1); // Tuần hiện tại
    const [streakDays, setStreakDays] = useState(0); // Số ngày liên tiếp đạt mục tiêu
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // Thông báo dạng toast
    const [currentPlan, setCurrentPlan] = useState(null); // Lưu kế hoạch hiện tại
    const [forceRender, setForceRender] = useState(0); // Force re-render

    // Debug: Log mỗi khi todayData thay đổi
    useEffect(() => {
        console.log('🎯 DailyCheckin - todayData updated:', {
            targetCigarettes: todayData.targetCigarettes,
            actualCigarettes: todayData.actualCigarettes,
            currentPlan: currentPlan?.plan_name
        });
    }, [todayData.targetCigarettes, todayData.actualCigarettes, currentPlan?.plan_name]);

    // CRITICAL DEBUG: Track every targetCigarettes change
    useEffect(() => {
        console.log('🚨 CRITICAL DEBUG - targetCigarettes changed to:', todayData.targetCigarettes);
        console.trace('🚨 Call stack for targetCigarettes change');
    }, [todayData.targetCigarettes]);

    // Load kế hoạch từ localStorage hoặc database
    const loadUserPlan = async () => {
        console.log('🔍 DailyCheckin loadUserPlan - Starting...');

        try {
            // Ưu tiên lấy từ localStorage (kế hoạch được chọn từ ActivePlanSelector)
            const localPlan = localStorage.getItem('activePlan');
            console.log('🔍 DailyCheckin loadUserPlan - localPlan:', localPlan);

            if (localPlan) {
                const parsedPlan = JSON.parse(localPlan);
                setCurrentPlan(parsedPlan);

                // Lấy số điếu ban đầu từ plan
                let initialCigs = 0;
                console.log('🔍 DailyCheckin - LocalStorage plan structure:', parsedPlan);

                // Ưu tiên lấy từ initialCigarettes trực tiếp
                if (parsedPlan.initialCigarettes) {
                    initialCigs = parsedPlan.initialCigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.initialCigarettes:', initialCigs);
                } else if (parsedPlan.initial_cigarettes) {
                    initialCigs = parsedPlan.initial_cigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.initial_cigarettes:', initialCigs);
                } else if (parsedPlan.dailyCigarettes) {
                    initialCigs = parsedPlan.dailyCigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.dailyCigarettes:', initialCigs);
                } else if (parsedPlan.daily_cigarettes) {
                    initialCigs = parsedPlan.daily_cigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.daily_cigarettes:', initialCigs);
                } else if (parsedPlan.weeks && parsedPlan.weeks.length > 0) {
                    // Lấy từ tuần đầu tiên
                    const firstWeek = parsedPlan.weeks[0];
                    initialCigs = firstWeek.amount || firstWeek.cigarettes ||
                        firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                        firstWeek.target || 0;
                    console.log('🔍 DailyCheckin - Got from first week:', initialCigs);
                }

                // Update todayData với initialCigarettes
                setTodayData(prev => ({
                    ...prev,
                    initialCigarettes: initialCigs
                }));

                console.log('🔍 DailyCheckin - Set initialCigarettes from localStorage:', initialCigs);

                return parsedPlan;
            }

            // Fallback: Load từ API nếu không có trong localStorage
            const auth_token = localStorage.getItem('nosmoke_token') || sessionStorage.getItem('nosmoke_token') ||
                localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            console.log('🔍 DailyCheckin loadUserPlan - auth_token:', auth_token ? 'Found' : 'Not found');

            if (auth_token) {
                const quitPlanService = await import('../services/quitPlanService');
                const response = await quitPlanService.getUserActivePlan();
                console.log('🔍 DailyCheckin loadUserPlan - getUserActivePlan response:', response);

                if (response && response.success && response.plan) {
                    let plan = response.plan;
                    console.log('🔍 DailyCheckin loadUserPlan - plan from API:', plan);

                    // Parse plan_details nếu nó là string
                    if (plan.plan_details && typeof plan.plan_details === 'string') {
                        try {
                            const parsedDetails = JSON.parse(plan.plan_details);
                            plan = { ...plan, ...parsedDetails };
                            console.log('🔍 DailyCheckin loadUserPlan - plan after parsing:', plan);
                        } catch (e) {
                            console.error('Error parsing plan_details:', e);
                        }
                    }

                    setCurrentPlan(plan);

                    // Lấy số điếu ban đầu từ plan
                    let initialCigs = 0;
                    console.log('🔍 DailyCheckin - Plan structure:', plan);

                    // Ưu tiên lấy từ initialCigarettes trực tiếp
                    if (plan.initialCigarettes) {
                        initialCigs = plan.initialCigarettes;
                        console.log('🔍 DailyCheckin - Got from plan.initialCigarettes:', initialCigs);
                    } else if (plan.initial_cigarettes) {
                        initialCigs = plan.initial_cigarettes;
                        console.log('🔍 DailyCheckin - Got from plan.initial_cigarettes:', initialCigs);
                    } else if (plan.dailyCigarettes) {
                        initialCigs = plan.dailyCigarettes;
                        console.log('🔍 DailyCheckin - Got from plan.dailyCigarettes:', initialCigs);
                    } else if (plan.daily_cigarettes) {
                        initialCigs = plan.daily_cigarettes;
                        console.log('🔍 DailyCheckin - Got from plan.daily_cigarettes:', initialCigs);
                    } else if (plan.weeks && plan.weeks.length > 0) {
                        // Lấy từ tuần đầu tiên
                        const firstWeek = plan.weeks[0];
                        initialCigs = firstWeek.amount || firstWeek.cigarettes ||
                            firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                            firstWeek.target || 0;
                        console.log('🔍 DailyCheckin - Got from first week:', initialCigs);
                    }

                    // Update todayData với initialCigarettes
                    setTodayData(prev => ({
                        ...prev,
                        initialCigarettes: initialCigs
                    }));

                    console.log('🔍 DailyCheckin - Set initialCigarettes:', initialCigs);

                    return plan;
                }
            }
            if (localPlan) {
                const parsedPlan = JSON.parse(localPlan);
                setCurrentPlan(parsedPlan);

                // Lấy số điếu ban đầu từ plan
                let initialCigs = 0; // Default fallback - sẽ được lấy từ plan thực tế
                console.log('🔍 DailyCheckin - LocalStorage plan structure:', parsedPlan);

                // Ưu tiên lấy từ initialCigarettes trực tiếp
                if (parsedPlan.initialCigarettes) {
                    initialCigs = parsedPlan.initialCigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.initialCigarettes:', initialCigs);
                } else if (parsedPlan.initial_cigarettes) {
                    initialCigs = parsedPlan.initial_cigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.initial_cigarettes:', initialCigs);
                } else if (parsedPlan.dailyCigarettes) {
                    initialCigs = parsedPlan.dailyCigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.dailyCigarettes:', initialCigs);
                } else if (parsedPlan.daily_cigarettes) {
                    initialCigs = parsedPlan.daily_cigarettes;
                    console.log('🔍 DailyCheckin - Got from parsedPlan.daily_cigarettes:', initialCigs);
                } else if (parsedPlan.weeks && parsedPlan.weeks.length > 0) {
                    // Lấy từ tuần đầu tiên
                    const firstWeek = parsedPlan.weeks[0];
                    initialCigs = firstWeek.amount || firstWeek.cigarettes ||
                        firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                        firstWeek.target || 0;
                    console.log('🔍 DailyCheckin - Got from first week:', initialCigs);
                }

                // Update todayData với initialCigarettes
                setTodayData(prev => ({
                    ...prev,
                    initialCigarettes: initialCigs
                }));

                console.log('🔍 DailyCheckin - Set initialCigarettes from localStorage:', initialCigs);

                return parsedPlan;
            }

            console.log('🔍 DailyCheckin loadUserPlan - No plan found');
            return null;
        } catch (error) {
            console.error('❌ Error loading plan:', error);
            return null;
        }
    };

    // Tính target cigarettes dựa trên kế hoạch và ngày hiện tại
    const calculateTodayTarget = (plan = currentPlan) => {
        console.log('🎯 calculateTodayTarget - Input plan:', plan?.plan_name || plan?.planName, 'ID:', plan?.id);

        // Nếu không có kế hoạch, trả về 0 để báo hiệu cần lập kế hoạch
        if (!plan || !plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
            console.log("⚠️ Không có kế hoạch hợp lệ, target = 0");
            return 0;
        }

        console.log('🎯 calculateTodayTarget - Plan weeks:', plan.weeks.length, 'weeks');
        console.log('🎯 calculateTodayTarget - First week data:', plan.weeks[0]);

        const planStartDate = plan.startDate || plan.start_date;
        console.log('🎯 calculateTodayTarget - Plan start date:', planStartDate);

        if (!planStartDate) {
            const firstWeek = plan.weeks[0];
            if (firstWeek) {
                const target = firstWeek.amount ?? firstWeek.target ??
                    firstWeek.cigarettes ?? firstWeek.dailyCigarettes ??
                    firstWeek.targetCigarettes ?? 0;
                console.log('🎯 calculateTodayTarget - No start date, using first week target:', target);
                return target;
            }
            console.log('🎯 calculateTodayTarget - No start date, no first week data, target = 0');
            return 0; // Không có dữ liệu tuần đầu
        }

        try {
            const today = new Date();
            const startDate = new Date(planStartDate);

            if (isNaN(startDate.getTime())) {
                console.log("⚠️ Ngày bắt đầu không hợp lệ, sử dụng tuần đầu tiên");
                const target = plan.weeks[0]?.amount || 0;
                console.log('🎯 calculateTodayTarget - Invalid start date, using first week target:', target);
                return target;
            }

            const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            const currentWeekNumber = Math.floor(daysDiff / 7) + 1;

            console.log('🎯 calculateTodayTarget - Days diff:', daysDiff, 'Current week:', currentWeekNumber);

            setCurrentWeek(currentWeekNumber);

            let currentWeekPlan;

            if (currentWeekNumber <= plan.weeks.length && currentWeekNumber > 0) {
                const weekByIndex = plan.weeks[currentWeekNumber - 1];
                const weekByProperty = plan.weeks.find(w => w.week === currentWeekNumber);
                currentWeekPlan = weekByProperty || weekByIndex;
                console.log('🎯 calculateTodayTarget - Current week plan:', currentWeekPlan);
            }

            if (currentWeekPlan) {
                const getTargetAmount = (weekPlan) => {
                    if (!weekPlan) return null;
                    return weekPlan.amount ?? weekPlan.target ??
                        weekPlan.cigarettes ?? weekPlan.dailyCigarettes ??
                        weekPlan.targetCigarettes ?? weekPlan.dailyTarget ??
                        weekPlan.daily_cigarettes ?? weekPlan.day_cigarettes ?? null;
                };

                const currentAmount = getTargetAmount(currentWeekPlan);
                console.log('🎯 calculateTodayTarget - Current week target amount:', currentAmount);

                if (currentWeekNumber > 1) {
                    const prevWeekByIndex = plan.weeks[currentWeekNumber - 2];
                    const prevWeekByProperty = plan.weeks.find(w => w.week === currentWeekNumber - 1);
                    const prevWeekPlan = prevWeekByProperty || prevWeekByIndex;
                    const prevAmount = getTargetAmount(prevWeekPlan);

                    if (prevAmount && currentAmount && prevAmount > currentAmount) {
                        const reduction = prevAmount - currentAmount;
                        const percentReduction = Math.round((reduction / prevAmount) * 100);

                        setTodayData(prev => ({
                            ...prev,
                            weeklyProgress: {
                                reduction,
                                percentReduction,
                                prevAmount: prevAmount
                            }
                        }));
                    }
                }

                const finalTarget = currentAmount || 0;
                console.log('🎯 calculateTodayTarget - Final target:', finalTarget);
                return finalTarget;
            }

            if (currentWeekNumber > plan.weeks.length) {
                return 0;
            }

            const firstWeek = plan.weeks[0];
            if (firstWeek) {
                return firstWeek.amount ?? firstWeek.target ??
                    firstWeek.cigarettes ?? firstWeek.dailyCigarettes ??
                    firstWeek.targetCigarettes ?? 0; // Fallback là 0
            }

            return 0; // Không có dữ liệu
        } catch (error) {
            console.error("Lỗi khi tính target:", error);
            return 0; // Lỗi thì trả về 0
        }
    };

    // Tính streak days
    const calculateStreakDays = () => {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const savedData = localStorage.getItem(`checkin_${dateStr}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.actualCigarettes <= data.targetCigarettes) {
                    streak++;
                } else {
                    break; // Streak bị phá
                }
            } else {
                break; // Không có dữ liệu
            }
        }

        setStreakDays(streak);
    };

    // Load kế hoạch và cập nhật target khi component mount
    useEffect(() => {
        const loadPlanAndCalculateTarget = async () => {
            const plan = await loadUserPlan();

            if (plan) {
                const target = calculateTodayTarget(plan);
                setTodayData(prev => ({
                    ...prev,
                    targetCigarettes: target
                }));
            } else {
                console.log("⚠️ Không có kế hoạch được load, target = 0");
                setTodayData(prev => ({
                    ...prev,
                    targetCigarettes: 0
                }));
            }

            calculateStreakDays();
        };

        loadPlanAndCalculateTarget();
    }, []);

    // Memoized target calculation để tránh cache issues
    const currentTarget = useMemo(() => {
        if (!selectedPlan) return todayData.targetCigarettes;

        const target = calculateTodayTarget(selectedPlan);
        console.log('🎯 useMemo - Calculated target:', target, 'for plan:', selectedPlan.plan_name);
        return target;
    }, [selectedPlan?.id, selectedPlan?.weeks, todayData.targetCigarettes]);

    // Watch selectedPlan changes from parent (Progress component) - MAIN UPDATE METHOD
    useEffect(() => {
        if (selectedPlan) {
            console.log('🔄 DailyCheckin - selectedPlan prop changed:', selectedPlan.plan_name || selectedPlan.planName);
            console.log('🔄 DailyCheckin - Recalculating target for new plan...');

            // Update currentPlan and recalculate target
            setCurrentPlan(selectedPlan);
            const target = calculateTodayTarget(selectedPlan);

            console.log('🔄 DailyCheckin - New target calculated:', target);

            // FORCE COMPLETE STATE RESET to avoid caching
            setTodayData(prev => {
                const newData = {
                    date: new Date().toISOString().split('T')[0],
                    targetCigarettes: target, // Use fresh calculated target
                    actualCigarettes: prev.actualCigarettes, // Keep user input
                    initialCigarettes: selectedPlan.initial_cigarettes || selectedPlan.initialCigarettes || 0,
                    notes: prev.notes
                };
                console.log('🔄 DailyCheckin - COMPLETE STATE RESET:', newData);
                return newData;
            });

            // Force re-render with delay to ensure state update
            setTimeout(() => {
                setForceRender(prev => prev + 1);
                console.log('🔄 DailyCheckin - Force render triggered after state reset');
            }, 50);
        }
    }, [selectedPlan]);

    // Reset state khi user thay đổi để tránh dính data từ user trước - TEMPORARILY DISABLED
    useEffect(() => {
        // TEMPORARILY DISABLED TO DEBUG FLICKERING ISSUE
        console.log('👤 DailyCheckin - User useEffect DISABLED to prevent target override');
        return;

        if (user?.id) {
            console.log('👤 DailyCheckin - User changed, resetting state for user:', user.id);

            // Reset tất cả state về trạng thái ban đầu
            setTodayData({
                date: new Date().toISOString().split('T')[0],
                targetCigarettes: 0,
                actualCigarettes: 0,
                initialCigarettes: 0,
                notes: ''
            });
            setIsSubmitted(false);
            setCurrentWeek(1);
            setStreakDays(0);
            setCurrentPlan(null);

            // Load lại dữ liệu cho user mới
            const loadPlanAndCalculateTarget = async () => {
                console.log('👤 DailyCheckin - Loading initial plan for user:', user.id);
                const plan = await loadUserPlan();

                if (plan) {
                    const target = calculateTodayTarget(plan);
                    console.log('👤 DailyCheckin - Initial target for user:', target);
                    setTodayData(prev => ({
                        ...prev,
                        targetCigarettes: target
                    }));
                } else {
                    console.log("⚠️ Không có kế hoạch được load cho user mới, target = 0");
                    setTodayData(prev => ({
                        ...prev,
                        targetCigarettes: 0
                    }));
                }

                calculateStreakDays();
            };

            // Only run if this is actually a new user, not just component re-render
            const currentUserId = localStorage.getItem('currentUserId');
            if (currentUserId !== user.id.toString()) {
                localStorage.setItem('currentUserId', user.id.toString());
                loadPlanAndCalculateTarget();

                // Xóa tất cả dữ liệu check-in cũ khi có user mới
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('checkin_')) {
                        localStorage.removeItem(key);
                    }
                });

                console.log('🔄 Reset DailyCheckin state và xóa dữ liệu cũ cho user mới:', user.id);
            } else {
                console.log('👤 DailyCheckin - Same user, skipping reset');
            }
        }
    }, [user?.id]); // Chỉ chạy khi user ID thay đổi

    // Lắng nghe sự kiện thay đổi kế hoạch từ ActivePlanSelector - DISABLED TO AVOID CONFLICT
    useEffect(() => {
        // Temporarily disabled - using props instead
        console.log('🔧 DailyCheckin - Event listener disabled, using props communication');
        return;

        console.log('🔧 DailyCheckin - Setting up event listener for plan changes...');

        const handlePlanChange = (event) => {
            console.log('🔄 DailyCheckin - Plan changed event received:', event.detail);
            console.log('🔄 DailyCheckin - Current localStorage activePlan:', localStorage.getItem('activePlan'));

            // Reload plan and recalculate target
            const loadPlanAndCalculateTarget = async () => {
                console.log('🔄 DailyCheckin - Loading new plan...');
                const plan = await loadUserPlan();

                if (plan) {
                    console.log('🔄 DailyCheckin - New plan loaded:', plan.plan_name || plan.planName);
                    console.log('🔄 DailyCheckin - Plan details for target calculation:', {
                        weeks: plan.weeks?.length || 0,
                        startDate: plan.startDate || plan.start_date,
                        firstWeekAmount: plan.weeks?.[0]?.amount || plan.weeks?.[0]?.cigarettes || plan.weeks?.[0]?.target || 'N/A'
                    });

                    // Force use the new plan for calculation, not currentPlan state
                    const target = calculateTodayTarget(plan);
                    console.log('🔄 DailyCheckin - Calculated new target:', target);

                    // Update both targetCigarettes and currentPlan
                    setCurrentPlan(plan);
                    setTodayData(prev => ({
                        ...prev,
                        targetCigarettes: target
                    }));
                    console.log('🔄 DailyCheckin - Updated target after plan change:', target);
                } else {
                    console.log("⚠️ Không có kế hoạch sau khi thay đổi, target = 0");
                    setCurrentPlan(null);
                    setTodayData(prev => ({
                        ...prev,
                        targetCigarettes: 0
                    }));
                }
            };

            loadPlanAndCalculateTarget();
        };

        // Lắng nghe sự kiện thay đổi kế hoạch
        window.addEventListener('localStorageChanged', handlePlanChange);
        console.log('✅ DailyCheckin - Event listener added for localStorageChanged');

        return () => {
            window.removeEventListener('localStorageChanged', handlePlanChange);
            console.log('🧹 DailyCheckin - Event listener removed');
        };
    }, []);

    // Bỏ useEffect này vì đã xử lý trong useEffect chính
    // Load dữ liệu từ database khi component mount
    useEffect(() => {
        const loadUserData = async () => {
            try {            // Lấy userId từ getCurrentUserId utility function
                const userId = getCurrentUserId();
                console.log('🔍 DailyCheckin - getCurrentUserId():', userId);

                const today = new Date().toISOString().split('T')[0];

                // Chỉ thực hiện khi có userId hợp lệ
                if (!userId) {
                    console.warn('⚠️ User not logged in, skipping database operations');
                    // Chỉ load từ localStorage
                    const savedData = localStorage.getItem(`checkin_${today}`);
                    const draftData = localStorage.getItem(`checkin_${today}_draft`);

                    if (savedData) {
                        try {
                            const data = JSON.parse(savedData);
                            setTodayData(data);
                            setIsSubmitted(true);
                        } catch (e) {
                            localStorage.removeItem(`checkin_${today}`);
                        }
                    } else if (draftData) {
                        try {
                            const data = JSON.parse(draftData);
                            setTodayData(data);
                            setIsSubmitted(false);

                            setToast({
                                show: true,
                                message: '📝 Khôi phục dữ liệu nháp đã nhập',
                                type: 'info'
                            });

                            setTimeout(() => {
                                setToast(prev => ({ ...prev, show: false }));
                            }, 2000);
                        } catch (e) {
                            localStorage.removeItem(`checkin_${today}_draft`);
                        }
                    }
                    return;
                }

                // Thử load từ database bằng userId API
                try {
                    console.log('🔍 DailyCheckin - Using userId:', userId);

                    const response = await progressService.getProgressByUserId(userId);

                    if (response && response.success && response.data && response.data.length > 0) {
                        // Tìm dữ liệu cho ngày hôm nay
                        const todayProgress = response.data.find(item =>
                            item.date.split('T')[0] === today
                        );

                        if (todayProgress) {
                            const loadedData = {
                                date: today,
                                targetCigarettes: todayProgress.target_cigarettes || 0,
                                actualCigarettes: todayProgress.actual_cigarettes || 0,
                                notes: todayProgress.notes || '',
                                healthScore: todayProgress.health_score || 0,
                                moneySaved: todayProgress.money_saved || 0,
                                cigarettesAvoided: todayProgress.cigarettes_avoided || 0
                            };

                            setTodayData(loadedData);
                            setIsSubmitted(true);

                            // Sync với localStorage
                            localStorage.setItem(`checkin_${today}`, JSON.stringify(loadedData));

                            setToast({
                                show: true,
                                message: 'Hãy ghi nhận số điếu bạn hút hôm nay',
                                type: 'success'
                            });

                            setTimeout(() => {
                                setToast(prev => ({ ...prev, show: false }));
                            }, 2000);
                            return; // Dừng ở đây nếu đã load được từ database
                        }
                    }
                } catch (dbError) {
                    console.log('Database load failed, trying localStorage fallback');
                }

                // Fallback: Load từ localStorage (submitted data hoặc draft)
                const savedData = localStorage.getItem(`checkin_${today}`);
                const draftData = localStorage.getItem(`checkin_${today}_draft`);

                if (savedData) {
                    try {
                        const data = JSON.parse(savedData);
                        setTodayData(data);
                        setIsSubmitted(true);
                    } catch (e) {
                        // Nếu có lỗi parse JSON
                        localStorage.removeItem(`checkin_${today}`);
                    }
                } else if (draftData) {
                    try {
                        const data = JSON.parse(draftData);
                        setTodayData(data);
                        setIsSubmitted(false);

                        setToast({
                            show: true,
                            message: '📝 Khôi phục dữ liệu nháp đã nhập',
                            type: 'info'
                        });

                        setTimeout(() => {
                            setToast(prev => ({ ...prev, show: false }));
                        }, 2000);
                    } catch (e) {
                        // Nếu có lỗi parse JSON
                        localStorage.removeItem(`checkin_${today}_draft`);
                    }
                }

            } catch (error) {
                console.error('❌ Error loading user data:', error);
            }
        };

        loadUserData();
    }, []);

    const handleInputChange = (field, value) => {
        const updatedData = {
            ...todayData,
            [field]: value
        };

        setTodayData(updatedData);

        // Auto-save to localStorage để tránh mất dữ liệu khi chuyển trang
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`checkin_${today}_draft`, JSON.stringify(updatedData));
    };

    const handleSubmit = async () => {
        // Lưu dữ liệu vào localStorage
        const today = new Date().toISOString().split('T')[0];
        const isUpdate = localStorage.getItem(`checkin_${today}`) !== null;

        localStorage.setItem(`checkin_${today}`, JSON.stringify(todayData));

        // Clear draft data khi submit thành công
        localStorage.removeItem(`checkin_${today}_draft`);

        // Cập nhật streak bằng cách tính toán lại từ dữ liệu đã lưu
        calculateStreakDays();

        // Gửi dữ liệu lên server để lưu vào cơ sở dữ liệu
        try {
            // Lấy userId từ getCurrentUserId utility function
            const userId = getCurrentUserId();
            console.log('🔍 DailyCheckin handleSubmit - getCurrentUserId():', userId);
            console.log('🔍 DailyCheckin handleSubmit - localStorage keys:', Object.keys(localStorage));
            console.log('🔍 DailyCheckin handleSubmit - sessionStorage keys:', Object.keys(sessionStorage));
            console.log('🔍 DailyCheckin handleSubmit - nosmoke_user:', localStorage.getItem('nosmoke_user'));
            console.log('🔍 DailyCheckin handleSubmit - nosmoke_token:', localStorage.getItem('nosmoke_token') ? 'Present' : 'Missing');

            if (!userId) {
                console.warn('⚠️ User not logged in, cannot save to database');
                setToast({
                    show: true,
                    message: '⚠️ Chưa đăng nhập. Dữ liệu chỉ lưu cục bộ.',
                    type: 'warning'
                });
                setIsSubmitted(true);
                return;
            }

            console.log('🔍 DailyCheckin handleSubmit - Using userId:', userId);

            // Lấy số điếu ban đầu từ plan
            let initialCigarettes = todayData.initialCigarettes || 0; // Lấy từ state trước
            console.log('🔍 DailyCheckin handleSubmit - todayData.initialCigarettes:', todayData.initialCigarettes);
            console.log('🔍 DailyCheckin handleSubmit - currentPlan:', currentPlan);

            // Nếu state không có hoặc = 0, lấy từ currentPlan
            if (!initialCigarettes && currentPlan) {
                if (currentPlan.initialCigarettes) {
                    initialCigarettes = currentPlan.initialCigarettes;
                    console.log('🔍 DailyCheckin handleSubmit - Got from currentPlan.initialCigarettes:', initialCigarettes);
                } else if (currentPlan.initial_cigarettes) {
                    initialCigarettes = currentPlan.initial_cigarettes;
                    console.log('🔍 DailyCheckin handleSubmit - Got from currentPlan.initial_cigarettes:', initialCigarettes);
                } else if (currentPlan.dailyCigarettes) {
                    initialCigarettes = currentPlan.dailyCigarettes;
                    console.log('🔍 DailyCheckin handleSubmit - Got from currentPlan.dailyCigarettes:', initialCigarettes);
                } else if (currentPlan.daily_cigarettes) {
                    initialCigarettes = currentPlan.daily_cigarettes;
                    console.log('🔍 DailyCheckin handleSubmit - Got from currentPlan.daily_cigarettes:', initialCigarettes);
                } else if (currentPlan.weeks && currentPlan.weeks.length > 0) {
                    // Lấy từ tuần đầu tiên
                    const firstWeek = currentPlan.weeks[0];
                    initialCigarettes = firstWeek.amount || firstWeek.cigarettes ||
                        firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                        firstWeek.target || 0;
                    console.log('🔍 DailyCheckin handleSubmit - Got from first week:', initialCigarettes);
                }
            }

            console.log('🔍 DailyCheckin handleSubmit - Final initial cigarettes:', initialCigarettes);

            // Thêm initialCigarettes vào todayData
            const dataWithInitial = {
                ...todayData,
                initialCigarettes: initialCigarettes,
                dailyCigarettes: initialCigarettes
            };

            console.log('Using userId for API call:', userId);
            const result = await progressService.createCheckinByUserId(userId, dataWithInitial);

            setToast({
                show: true,
                message: '✅ Lưu thành công!',
                type: 'success'
            });
            // Gọi callback cập nhật dashboard
            if (onProgressUpdate) onProgressUpdate({ ...todayData, date: today });
        } catch (error) {
            console.error('❌ Error saving to database:', error);
            let errorMessage = '❌ Không thể lưu dữ liệu vào cơ sở dữ liệu. Đã lưu cục bộ.';

            if (error.response?.status === 401) {
                errorMessage = '❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 500) {
                errorMessage = '❌ Lỗi máy chủ. Vui lòng thử lại sau.';
            }

            setToast({
                show: true,
                message: errorMessage,
                type: 'error'
            });
        }

        setIsSubmitted(true);

        // Callback để cập nhật component cha (đã gọi ở trên)
        // ...existing code...
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    }; const handleEdit = () => {
        // Cho phép chỉnh sửa lại form
        setIsSubmitted(false);

        // Hiển thị thông báo
        setToast({
            show: true,
            message: '📝 Bạn có thể cập nhật số điếu thuốc đã hút hôm nay',
            type: 'info'
        });

        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Thêm hàm mới để cập nhật dữ liệu lên server
    const updateServerData = async (date) => {
        try {
            // Thêm initialCigarettes vào dữ liệu
            const dataWithInitial = {
                ...todayData,
                initialCigarettes: todayData.initialCigarettes || 0,
                dailyCigarettes: todayData.initialCigarettes || 0
            };

            const result = await progressService.updateCheckin(date, dataWithInitial);
            return true;
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật dữ liệu checkin vào cơ sở dữ liệu:', error);
            setToast({
                show: true,
                message: '❌ Không thể cập nhật dữ liệu lên cơ sở dữ liệu. Đã lưu cục bộ.',
                type: 'error'
            });
            return false;
        }
    }; const isTargetAchieved = todayData.actualCigarettes <= currentTarget;    // Hàm đóng toast notification
    const closeToast = () => {
        // Thêm class để animation chạy trước khi ẩn
        const toastElement = document.querySelector('.toast-notification');
        if (toastElement) {
            toastElement.classList.add('toast-exit');
            setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 300); // Đợi animation kết thúc
        } else {
            setToast({ ...toast, show: false });
        }
    };

    return (
        <div className="daily-checkin">
            <div className="checkin-header">                <div className="header-content">
                <div className="header-icon">
                    <FaCalendarCheck />
                </div>
                <div className="header-text">
                    <h2>Ghi nhận hôm nay</h2>
                    <p>Ghi nhận tiến trình cai thuốc ngày {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
            </div>

            </div>

            <div className="checkin-separator"></div>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast-notification ${toast.type}`}>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={closeToast}>&times;</button>
                </div>
            )}

            <div className="checkin-content">
                {/* Target vs Actual */}
                <div className="progress-section">                    <div className="target-card" key={`target-${currentTarget}-${currentPlan?.id || 'none'}-${forceRender}`}>
                    <h3>Mục tiêu hôm nay</h3>
                    <div className="target-amount" style={{ fontWeight: 'bold', color: '#2196F3' }}>
                        {currentTarget} điếu
                    </div>
                    <p>Tuần {currentWeek} - Kế hoạch của bạn</p>
                    {/* Debug info */}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Debug: target={currentTarget}, state={todayData.targetCigarettes}, plan={currentPlan?.plan_name || 'none'}, render={forceRender}
                    </div>

                    {todayData.weeklyProgress && (
                        <div className="progress-badge">
                            <span>-{todayData.weeklyProgress.reduction} điếu ({todayData.weeklyProgress.percentReduction}%)</span>
                            <p>so với tuần trước</p>
                        </div>
                    )}
                </div>

                    <div className="vs-divider">VS</div>                    <div className="actual-card">
                        <h3>Thực tế đã hút</h3>
                        <div className="number-input-container">
                            <button
                                type="button"
                                className="number-decrement"
                                onClick={() => handleInputChange('actualCigarettes', Math.max(0, todayData.actualCigarettes - 1))}
                                disabled={isSubmitted || todayData.actualCigarettes <= 0}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={todayData.actualCigarettes || 0}
                                onChange={(e) => {
                                    if (!isSubmitted) {
                                        const value = parseInt(e.target.value) || 0;
                                        handleInputChange('actualCigarettes', value);
                                    }
                                }}
                                className="actual-input"
                                disabled={isSubmitted}
                                placeholder="0"
                                style={{
                                    backgroundColor: isSubmitted ? '#f5f5f5' : 'white',
                                    border: isSubmitted ? '2px solid #ddd' : '2px solid #4CAF50',
                                    padding: '8px',
                                    fontSize: '18px',
                                    textAlign: 'center',
                                    borderRadius: '4px',
                                    width: '80px',
                                    color: isSubmitted ? '#999' : '#333'
                                }}
                            />
                            <button
                                type="button"
                                className="number-increment"
                                onClick={() => handleInputChange('actualCigarettes', Math.min(50, todayData.actualCigarettes + 1))}
                                disabled={isSubmitted || todayData.actualCigarettes >= 50}
                            >
                                +
                            </button>
                        </div>
                        <p className={`result ${isTargetAchieved ? 'success' : 'warning'}`}>
                            {isTargetAchieved ? '✅ Đạt mục tiêu!' : '⚠️ Vượt mục tiêu'}
                        </p>
                    </div></div>                {/* Action Buttons */}
                <div className="checkin-actions">
                    {!isSubmitted ? (
                        <button
                            onClick={handleSubmit}
                            className="submit-btn"
                        >
                            <FaSave className="btn-icon" />
                            Lưu checkin hôm nay
                        </button>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="edit-btn"
                        >
                            <FaSave className="btn-icon" />
                            Cập nhật số điếu hôm nay
                        </button>
                    )}                </div>
                {/* Summary Card đã được xóa vì dư thừa */}
            </div>
        </div>
    );
};


export default DailyCheckin;
