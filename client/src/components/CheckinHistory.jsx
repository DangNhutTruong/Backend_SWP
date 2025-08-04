import React, { useState, useEffect, useReducer } from 'react';
import { FaCalendarAlt, FaEdit, FaSave, FaTimes, FaChevronLeft, FaChevronRight, FaSync, FaTrash } from 'react-icons/fa';
import progressService from '../services/progressService';
import { getCurrentUserId } from '../utils/userUtils';
import { useAuth } from '../context/AuthContext';
import '../styles/CheckinHistory.css';

const CheckinHistory = ({ onProgressUpdate }) => {
    const { user } = useAuth();
    const [checkinHistory, setCheckinHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);
    const [tempEditData, setTempEditData] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(7); // Hiển thị 7 ngày mỗi trang
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    // Sử dụng useReducer để force update component khi cần thiết
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    // State để kiểm soát việc mở/đóng sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Tải kế hoạch từ database để lấy initialCigarettes
    const [userPlan, setUserPlan] = useState(null);

    // Hàm chuyển đổi trạng thái của sidebar (mở/đóng)
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Hàm lấy kế hoạch của người dùng từ localStorage hoặc API
    const loadUserPlan = async () => {
        try {
            console.log('🔍 CheckinHistory loadUserPlan - Starting...');

            // Ưu tiên lấy từ localStorage (kế hoạch được chọn từ ActivePlanSelector)
            const localPlan = localStorage.getItem('activePlan');
            console.log('🔍 CheckinHistory loadUserPlan - localPlan:', localPlan);

            if (localPlan) {
                const parsedPlan = JSON.parse(localPlan);
                setUserPlan(parsedPlan);
                console.log('🔍 CheckinHistory - Set plan from localStorage:', parsedPlan);
                return parsedPlan;
            }

            // Fallback: Load từ API nếu không có trong localStorage
            const quitPlanService = await import('../services/quitPlanService');
            const response = await quitPlanService.getUserActivePlan();

            if (response && response.success && response.plan) {
                let plan = response.plan;
                console.log('🔍 CheckinHistory loadUserPlan - plan from API:', plan);

                // Parse plan_details nếu nó là string
                if (plan.plan_details && typeof plan.plan_details === 'string') {
                    try {
                        const parsedDetails = JSON.parse(plan.plan_details);
                        plan = { ...plan, ...parsedDetails };
                    } catch (e) {
                        console.error('Error parsing plan_details:', e);
                    }
                }

                setUserPlan(plan);
                return plan;
            }
            return null;
        } catch (error) {
            console.error('❌ Error loading plan:', error);
            return null;
        }
    };

    // Lấy initialCigarettes từ plan
    const getInitialCigarettesFromPlan = (plan) => {
        if (!plan) return 0;

        // Ưu tiên lấy từ initialCigarettes trực tiếp
        if (plan.initialCigarettes) {
            return plan.initialCigarettes;
        } else if (plan.initial_cigarettes) {
            return plan.initial_cigarettes;
        } else if (plan.dailyCigarettes) {
            return plan.dailyCigarettes;
        } else if (plan.daily_cigarettes) {
            return plan.daily_cigarettes;
        } else if (plan.weeks && plan.weeks.length > 0) {
            // Lấy từ tuần đầu tiên
            const firstWeek = plan.weeks[0];
            return firstWeek.amount || firstWeek.cigarettes ||
                firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                firstWeek.target || 0;
        }

        return 0;
    };

    // Hàm tạo danh sách các ngày từ ngày bắt đầu kế hoạch đến ngày kết thúc (bao gồm cả ngày tương lai)
    const generateDaysArray = (startDate, endDate = null) => {
        const today = new Date();
        const start = new Date(startDate);
        const days = [];

        // Nếu ngày bắt đầu không hợp lệ, sử dụng 30 ngày trước
        const validStartDate = !isNaN(start) ? start : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Xác định ngày kết thúc: endDate nếu có, hoặc hôm nay
        let validEndDate = today;
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end)) {
                // Sử dụng ngày kết thúc của kế hoạch, bao gồm cả ngày tương lai
                validEndDate = end;
            }
        }

        console.log('📅 generateDaysArray - Start:', validStartDate.toISOString().split('T')[0],
            'End:', validEndDate.toISOString().split('T')[0]);

        // Tạo mảng các ngày từ ngày bắt đầu đến ngày kết thúc
        for (let day = new Date(validStartDate); day <= validEndDate; day.setDate(day.getDate() + 1)) {
            const dateStr = day.toISOString().split('T')[0];
            days.push(dateStr);
        }

        console.log('📅 generateDaysArray - Generated', days.length, 'days');
        return days;
    };

    // Hàm tạo check-in trống cho một ngày
    const createEmptyCheckin = (date, initialCigarettes, targetCigarettes = null) => {
        // Mục tiêu phải lấy từ kế hoạch, không phải số điếu ban đầu
        // Nếu không có mục tiêu cụ thể, gán giá trị 0 để người dùng sẽ điền sau
        const target = targetCigarettes !== null ? targetCigarettes : 0;

        return {
            date,
            targetCigarettes: target, // Sử dụng giá trị mục tiêu từ kế hoạch
            actualCigarettes: null,   // Giá trị null để hiển thị N/A (chưa nhập)
            initialCigarettes: initialCigarettes,
            cigarettesAvoided: null,  // Null để hiển thị N/A (chưa có dữ liệu)
            moneySaved: null,         // Null để hiển thị N/A (chưa có dữ liệu)
            healthScore: null,        // Null để hiển thị N/A (chưa có dữ liệu)
            notes: '',
            isEmpty: true             // Đánh dấu là bản ghi trống (chưa nhập dữ liệu)
        };
    };

    // Tải lịch sử check-in
    useEffect(() => {
        const loadCheckinHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const userId = getCurrentUserId();
                if (!userId) {
                    throw new Error('User not logged in');
                }

                // Lấy kế hoạch của người dùng trước để đảm bảo có initialCigarettes đúng
                const plan = await loadUserPlan();
                let initialCigarettesFromPlan = 30; // Giá trị mặc định nếu không tìm thấy kế hoạch
                let planStartDate = null;
                let planEndDate = null;

                if (plan) {
                    initialCigarettesFromPlan = getInitialCigarettesFromPlan(plan) || 30;
                    console.log('🔍 CheckinHistory - initialCigarettes from plan:', initialCigarettesFromPlan);

                    // Lấy ngày bắt đầu kế hoạch nếu có
                    planStartDate = plan.startDate || plan.start_date;

                    // Tính ngày kết thúc dựa trên số tuần
                    if (planStartDate && plan.weeks && plan.weeks.length > 0) {
                        const startDate = new Date(planStartDate);
                        const totalWeeks = plan.total_weeks || plan.totalWeeks || plan.weeks.length;
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + (totalWeeks * 7));
                        planEndDate = endDate.toISOString().split('T')[0];
                        console.log('📅 CheckinHistory - Plan period:', planStartDate, 'to', planEndDate, `(${totalWeeks} weeks)`);
                    }

                    // Lưu initialCigarettes vào localStorage để sử dụng khi cần
                    if (initialCigarettesFromPlan > 0) {
                        localStorage.setItem('initialCigarettes', initialCigarettesFromPlan.toString());
                        console.log('🔍 CheckinHistory - Saved initialCigarettes to localStorage:', initialCigarettesFromPlan);
                    }
                } else {
                    console.warn('🔍 CheckinHistory - No plan found for user:', userId);
                }

                console.log('🔍 CheckinHistory - Loading history for user:', userId);

                // Gọi API để lấy lịch sử theo plan_id cụ thể
                let response;
                if (plan && (plan.id || plan.plan_id)) {
                    const planId = plan.id || plan.plan_id;
                    console.log('🔍 CheckinHistory - Loading history for plan:', planId);
                    response = await progressService.getProgressByUserId(userId, { plan_id: planId });
                } else {
                    console.log('🔍 CheckinHistory - Loading history without plan filter');
                    response = await progressService.getProgressByUserId(userId);
                }

                if (response && response.success && response.data) {
                    // Format dữ liệu từ API
                    const apiHistory = response.data.map(entry => ({
                        date: entry.date.split('T')[0],
                        targetCigarettes: entry.target_cigarettes || 0,
                        actualCigarettes: entry.actual_cigarettes || 0,
                        initialCigarettes: entry.initial_cigarettes || initialCigarettesFromPlan,
                        cigarettesAvoided: entry.cigarettes_avoided || 0,
                        moneySaved: entry.money_saved || 0,
                        healthScore: entry.health_score || 0,
                        notes: entry.notes || '',
                        isFromApi: true // Đánh dấu là dữ liệu từ API
                    }));

                    // Tạo Map từ dữ liệu API để tra cứu nhanh
                    const historyMap = new Map();
                    apiHistory.forEach(entry => {
                        historyMap.set(entry.date, entry);
                    });

                    // Lấy các ngày từ ngày bắt đầu kế hoạch đến ngày kết thúc (hoặc hiện tại)
                    console.log('🔍 CheckinHistory - planStartDate:', planStartDate);
                    console.log('🔍 CheckinHistory - planEndDate:', planEndDate);
                    const allDays = generateDaysArray(planStartDate, planEndDate);
                    console.log(`🔍 Generated ${allDays.length} days from plan start to end`);

                    // Hàm tính mục tiêu cho từng ngày
                    const getTargetCigarettesForDate = (date, plan) => {
                        if (!plan || !plan.weeks || (!plan.startDate && !plan.start_date)) {
                            console.log('🔍 CheckinHistory - Không tìm thấy thông tin kế hoạch đầy đủ để tính mục tiêu');
                            return 0;
                        }

                        const planStartDate = new Date(plan.startDate || plan.start_date);
                        const targetDate = new Date(date);
                        const daysSincePlanStart = Math.floor((targetDate - planStartDate) / (1000 * 60 * 60 * 24));

                        if (daysSincePlanStart < 0) {
                            return initialCigarettesFromPlan;
                        }

                        let currentWeekIndex = 0;
                        let daysPassed = 0;

                        for (let i = 0; i < plan.weeks.length; i++) {
                            const weekDuration = 7;
                            if (daysSincePlanStart >= daysPassed && daysSincePlanStart < daysPassed + weekDuration) {
                                currentWeekIndex = i;
                                break;
                            }
                            daysPassed += weekDuration;
                        }

                        if (currentWeekIndex >= plan.weeks.length) {
                            currentWeekIndex = plan.weeks.length - 1;
                        }

                        const currentWeek = plan.weeks[currentWeekIndex];
                        return currentWeek ? (currentWeek.target ?? currentWeek.amount ?? currentWeek.cigarettes ?? 0) : 0;
                    };

                    // Tạo lịch sử đầy đủ với tất cả các ngày
                    const fullHistory = allDays.map(date => {
                        // Nếu đã có dữ liệu cho ngày này từ API, sử dụng nó
                        if (historyMap.has(date)) {
                            return historyMap.get(date);
                        }

                        // Tính mục tiêu cho ngày này dựa trên kế hoạch
                        const targetForThisDay = getTargetCigarettesForDate(date, plan);

                        // Nếu không có, tạo một bản ghi trống với mục tiêu đúng
                        return createEmptyCheckin(date, initialCigarettesFromPlan, targetForThisDay);
                    });

                    // Sắp xếp theo ngày tăng dần để ngày bắt đầu kế hoạch ở trang 1
                    fullHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setCheckinHistory(fullHistory);
                    console.log('✅ CheckinHistory - Loaded', fullHistory.length, 'entries (including empty days)');
                } else {
                    // Fallback: Tạo lịch sử từ localStorage theo plan_id
                    const localHistory = [];
                    const planId = plan && (plan.id || plan.plan_id) ? (plan.id || plan.plan_id).toString() : 'default';

                    Object.keys(localStorage).forEach(key => {
                        // Chỉ tìm các key có format: checkin_planId_date cho kế hoạch hiện tại
                        if (key.startsWith(`checkin_${planId}_`) && !key.endsWith('_draft')) {
                            try {
                                const dateStr = key.replace(`checkin_${planId}_`, '');
                                const data = JSON.parse(localStorage.getItem(key));
                                localHistory.push({
                                    date: dateStr,
                                    ...data,
                                    isFromLocalStorage: true
                                });
                            } catch (e) {
                                console.warn('Error parsing localStorage item:', key, e);
                            }
                        }
                        // Chỉ dành cho kế hoạch không có ID (kế hoạch mặc định cũ)
                        // và chỉ khi không có kế hoạch cụ thể nào được chọn
                        else if (planId === 'default' && key.startsWith('checkin_') &&
                            !key.includes('_', key.indexOf('_') + 1) && !key.endsWith('_draft')) {
                            try {
                                const dateStr = key.replace('checkin_', '');
                                // Kiểm tra xem dateStr có phải là ngày hợp lệ không (YYYY-MM-DD format)
                                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                    const data = JSON.parse(localStorage.getItem(key));
                                    localHistory.push({
                                        date: dateStr,
                                        ...data,
                                        isFromLocalStorage: true
                                    });
                                }
                            } catch (e) {
                                console.warn('Error parsing localStorage item:', key, e);
                            }
                        }
                    });

                    console.log(`🔍 CheckinHistory - Found ${localHistory.length} localStorage entries for plan ${planId}`);

                    // Tạo Map từ dữ liệu localStorage để tra cứu nhanh
                    const historyMap = new Map();
                    localHistory.forEach(entry => {
                        historyMap.set(entry.date, entry);
                    });

                    // Lấy các ngày từ ngày bắt đầu kế hoạch đến ngày kết thúc (hoặc hiện tại)
                    console.log('🔍 CheckinHistory - (localStorage fallback) planStartDate:', planStartDate);
                    console.log('🔍 CheckinHistory - (localStorage fallback) planEndDate:', planEndDate);
                    const allDays = generateDaysArray(planStartDate, planEndDate);
                    console.log(`🔍 Generated ${allDays.length} days from plan start to end (localStorage fallback)`);

                    // Hàm tính mục tiêu cho localStorage fallback
                    const getTargetCigarettesForDate = (date, plan) => {
                        if (!plan || !plan.weeks || (!plan.startDate && !plan.start_date)) {
                            console.log('🔍 CheckinHistory - Không tìm thấy thông tin kế hoạch đầy đủ để tính mục tiêu');
                            return 0;
                        }

                        const planStartDate = new Date(plan.startDate || plan.start_date);
                        const targetDate = new Date(date);
                        const daysSincePlanStart = Math.floor((targetDate - planStartDate) / (1000 * 60 * 60 * 24));

                        if (daysSincePlanStart < 0) {
                            return initialCigarettesFromPlan;
                        }

                        let currentWeekIndex = 0;
                        let daysPassed = 0;

                        for (let i = 0; i < plan.weeks.length; i++) {
                            const weekDuration = 7;
                            if (daysSincePlanStart >= daysPassed && daysSincePlanStart < daysPassed + weekDuration) {
                                currentWeekIndex = i;
                                break;
                            }
                            daysPassed += weekDuration;
                        }

                        if (currentWeekIndex >= plan.weeks.length) {
                            currentWeekIndex = plan.weeks.length - 1;
                        }

                        const currentWeek = plan.weeks[currentWeekIndex];
                        return currentWeek ? (currentWeek.target ?? currentWeek.amount ?? currentWeek.cigarettes ?? 0) : 0;
                    };

                    // Tạo lịch sử đầy đủ với tất cả các ngày
                    const fullHistory = allDays.map(date => {
                        // Nếu đã có dữ liệu cho ngày này từ localStorage, sử dụng nó
                        if (historyMap.has(date)) {
                            return historyMap.get(date);
                        }

                        // Tính mục tiêu cho ngày này dựa trên kế hoạch
                        const targetForThisDay = getTargetCigarettesForDate(date, plan);

                        // Nếu không có, tạo một bản ghi trống với mục tiêu đúng
                        return createEmptyCheckin(date, initialCigarettesFromPlan, targetForThisDay);
                    });

                    // Sắp xếp theo ngày tăng dần để ngày bắt đầu kế hoạch ở trang 1
                    fullHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setCheckinHistory(fullHistory);
                    console.log('✅ CheckinHistory - Loaded', fullHistory.length, 'entries (including empty days) from localStorage fallback');
                }
            } catch (err) {
                console.error('❌ Error loading checkin history:', err);
                setError('Không thể tải lịch sử check-in. Vui lòng thử lại sau.');

                // Fallback: Tìm trong localStorage theo plan_id
                const localHistory = [];
                const planId = userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id).toString() : 'default';

                Object.keys(localStorage).forEach(key => {
                    // Chỉ tìm các key có format: checkin_planId_date cho kế hoạch hiện tại
                    if (key.startsWith(`checkin_${planId}_`) && !key.endsWith('_draft')) {
                        try {
                            const dateStr = key.replace(`checkin_${planId}_`, '');
                            const data = JSON.parse(localStorage.getItem(key));
                            localHistory.push({
                                date: dateStr,
                                ...data
                            });
                        } catch (e) {
                            console.warn('Error parsing localStorage item:', key, e);
                        }
                    }
                    // Chỉ dành cho kế hoạch không có ID (kế hoạch mặc định cũ)
                    else if (planId === 'default' && key.startsWith('checkin_') &&
                        !key.includes('_', key.indexOf('_') + 1) && !key.endsWith('_draft')) {
                        try {
                            const dateStr = key.replace('checkin_', '');
                            // Kiểm tra xem dateStr có phải là ngày hợp lệ không
                            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                const data = JSON.parse(localStorage.getItem(key));
                                localHistory.push({
                                    date: dateStr,
                                    ...data
                                });
                            }
                        } catch (e) {
                            console.warn('Error parsing localStorage item:', key, e);
                        }
                    }
                });

                console.log(`🔍 CheckinHistory - Found ${localHistory.length} localStorage entries for plan ${planId} in error fallback`);

                // Sắp xếp theo ngày tăng dần để ngày bắt đầu kế hoạch ở trang 1
                localHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                if (localHistory.length > 0) {
                    setCheckinHistory(localHistory);
                    setError('Không thể tải từ máy chủ. Hiển thị dữ liệu lưu cục bộ.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadCheckinHistory();
    }, []);

    // Lắng nghe sự kiện thay đổi kế hoạch từ ActivePlanSelector
    useEffect(() => {
        const handlePlanChange = () => {
            console.log('🔄 CheckinHistory - Plan changed, reloading history...');
            // Reset và tải lại lịch sử
            setCheckinHistory([]);
            setLoading(true);
            setCurrentPage(1); // Reset về trang đầu tiên khi đổi kế hoạch

            // Reload data with a small delay to ensure localStorage is updated
            setTimeout(() => {
                const loadCheckinHistory = async () => {
                    try {
                        setLoading(true);
                        setError(null);

                        const userId = getCurrentUserId();
                        if (!userId) {
                            throw new Error('User not logged in');
                        }

                        // Lấy kế hoạch mới từ localStorage
                        const plan = await loadUserPlan();

                        if (plan) {
                            // Tính lại ngày bắt đầu và kết thúc cho kế hoạch mới
                            const planStartDate = plan.startDate || plan.start_date;
                            let planEndDate = null;

                            if (planStartDate && plan.weeks && plan.weeks.length > 0) {
                                const startDate = new Date(planStartDate);
                                const totalWeeks = plan.total_weeks || plan.totalWeeks || plan.weeks.length;
                                const endDate = new Date(startDate);
                                endDate.setDate(startDate.getDate() + (totalWeeks * 7));
                                planEndDate = endDate.toISOString().split('T')[0];
                                console.log('📅 CheckinHistory (reload) - Plan period:', planStartDate, 'to', planEndDate, `(${totalWeeks} weeks)`);
                            }

                            // Load lại history với kế hoạch mới
                            let response;
                            if (plan && (plan.id || plan.plan_id)) {
                                const planId = plan.id || plan.plan_id;
                                console.log('🔍 CheckinHistory (reload) - Loading history for plan:', planId);
                                response = await progressService.getProgressByUserId(userId, { plan_id: planId });
                            } else {
                                console.log('🔍 CheckinHistory (reload) - Loading history without plan filter');
                                response = await progressService.getProgressByUserId(userId);
                            }

                            if (response && response.success && response.data) {
                                const apiHistory = response.data.map(entry => ({
                                    date: entry.date.split('T')[0],
                                    targetCigarettes: entry.target_cigarettes || 0,
                                    actualCigarettes: entry.actual_cigarettes || 0,
                                    initialCigarettes: entry.initial_cigarettes || getInitialCigarettesFromPlan(plan),
                                    cigarettesAvoided: entry.cigarettes_avoided || 0,
                                    moneySaved: entry.money_saved || 0,
                                    healthScore: entry.health_score || 0,
                                    notes: entry.notes || '',
                                    isFromApi: true
                                }));

                                // Tạo Map từ dữ liệu API để tra cứu nhanh
                                const historyMap = new Map();
                                apiHistory.forEach(entry => {
                                    historyMap.set(entry.date, entry);
                                });

                                // Tạo full history cho toàn bộ thời gian kế hoạch
                                console.log('🔍 CheckinHistory (reload) - planStartDate:', planStartDate);
                                console.log('🔍 CheckinHistory (reload) - planEndDate:', planEndDate);
                                const allDays = generateDaysArray(planStartDate, planEndDate);
                                console.log(`🔍 CheckinHistory (reload) - Generated ${allDays.length} days`);

                                const fullHistory = allDays.map(date => {
                                    if (historyMap.has(date)) {
                                        return historyMap.get(date);
                                    }

                                    // Tính mục tiêu cho ngày này dựa trên kế hoạch mới
                                    const getTargetForDate = (targetDate, targetPlan) => {
                                        if (!targetPlan || !targetPlan.weeks || (!targetPlan.startDate && !targetPlan.start_date)) {
                                            return 0;
                                        }

                                        const planStart = new Date(targetPlan.startDate || targetPlan.start_date);
                                        const dateToCheck = new Date(targetDate);
                                        const daysSinceStart = Math.floor((dateToCheck - planStart) / (1000 * 60 * 60 * 24));

                                        if (daysSinceStart < 0) {
                                            return getInitialCigarettesFromPlan(targetPlan);
                                        }

                                        let weekIndex = 0;
                                        let daysPassed = 0;

                                        for (let i = 0; i < targetPlan.weeks.length; i++) {
                                            if (daysSinceStart >= daysPassed && daysSinceStart < daysPassed + 7) {
                                                weekIndex = i;
                                                break;
                                            }
                                            daysPassed += 7;
                                        }

                                        if (weekIndex >= targetPlan.weeks.length) {
                                            weekIndex = targetPlan.weeks.length - 1;
                                        }

                                        const week = targetPlan.weeks[weekIndex];
                                        return week ? (week.target ?? week.amount ?? week.cigarettes ?? 0) : 0;
                                    };

                                    const targetForThisDay = getTargetForDate(date, plan);

                                    // Tạo empty entry cho ngày chưa có dữ liệu
                                    return createEmptyCheckin(date, getInitialCigarettesFromPlan(plan), targetForThisDay);
                                });

                                // Sắp xếp theo ngày tăng dần để ngày bắt đầu kế hoạch ở trang 1
                                fullHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                                setCheckinHistory(fullHistory);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error reloading checkin history:', error);
                    } finally {
                        setLoading(false);
                    }
                };

                loadCheckinHistory();
            }, 500);
        };

        // Lắng nghe sự kiện thay đổi kế hoạch
        window.addEventListener('localStorageChanged', handlePlanChange);

        return () => {
            window.removeEventListener('localStorageChanged', handlePlanChange);
        };
    }, []);

    // Lắng nghe sự kiện từ nút trong ProgressDashboard
    useEffect(() => {
        const handleToggleEvent = () => {
            console.log('Toggling sidebar from external button');
            setIsSidebarOpen(prevState => !prevState);
        };

        // Đăng ký lắng nghe sự kiện
        document.addEventListener('toggle-checkin-history', handleToggleEvent);

        // Cleanup function
        return () => {
            document.removeEventListener('toggle-checkin-history', handleToggleEvent);
        };
    }, []);

    // Bắt đầu chỉnh sửa
    const handleEdit = (entry) => {
        setEditingEntry(entry.date);
        // Lấy dữ liệu hiện tại từ entry để đảm bảo dữ liệu nhất quán
        setTempEditData({
            targetCigarettes: entry.targetCigarettes,
            actualCigarettes: entry.actualCigarettes,
            notes: entry.notes || '',
            // Lưu initialCigarettes vào tempEditData để dùng khi tính toán
            initialCigarettes: entry.initialCigarettes || 0
        });
    };

    // Hủy chỉnh sửa
    const handleCancelEdit = () => {
        setEditingEntry(null);
        setTempEditData({});
    };

    // Cập nhật giá trị khi chỉnh sửa
    const handleEditChange = (field, value) => {
        setTempEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Lưu thay đổi
    const handleSaveEdit = async (date) => {
        try {
            // Lấy giá trị initialCigarettes từ userPlan đã tải (được tải trong useEffect)
            let initialCigarettes = 0;

            // Sử dụng userPlan đã được lấy trong useEffect
            if (userPlan) {
                // Ưu tiên lấy từ các trường có thể chứa initialCigarettes trong userPlan
                if (userPlan.initialCigarettes) {
                    initialCigarettes = userPlan.initialCigarettes;
                    console.log('🔍 CheckinHistory - Using initialCigarettes from userPlan:', initialCigarettes);
                } else if (userPlan.initial_cigarettes) {
                    initialCigarettes = userPlan.initial_cigarettes;
                    console.log('🔍 CheckinHistory - Using initial_cigarettes from userPlan:', initialCigarettes);
                } else if (userPlan.dailyCigarettes) {
                    initialCigarettes = userPlan.dailyCigarettes;
                    console.log('🔍 CheckinHistory - Using dailyCigarettes from userPlan:', initialCigarettes);
                } else if (userPlan.daily_cigarettes) {
                    initialCigarettes = userPlan.daily_cigarettes;
                    console.log('🔍 CheckinHistory - Using daily_cigarettes from userPlan:', initialCigarettes);
                } else if (userPlan.weeks && userPlan.weeks.length > 0) {
                    // Lấy từ tuần đầu tiên
                    const firstWeek = userPlan.weeks[0];
                    initialCigarettes = firstWeek.amount || firstWeek.cigarettes ||
                        firstWeek.dailyCigarettes || firstWeek.daily_cigarettes ||
                        firstWeek.target || 0;
                    console.log('🔍 CheckinHistory - Using initialCigarettes from first week:', initialCigarettes);
                }
            }

            // Fallback: Nếu không thể lấy từ userPlan, thử từ entry hiện tại
            if (initialCigarettes === 0) {
                const currentEntry = checkinHistory.find(entry => entry.date === date);
                initialCigarettes = currentEntry?.initialCigarettes || 0;

                if (initialCigarettes > 0) {
                    console.log('🔍 CheckinHistory - Using initialCigarettes from current entry:', initialCigarettes);
                }
            }

            // Fallback: Thử lấy giá trị trực tiếp đã lưu trong localStorage
            if (initialCigarettes === 0) {
                const savedInitialCigs = localStorage.getItem('initialCigarettes');
                if (savedInitialCigs) {
                    initialCigarettes = parseInt(savedInitialCigs);
                    console.log('🔍 CheckinHistory - Using initialCigarettes from localStorage directly:', initialCigarettes);
                }
            }

            // Fallback cuối cùng: Thử lấy từ activePlan trong localStorage
            if (initialCigarettes === 0) {
                try {
                    const localPlan = localStorage.getItem('activePlan');
                    if (localPlan) {
                        const parsedPlan = JSON.parse(localPlan);

                        initialCigarettes = parsedPlan.initialCigarettes ||
                            parsedPlan.initial_cigarettes ||
                            parsedPlan.dailyCigarettes ||
                            parsedPlan.daily_cigarettes || 30;

                        console.log('🔍 CheckinHistory - Using initialCigarettes from activePlan:', initialCigarettes);
                    } else {
                        // Nếu không có plan, đặt giá trị mặc định (giống với DailyCheckin)
                        initialCigarettes = 30; // Sử dụng 30 như một giá trị mặc định hợp lý
                        console.log('🔍 CheckinHistory - No plan found, using default value:', initialCigarettes);
                    }
                } catch (e) {
                    console.error('Error parsing activePlan:', e);
                    initialCigarettes = 30; // Giá trị mặc định
                }
            }

            const updatedData = {
                ...tempEditData,
                initialCigarettes: initialCigarettes
            };

            console.log('🔍 CheckinHistory - Saving edit for date', date, 'with data:', updatedData);
            console.log('🔍 CheckinHistory - Using initialCigarettes:', initialCigarettes);

            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            // Kiểm tra xem entry này là trống hay đã có dữ liệu
            const currentEntry = checkinHistory.find(entry => entry.date === date);
            const isEmptyEntry = currentEntry?.isEmpty === true;

            let response;

            // Nếu là entry trống (chưa có trong DB), sử dụng createCheckin thay vì updateCheckin
            try {
                // Thêm plan_id vào dữ liệu để đảm bảo checkin được lưu cho đúng kế hoạch
                const dataWithPlanId = {
                    ...updatedData,
                    plan_id: userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id) : null
                };

                if (isEmptyEntry) {
                    console.log('🔍 CheckinHistory - Creating new checkin for date', date, 'with plan_id:', dataWithPlanId.plan_id);
                    response = await progressService.createCheckin(userId, date, dataWithPlanId);
                } else {
                    console.log('🔍 CheckinHistory - Updating existing checkin for date', date, 'with plan_id:', dataWithPlanId.plan_id);
                    response = await progressService.updateCheckinByUserId(userId, date, dataWithPlanId);
                }
            } catch (error) {
                console.error('❌ Error in save operation:', error);

                // Nếu cập nhật không thành công (404), thử tạo mới
                if (error.message && error.message.includes("404")) {
                    console.log('🔄 Falling back to creating new checkin due to 404 error');
                    const dataWithPlanId = {
                        ...updatedData,
                        plan_id: userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id) : null
                    };
                    response = await progressService.createCheckin(userId, date, dataWithPlanId);
                } else {
                    // Nếu là lỗi khác, ném lại lỗi để xử lý ở catch block bên ngoài
                    throw error;
                }
            }

            if (response && response.success) {
                // Lấy dữ liệu mới từ API response
                console.log('🔍 CheckinHistory - Calculating with initialCigarettes:', updatedData.initialCigarettes);

                // Tính toán lại các giá trị nếu API không trả về
                const initialCigs = updatedData.initialCigarettes; // Sử dụng giá trị mặc định nếu không có
                const actualCigs = updatedData.actualCigarettes || 0;

                const cigarettesAvoided = response.data?.cigarettes_avoided !== undefined
                    ? response.data.cigarettes_avoided
                    : Math.max(0, initialCigs - actualCigs);

                const moneySaved = response.data?.money_saved !== undefined
                    ? response.data.money_saved
                    : cigarettesAvoided * 1250; // Giả sử 1250 VND mỗi điếu

                const healthScore = response.data?.health_score !== undefined
                    ? response.data.health_score
                    : initialCigs > 0 ? Math.round((cigarettesAvoided / initialCigs) * 100) : 0;

                console.log('🔍 CheckinHistory - Calculated values:', {
                    initialCigs,
                    actualCigs,
                    cigarettesAvoided,
                    moneySaved,
                    healthScore
                });

                // Tạo đối tượng mới với dữ liệu đã cập nhật
                const newCheckinData = {
                    date: date,
                    targetCigarettes: updatedData.targetCigarettes,
                    actualCigarettes: updatedData.actualCigarettes,
                    notes: updatedData.notes,
                    initialCigarettes: updatedData.initialCigarettes,
                    cigarettesAvoided: cigarettesAvoided,
                    moneySaved: moneySaved,
                    healthScore: healthScore
                };

                // Cập nhật state bằng cách tạo một mảng hoàn toàn mới
                // để đảm bảo React nhận ra sự thay đổi và render lại
                setCheckinHistory(prev => {
                    const newHistory = prev.map(entry =>
                        entry.date === date ? newCheckinData : entry
                    );
                    console.log('🔍 State updated with new data:', newHistory.find(e => e.date === date));
                    return newHistory;
                });

                // Tạo đối tượng dữ liệu đầy đủ để lưu vào localStorage
                const updatedLocalData = {
                    date,
                    targetCigarettes: updatedData.targetCigarettes,
                    actualCigarettes: updatedData.actualCigarettes,
                    initialCigarettes: updatedData.initialCigarettes,
                    cigarettesAvoided: cigarettesAvoided,
                    moneySaved: moneySaved,
                    healthScore: healthScore,
                    notes: updatedData.notes
                };

                // Lưu vào localStorage với plan_id
                const planId = userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id).toString() : 'default';
                const localStorageKey = `checkin_${planId}_${date}`;
                localStorage.setItem(localStorageKey, JSON.stringify(updatedLocalData));
                console.log(`🔍 CheckinHistory - Saved to localStorage with key: ${localStorageKey}`);

                // Gọi callback cập nhật dashboard nếu có - với dữ liệu đã tính toán mới
                if (onProgressUpdate && date === new Date().toISOString().split('T')[0]) {
                    onProgressUpdate({
                        ...newCheckinData,
                        date
                    });
                    console.log('🔄 Đã gọi onProgressUpdate với dữ liệu mới:', newCheckinData);
                }

                // Reset editing
                setEditingEntry(null);
                setTempEditData({});

                // Force update component để đảm bảo UI được render lại với dữ liệu mới
                setTimeout(() => {
                    forceUpdate();
                    console.log('🔄 Force update component sau khi cập nhật dữ liệu');
                }, 0);

                // Hiển thị thông báo thành công
                setToast({
                    show: true,
                    message: 'Cập nhật thành công!',
                    type: 'success'
                });
            } else {
                throw new Error(response?.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            console.error('❌ Error saving edit:', err);

            // Hiển thị thông báo lỗi
            setToast({
                show: true,
                message: `Lỗi: ${err.message}`,
                type: 'error'
            });
        }

        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Xóa dữ liệu checkin
    const handleDeleteEntry = async (date) => {
        // Hiển thị xác nhận trước khi xóa
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu check-in ngày ${formatDisplayDate(date)}?`);

        if (!confirmDelete) {
            return;
        }

        try {
            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in');
            }

            // Tìm entry hiện tại
            const currentEntry = checkinHistory.find(entry => entry.date === date);

            // Nếu là entry trống (chưa có dữ liệu thực sự), chỉ cần reset về trạng thái trống
            if (currentEntry?.isEmpty || currentEntry?.actualCigarettes === null) {
                // Reset entry về trạng thái trống
                const resetEntry = createEmptyCheckin(date, currentEntry?.initialCigarettes || 30, currentEntry?.targetCigarettes || 0);

                setCheckinHistory(prev => prev.map(entry =>
                    entry.date === date ? resetEntry : entry
                ));

                // Xóa khỏi localStorage
                const planId = userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id).toString() : 'default';
                const localStorageKey = `checkin_${planId}_${date}`;
                localStorage.removeItem(localStorageKey);
                console.log(`🗑️ Removed localStorage key: ${localStorageKey}`);

                setToast({
                    show: true,
                    message: 'Đã xóa dữ liệu check-in!',
                    type: 'success'
                });

                setTimeout(() => {
                    setToast(prev => ({ ...prev, show: false }));
                }, 3000);

                return;
            }

            // Nếu có dữ liệu thực sự, gọi API để xóa
            console.log('🗑️ Deleting checkin for date:', date);

            try {
                // Thử xóa từ API trước
                const deleteResponse = await progressService.deleteCheckin(date);

                if (deleteResponse && deleteResponse.success) {
                    console.log('✅ Successfully deleted from API');
                } else {
                    console.warn('⚠️ API delete response not successful, but continuing with local cleanup');
                }
            } catch (apiError) {
                console.warn('⚠️ Error deleting from API:', apiError);
                // Tiếp tục với việc xóa local vì có thể API không hỗ trợ delete hoặc entry không tồn tại trong DB
            }

            // Reset entry về trạng thái trống (với mục tiêu được tính lại từ kế hoạch)
            let targetForThisDay = 0;
            if (userPlan && userPlan.weeks && (userPlan.startDate || userPlan.start_date)) {
                const planStartDate = new Date(userPlan.startDate || userPlan.start_date);
                const targetDate = new Date(date);
                const daysSincePlanStart = Math.floor((targetDate - planStartDate) / (1000 * 60 * 60 * 24));

                if (daysSincePlanStart >= 0 && userPlan.weeks.length > 0) {
                    let weekIndex = Math.floor(daysSincePlanStart / 7);
                    if (weekIndex >= userPlan.weeks.length) {
                        weekIndex = userPlan.weeks.length - 1;
                    }
                    const week = userPlan.weeks[weekIndex];
                    targetForThisDay = week ? (week.target ?? week.amount ?? week.cigarettes ?? 0) : 0;
                }
            }

            const resetEntry = createEmptyCheckin(date, currentEntry?.initialCigarettes || 30, targetForThisDay);

            // Cập nhật state
            setCheckinHistory(prev => prev.map(entry =>
                entry.date === date ? resetEntry : entry
            ));

            // Xóa khỏi localStorage
            const planId = userPlan && (userPlan.id || userPlan.plan_id) ? (userPlan.id || userPlan.plan_id).toString() : 'default';
            const localStorageKey = `checkin_${planId}_${date}`;
            localStorage.removeItem(localStorageKey);
            console.log(`🗑️ Removed localStorage key: ${localStorageKey}`);

            // Gọi callback để cập nhật dashboard nếu xóa dữ liệu ngày hôm nay
            if (onProgressUpdate && date === new Date().toISOString().split('T')[0]) {
                onProgressUpdate(null); // Truyền null để báo hiệu đã xóa dữ liệu
                console.log('🔄 Called onProgressUpdate with null (data deleted)');
            }

            // Hiển thị thông báo thành công
            setToast({
                show: true,
                message: 'Đã xóa dữ liệu check-in!',
                type: 'success'
            });

        } catch (err) {
            console.error('❌ Error deleting entry:', err);

            setToast({
                show: true,
                message: `Lỗi khi xóa: ${err.message}`,
                type: 'error'
            });
        }

        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Format date to display
    const formatDisplayDate = (dateStr) => {
        const date = new Date(dateStr);
        // Format: "Thứ 2, 01/08/2025"
        const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
        const dayName = days[date.getDay()];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${dayName}, ${day}/${month}/${year}`;
    };

    // Kiểm tra xem ngày đó có phải là hôm nay không
    const isToday = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    // Pagination logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = checkinHistory.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(checkinHistory.length / entriesPerPage);

    // Change page
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Tải lại dữ liệu của ngày hiện tại từ API (không sử dụng await để không chặn UI)
    const refreshTodayData = (userId) => {
        const today = new Date().toISOString().split('T')[0];

        // Thêm plan_id filter nếu có
        const currentPlan = userPlan;
        const queryParams = { date: today };
        if (currentPlan && (currentPlan.id || currentPlan.plan_id)) {
            queryParams.plan_id = currentPlan.id || currentPlan.plan_id;
        }

        // Sử dụng Promise không await để không chặn UI
        progressService.getProgressByUserId(userId, queryParams)
            .then(response => {
                if (response && response.success && response.data && response.data.length > 0) {
                    const todayEntry = response.data.find(item => item.date.split('T')[0] === today);

                    if (todayEntry) {
                        // Chuyển đổi dữ liệu từ API thành định dạng cho UI
                        const formattedEntry = {
                            date: today,
                            targetCigarettes: todayEntry.target_cigarettes || 0,
                            actualCigarettes: todayEntry.actual_cigarettes || 0,
                            initialCigarettes: todayEntry.initial_cigarettes || 0,
                            cigarettesAvoided: todayEntry.cigarettes_avoided || 0,
                            moneySaved: todayEntry.money_saved || 0,
                            healthScore: todayEntry.health_score || 0,
                            notes: todayEntry.notes || ''
                        };

                        // Cập nhật dữ liệu ngày hôm nay trong danh sách
                        setCheckinHistory(prev => prev.map(entry =>
                            entry.date === today ? formattedEntry : entry
                        ));

                        // Cập nhật localStorage với plan_id
                        const currentPlan = userPlan;
                        const planId = currentPlan && (currentPlan.id || currentPlan.plan_id) ?
                            (currentPlan.id || currentPlan.plan_id).toString() : 'default';
                        const localStorageKey = `checkin_${planId}_${today}`;
                        localStorage.setItem(localStorageKey, JSON.stringify(formattedEntry));
                        console.log(`✅ Refreshed today data from API and saved to localStorage with key: ${localStorageKey}`);

                        console.log('✅ Refreshed today data from API:', todayEntry);
                    }
                }
            })
            .catch(err => {
                console.error('❌ Error refreshing today data:', err);
                // Không hiển thị lỗi cho người dùng khi này vì đây là hàm phụ
            });
    };

    if (loading) {
        return (
            <div className="checkin-history-wrapper">
                <button className="toggle-history-sidebar" disabled>
                    <FaCalendarAlt className="sidebar-toggle-icon" />
                    <span>Lịch sử cai thuốc</span>
                </button>
                <div className="checkin-history loading">Đang tải lịch sử check-in...</div>
            </div>
        );
    }

    if (error && checkinHistory.length === 0) {
        return (
            <div className="checkin-history-wrapper">
                <button
                    className="toggle-history-sidebar"
                    onClick={toggleSidebar}
                >
                    <FaCalendarAlt className="sidebar-toggle-icon" />
                    <span>Lịch sử cai thuốc</span>
                </button>
                <div className={`checkin-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="checkin-history error">
                        <div className="history-header">
                            <h2 className="history-title">
                                <FaCalendarAlt className="title-icon" />
                                Lịch sử cai thuốc
                            </h2>
                            <button
                                className="close-sidebar-btn"
                                onClick={toggleSidebar}
                                title="Đóng sidebar"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="error-message">{error}</div>
                        <button
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (checkinHistory.length === 0) {
        return (
            <div className="checkin-history-wrapper">
                <button
                    className="toggle-history-sidebar"
                    onClick={toggleSidebar}
                >
                    <FaCalendarAlt className="sidebar-toggle-icon" />
                    <span>Lịch sử cai thuốc</span>
                </button>
                <div className={`checkin-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="checkin-history empty">
                        <div className="history-header">
                            <h2 className="history-title">
                                <FaCalendarAlt className="title-icon" />
                                Lịch sử cai thuốc
                            </h2>
                            <button
                                className="close-sidebar-btn"
                                onClick={toggleSidebar}
                                title="Đóng sidebar"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="empty-state">
                            <FaCalendarAlt className="empty-icon" />
                            <h3>Chưa có dữ liệu check-in</h3>
                            <p>Bạn chưa ghi nhận ngày nào. Hãy bắt đầu với ngày hôm nay!</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Hàm tải lại toàn bộ trang (giống nhấn F5)
    const handleRefresh = () => {
        // Hiển thị thông báo trước khi tải lại
        setToast({
            show: true,
            message: 'Đang tải lại trang...',
            type: 'info'
        });

        // Đợi một chút để hiện thông báo trước khi tải lại trang
        setTimeout(() => {
            // Tải lại trang (tương đương với nhấn F5)
            window.location.reload();
        }, 500);
    };

    return (
        <div className="checkin-history-wrapper">
            {/* Nút toggle sidebar - chỉ hiển thị ở mobile hoặc khi cần thiết */}
            <button
                className="toggle-history-sidebar compact-button"
                onClick={toggleSidebar}
                title={isSidebarOpen ? "Ẩn lịch sử cai thuốc" : "Hiện lịch sử cai thuốc"}
                style={{ display: 'none' }} /* Ẩn nút này vì chúng ta đã có nút ở ProgressDashboard */
            >
                <FaCalendarAlt className="sidebar-toggle-icon" />
                <span>Lịch sử</span>
            </button>

            {/* Sidebar chứa lịch sử check-in */}
            <div className={`checkin-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="checkin-history">
                    <div className="history-header">
                        <h2 className="history-title">
                            <FaCalendarAlt className="title-icon" />
                            Lịch sử cai thuốc
                        </h2>

                        <div className="history-header-buttons">
                            <button
                                className="refresh-btn"
                                onClick={handleRefresh}
                                title="Tải lại trang (F5)"
                                disabled={loading}
                            >
                                <FaSync className="refresh-icon" />
                            </button>
                            <button
                                className="close-sidebar-btn"
                                onClick={toggleSidebar}
                                title="Đóng sidebar"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="warning-message">
                            {error}
                        </div>
                    )}

                    <div className="history-table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Ngày</th>
                                    <th>Mục tiêu</th>
                                    <th>Đã hút</th>
                                    <th>Đã tránh</th>
                                    <th>Điểm sức khỏe</th>
                                    <th>Tiết kiệm</th>
                                    <th>Ghi chú</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEntries.map((entry) => (
                                    <tr
                                        key={`${entry.date}_${entry.actualCigarettes}_${entry.cigarettesAvoided}`}
                                        className={`${isToday(entry.date) ? 'today-row' : ''} ${entry.isEmpty ? 'empty-checkin-row' : ''}`}
                                    >
                                        <td className="date-cell">
                                            {formatDisplayDate(entry.date)}
                                            {isToday(entry.date) && <span className="today-badge">Hôm nay</span>}
                                        </td>

                                        <td className="target-cell">
                                            {editingEntry === entry.date ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={tempEditData.targetCigarettes}
                                                    onChange={(e) => handleEditChange('targetCigarettes', parseInt(e.target.value) || 0)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                <span>{entry.targetCigarettes} điếu</span>
                                            )}
                                        </td>

                                        <td className="actual-cell">
                                            {editingEntry === entry.date ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={tempEditData.actualCigarettes || 0}
                                                    onChange={(e) => handleEditChange('actualCigarettes', parseInt(e.target.value) || 0)}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                <span
                                                    className={
                                                        entry.actualCigarettes === null ? 'empty-value' :
                                                            entry.actualCigarettes <= entry.targetCigarettes ? 'success' : 'warning'
                                                    }
                                                >
                                                    {entry.actualCigarettes === null ? 'N/A' : `${entry.actualCigarettes} điếu`}
                                                </span>
                                            )}
                                        </td>

                                        <td className="avoided-cell">
                                            <span>
                                                {entry.cigarettesAvoided === null ? 'N/A' : `${entry.cigarettesAvoided} điếu`}
                                            </span>
                                        </td>
                                        <td className="health-cell">
                                            {entry.healthScore === null ? (
                                                <span className="empty-value">N/A</span>
                                            ) : (
                                                <div className="health-score">
                                                    <div
                                                        className="health-bar"
                                                        style={{ width: `${entry.healthScore}%` }}
                                                    ></div>
                                                    <span className="health-value">{entry.healthScore}</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="money-cell">
                                            {entry.moneySaved === null ? 'N/A' : `${(entry.moneySaved / 1000).toFixed(1)}k`}
                                        </td>

                                        <td className="notes-cell">
                                            {editingEntry === entry.date ? (
                                                <textarea
                                                    value={tempEditData.notes || ''}
                                                    onChange={(e) => handleEditChange('notes', e.target.value)}
                                                    className="edit-textarea"
                                                    rows="2"
                                                    placeholder="Ghi chú..."
                                                />
                                            ) : (
                                                <span>{entry.notes || '-'}</span>
                                            )}
                                        </td>

                                        <td className="actions-cell">
                                            {editingEntry === entry.date ? (
                                                <div className="edit-actions">
                                                    <button
                                                        className="save-btn"
                                                        onClick={() => handleSaveEdit(entry.date)}
                                                        title="Lưu thay đổi"
                                                    >
                                                        <FaSave />
                                                    </button>
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={handleCancelEdit}
                                                        title="Hủy"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="action-buttons">
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => handleEdit(entry)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    {/* Chỉ hiển thị nút xóa nếu có dữ liệu thực sự (không phải entry trống) */}
                                                    {!entry.isEmpty && entry.actualCigarettes !== null && (
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDeleteEntry(entry.date)}
                                                            title="Xóa dữ liệu check-in"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                <FaChevronLeft />
                            </button>

                            <div className="pagination-info">
                                Trang {currentPage} / {totalPages}
                            </div>

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}

                    {/* Toast notification */}
                    {toast.show && (
                        <div className={`toast-notification ${toast.type}`}>
                            {toast.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckinHistory;
