/**
 * PROGRESS PAGE - TRANG TIẾN TRÌNH CAI THUỐC CHÍNH
 * 
 * Trang này kết hợp tất cả các components liên quan đến theo dõi tiến trình:
 * 1. DailyCheckin - Form check-in hằng ngày
 * 2. ProgressDashboard - Hiển thị các metrics tổng quan
 * 3. CheckinHistory - Sidebar lịch sử check-in với CRUD operations
 * 4. ActivePlanSelector - Chuyển đổi giữa các kế hoạch cai thuốc
 * 5. ResetCheckinData - Xóa/reset dữ liệu check-in
 * 
 * Data Flow:
 * - CheckinHistory nhận onProgressUpdate prop để sync với ProgressDashboard
 * - ActivePlanSelector trigger reload data khi chuyển kế hoạch
 * - Tất cả components đều đồng bộ qua localStorage và custom events
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DailyCheckin from '../components/DailyCheckin';
import ProgressDashboard from '../components/ProgressDashboard';
import CheckinHistory from '../components/CheckinHistory'; // SIDEBAR LỊCH SỬ CHECK-IN VỚI CRUD
import ResetCheckinData from '../components/ResetCheckinData';
import ActivePlanSelector from '../components/ActivePlanSelector';
import { FaCalendarCheck, FaLeaf, FaCoins, FaHeart } from 'react-icons/fa';
import progressService from '../services/progressService';
import { getUserActivePlan } from '../services/quitPlanService';
import './Progress.css';
import '../styles/DailyCheckin.css';
import '../styles/ProgressDashboard.css';
import '../styles/ProgressDashboard-update.css';

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTimeFilter, setActiveTimeFilter] = useState('30 ngày');
  const [showCompletionDashboard, setShowCompletionDashboard] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [actualProgress, setActualProgress] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [hasPlan, setHasPlan] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Thêm state isLoading
  // Thêm state để lưu trữ các thống kê dashboard
  const [dashboardStats, setDashboardStats] = useState({
    noSmokingDays: 0,
    savedCigarettes: 0,
    savedMoney: 0,
    healthProgress: 0
  });

  // Removed health benefits function - now handled by ProgressDashboard component

  /**
   * LOAD USER PLAN VÀ PROGRESS DATA
   * Function chính để tải dữ liệu kế hoạch và tiến trình từ API/localStorage
   */
  useEffect(() => {
    loadUserPlanAndProgress();

    // Lắng nghe thay đổi từ JourneyStepper
    const handleStorageChange = (event) => {
      if (event.detail?.key === 'activePlan') {
        loadUserPlanAndProgress();
      }
    };

    window.addEventListener('localStorageChanged', handleStorageChange);

    // Force refresh of data after component mounts to ensure we have latest data
    const refreshTimer = setTimeout(() => {
      recalculateStatistics();

      if (!actualProgress || actualProgress.length === 0) {
        loadUserPlanAndProgress();
      }
    }, 1000);

    // Thử load dashboard stats từ localStorage trước
    const savedStats = localStorage.getItem('dashboardStats');
    let shouldRecalculate = true;

    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);

        // Kiểm tra xem dữ liệu có hợp lệ không
        if (parsedStats && parsedStats.savedCigarettes !== undefined) {
          setDashboardStats(parsedStats);
          shouldRecalculate = false;
        }
      } catch (error) {
        console.error("Lỗi khi parse dashboard stats:", error);
        shouldRecalculate = true;
      }
    }

    // Lấy dữ liệu từ API
    const fetchAPIData = async () => {
      try {
        // Lấy thống kê từ API
        const statsResponse = await progressService.getProgressStats();
        if (statsResponse.data) {
          // Cập nhật bổ sung thông tin từ API
          setDashboardStats(prevStats => ({
            ...prevStats,
            maxStreak: statsResponse.data.max_streak || 0,
            currentStreak: statsResponse.data.current_streak || 0,
            totalCheckins: statsResponse.data.total_checkins || 0,
            goalsMetRate: statsResponse.data.success_rate || 0,
            healthProgress: statsResponse.data.avg_health_score || 0
          }));
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu từ API:", error);
      }
    };

    fetchAPIData();

    // Nếu không có dữ liệu từ localStorage hoặc dữ liệu không hợp lệ, tính toán lại
    if (shouldRecalculate) {
      const timer = setTimeout(() => {
        recalculateStatistics();
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(refreshTimer);
        window.removeEventListener('localStorageChanged', handleStorageChange);
      };
    }

    // Cleanup function khi component unmount
    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('localStorageChanged', handleStorageChange);
    };
  }, []);

  // Reset state khi user thay đổi để tránh dính data từ user trước
  useEffect(() => {
    if (user) {
      // Reset tất cả state về trạng thái ban đầu
      setUserPlan(null);
      setUserProgress([]);
      setActualProgress([]);
      setMoodData([]);
      setHasPlan(false);
      setIsLoading(true);
      setDashboardStats({
        noSmokingDays: 0,
        savedCigarettes: 0,
        savedMoney: 0,
        healthProgress: 0
      });

      // Load lại dữ liệu cho user mới
      loadUserPlanAndProgress();
      console.log('🔄 Reset Progress state cho user mới:', user.id);
    }
  }, [user?.id]); // Chỉ chạy khi user ID thay đổi

  const loadUserPlanAndProgress = async () => {
    setIsLoading(true);

    // Tìm token theo đúng key như JourneyStepper
    const auth_token = localStorage.getItem('nosmoke_token') ||
      sessionStorage.getItem('nosmoke_token') ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token');

    if (!auth_token) {
      setUserPlan(null);
      setHasPlan(false);
      setIsLoading(false);
      return;
    }

    try {
      // Ưu tiên localStorage trước (kế hoạch được chọn bởi user)
      const savedPlan = localStorage.getItem('activePlan');
      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);
          console.log("✅ Found selected plan in localStorage:", parsedPlan.plan_name || parsedPlan.planName);

          setUserPlan(parsedPlan);
          setHasPlan(true);

          await loadActualProgressFromCheckins(parsedPlan);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error("❌ Lỗi khi parse localStorage:", error);
        }
      }

      // Fallback: Lấy từ DATABASE nếu không có trong localStorage
      const response = await getUserActivePlan();

      if (response && response.success && response.plan) {
        const planFromDatabase = response.plan;
        console.log("✅ Loaded default plan from database:", planFromDatabase.plan_name);

        // Đồng bộ ngay vào localStorage
        localStorage.setItem('activePlan', JSON.stringify(planFromDatabase));

        // Set state với kế hoạch từ database
        setUserPlan(planFromDatabase);
        setHasPlan(true);

        // Load progress và kết thúc
        await loadActualProgressFromCheckins(planFromDatabase);
        setIsLoading(false);
        return;
      } else {

        // Xóa localStorage cũ nếu database không có và localStorage có lỗi
        localStorage.removeItem('activePlan');
        localStorage.removeItem('quitPlanCompletion');

        setUserPlan(null);
        setHasPlan(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tải kế hoạch từ database:", error);

      // Fallback sang localStorage nếu API lỗi
      const savedPlan = localStorage.getItem('activePlan');
      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);
          console.log("✅ Fallback: Using plan from localStorage");

          setUserPlan(parsedPlan);
          setHasPlan(true);
          await loadActualProgressFromCheckins(parsedPlan);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error("❌ Lỗi khi parse localStorage:", error);
        }
      }

      setUserPlan(null);
      setHasPlan(false);
      setIsLoading(false);
    }
  };

  const getActivePlan = () => {
    // Kiểm tra nếu có kế hoạch đang thực hiện trong localStorage
    try {
      const savedPlan = localStorage.getItem('activePlan');
      if (savedPlan) {
        const parsedPlan = JSON.parse(savedPlan);
        if (parsedPlan && Array.isArray(parsedPlan.weeks) && parsedPlan.weeks.length > 0) {
          console.log("Đã tìm thấy kế hoạch active hợp lệ");
          return parsedPlan;
        } else {
          console.warn("Tìm thấy kế hoạch active nhưng không hợp lệ");
        }
      } else {
        console.log("Không tìm thấy kế hoạch active trong localStorage");
      }
    } catch (error) {
      console.error('Error loading saved plan:', error);
    }

    // Trả về null thay vì kế hoạch mặc định để phân biệt rõ ràng
    console.log("Không có kế hoạch thực tế - trả về null");
    return null;
  };

  // Hàm tạo kế hoạch mặc định chỉ khi cần
  const getDefaultPlan = () => {
    return {
      name: "Kế hoạch mặc định",
      startDate: new Date().toISOString().split('T')[0],
      weeks: [
        { week: 1, amount: 22, phase: "Thích nghi" },
        { week: 2, amount: 17, phase: "Thích nghi" },
        { week: 3, amount: 12, phase: "Tăng tốc" },
        { week: 4, amount: 8, phase: "Tăng tốc" },
        { week: 5, amount: 5, phase: "Hoàn thiện" },
        { week: 6, amount: 2, phase: "Hoàn thiện" },
        { week: 7, amount: 0, phase: "Mục tiêu đạt được" }
      ],
      initialCigarettes: 22
    };
  };
  const loadActualProgressFromCheckins = async (providedActivePlan = null) => {
    const actualData = [];
    const today = new Date();

    // Tìm ngày bắt đầu kế hoạch từ nhiều nguồn (ưu tiên userPlan từ database)
    let planStartDate = null;
    let activePlan = providedActivePlan;

    try {
      // Nguồn 1: userPlan từ database (ưu tiên cao nhất)
      if (userPlan?.start_date) {
        planStartDate = new Date(userPlan.start_date);
      }
      // Nguồn 2: providedActivePlan parameter
      else if (providedActivePlan?.startDate) {
        planStartDate = new Date(providedActivePlan.startDate);
      }
      // Nguồn 3: localStorage activePlan
      else {
        const activePlanData = localStorage.getItem('activePlan');
        if (activePlanData) {
          activePlan = JSON.parse(activePlanData);
          if (activePlan?.startDate) {
            planStartDate = new Date(activePlan.startDate);
          } else if (activePlan?.start_date) {
            planStartDate = new Date(activePlan.start_date);
          }
        }
      }
    } catch (error) {
      console.error('❌ Lỗi khi đọc ngày bắt đầu:', error);
    }

    // Nếu vẫn không có ngày bắt đầu, sử dụng hôm nay (nhưng log warning)
    if (!planStartDate || isNaN(planStartDate.getTime())) {
      planStartDate = new Date();
      console.warn("⚠️ No valid plan start date found, using today");
    }

    // Tạo bảng tra cứu mục tiêu hàng ngày từ kế hoạch
    const dailyTargets = {};
    if (activePlan && Array.isArray(activePlan.weeks) && activePlan.weeks.length > 0) {
      const startDate = new Date(activePlan.startDate || new Date());
      activePlan.weeks.forEach((week, weekIndex) => {
        // Mỗi tuần có 7 ngày
        for (let day = 0; day < 7; day++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (weekIndex * 7) + day);
          const dateStr = date.toISOString().split('T')[0];
          dailyTargets[dateStr] = week.amount;
        }
      });
      console.log("Created daily targets lookup table");
    }

    // Thử load TẤT CẢ dữ liệu từ DATABASE trước
    let databaseData = {};
    try {
      // Sử dụng getCurrentUserId thay vì tìm manual
      const { getCurrentUserId } = await import('../utils/userUtils');
      const userId = getCurrentUserId();

      if (userId) {
        console.log(`📊 Loading progress data for user ${userId}...`);
        const response = await fetch(`/api/progress/${userId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            // Chuyển đổi thành object với key là date để tra cứu nhanh
            result.data.forEach(item => {
              const dateStr = item.date.split('T')[0];
              databaseData[dateStr] = item;
            });
            console.log(`✅ Loaded ${result.data.length} records from database`);
          }
        }
      }
    } catch (dbError) {
      // Không cần log lỗi này
    }

    // Tính số ngày từ khi bắt đầu kế hoạch đến hôm nay
    const daysSincePlanStart = Math.floor((today - planStartDate) / (1000 * 60 * 60 * 24));
    const maxDaysToLoad = Math.max(0, daysSincePlanStart + 1);

    // Lấy tất cả ngày có trong database trước
    const databaseDates = Object.keys(databaseData).sort();

    // Tạo danh sách các ngày cần xử lý (từ database + từ plan)
    const datesToProcess = new Set();

    // Thêm tất cả ngày từ database
    databaseDates.forEach(dateStr => datesToProcess.add(dateStr));

    // Thêm các ngày từ kế hoạch (từ startDate đến hôm nay)
    for (let i = 0; i <= daysSincePlanStart; i++) {
      const date = new Date(planStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      datesToProcess.add(dateStr);
    }

    const sortedDates = Array.from(datesToProcess).sort();

    // Duyệt qua tất cả các ngày cần xử lý
    sortedDates.forEach(dateStr => {
      try {
        const dateObj = new Date(dateStr);

        // Chỉ xử lý dữ liệu nếu ngày đó >= ngày bắt đầu kế hoạch
        if (dateObj >= planStartDate) {
          let checkinFound = false;

          // Kiểm tra trong database data trước (ưu tiên database)
          if (databaseData[dateStr]) {
            const dbData = databaseData[dateStr];
            const targetCigs = dbData.target_cigarettes || dailyTargets[dateStr] ||
              (activePlan?.initialCigarettes || 0);

            actualData.push({
              date: dateStr,
              actualCigarettes: dbData.actual_cigarettes,
              targetCigarettes: targetCigs,
              cigarettes_avoided: dbData.cigarettes_avoided, // Thêm cigarettes_avoided từ database
              mood: dbData.mood,
              achievements: dbData.achievements || [],
              challenges: dbData.challenges || [],
              source: 'database' // Đánh dấu nguồn dữ liệu
            });

            console.log(`✅ DATABASE: ${dateStr} -> actual: ${dbData.actual_cigarettes}, avoided: ${dbData.cigarettes_avoided}`);
            checkinFound = true;
          } else {
            // Fallback: Load từ localStorage nếu không tìm thấy trong database
            const checkinData = localStorage.getItem(`checkin_${dateStr}`);
            if (checkinData) {
              const data = JSON.parse(checkinData);

              const targetCigs = data.targetCigarettes || dailyTargets[dateStr] ||
                (activePlan?.initialCigarettes || 0);

              actualData.push({
                date: dateStr,
                actualCigarettes: data.actualCigarettes,
                targetCigarettes: targetCigs,
                mood: data.mood,
                achievements: data.achievements || [],
                challenges: data.challenges || [],
                source: 'localStorage' // Đánh dấu nguồn dữ liệu
              });
              checkinFound = true;
            }
          }

          // Nếu vẫn không có dữ liệu nhưng có mục tiêu, thêm mục tiêu vào
          if (!checkinFound && dailyTargets[dateStr] !== undefined) {
            actualData.push({
              date: dateStr,
              actualCigarettes: null,
              targetCigarettes: dailyTargets[dateStr],
              mood: null
            });
          }
        }
      } catch (error) {
        console.error(`Error processing data for dateStr ${dateStr}:`, error);
      }
    }); // Đóng forEach

    // Đảm bảo dữ liệu được sắp xếp theo ngày tăng dần
    actualData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Log thống kê nguồn dữ liệu
    const databaseCount = actualData.filter(item => item.source === 'database').length;
    const localStorageCount = actualData.filter(item => item.source === 'localStorage').length;
    if (databaseCount > 0 || localStorageCount > 0) {
      console.log(`📊 Data sources: ${databaseCount} from database, ${localStorageCount} from localStorage`);
    }

    // Fix: Chuyển đổi định dạng dữ liệu cho phù hợp với QuitProgressChart
    const formattedActualData = actualData.map(item => ({
      date: item.date,
      actualCigarettes: item.actualCigarettes,
      targetCigarettes: item.targetCigarettes,
      cigarettes_avoided: item.cigarettes_avoided, // Đảm bảo cigarettes_avoided được pass qua
      mood: item.mood,
      // Các trường khác nếu cần
      achievements: item.achievements,
      challenges: item.challenges,
      source: item.source
    }));

    console.log(`Loaded ${formattedActualData.length} progress records`);
    setActualProgress(formattedActualData);

    // Thêm dữ liệu từ API nếu người dùng đã đăng nhập
    try {
      const auth_token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (auth_token) {
        const apiProgress = await progressService.getUserProgress();
        if (apiProgress && apiProgress.data && Array.isArray(apiProgress.data)) {

          // Tạo map của dữ liệu hiện có theo ngày
          const existingDataMap = {};
          formattedActualData.forEach(item => {
            existingDataMap[item.date] = item;
          });

          // Thêm hoặc cập nhật dữ liệu từ API
          apiProgress.data.forEach(apiItem => {
            if (existingDataMap[apiItem.date]) {
              // Cập nhật dữ liệu hiện có
              const existingItem = existingDataMap[apiItem.date];
              existingItem.actualCigarettes = apiItem.actualCigarettes;
              if (!existingItem.targetCigarettes || existingItem.targetCigarettes === 0) {
                existingItem.targetCigarettes = apiItem.targetCigarettes;
              }
            } else {
              // Thêm mới
              formattedActualData.push({
                date: apiItem.date,
                actualCigarettes: apiItem.actualCigarettes,
                targetCigarettes: apiItem.targetCigarettes || dailyTargets[apiItem.date] || 0,
                mood: null
              });
            }
          });

          // Sắp xếp lại
          formattedActualData.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu từ API:", error);
    }

    console.log(`Final: ${formattedActualData.length} progress records loaded`);
    setActualProgress(formattedActualData);
  };

  // Hàm helper tính target cho ngày cụ thể dựa trên kế hoạch
  const calculateTargetForDate = (date, plan) => {
    if (!plan || !plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
      return 0;
    }

    const planStartDate = plan.start_date || plan.startDate;
    if (!planStartDate) {
      // Nếu không có start date, lấy target của tuần đầu tiên
      return plan.weeks[0]?.amount || plan.weeks[0]?.target || plan.weeks[0]?.cigarettes || 0;
    }

    try {
      const targetDate = new Date(date);
      const startDate = new Date(planStartDate);
      const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysDiff / 7) + 1;

      if (weekNumber > 0 && weekNumber <= plan.weeks.length) {
        const weekPlan = plan.weeks[weekNumber - 1];
        return weekPlan?.amount || weekPlan?.target || weekPlan?.cigarettes || weekPlan?.dailyCigarettes || 0;
      }

      // Nếu vượt quá kế hoạch, trả về 0
      if (weekNumber > plan.weeks.length) {
        return 0;
      }

      // Nếu trước khi bắt đầu kế hoạch, trả về target tuần đầu
      return plan.weeks[0]?.amount || plan.weeks[0]?.target || plan.weeks[0]?.cigarettes || 0;
    } catch (error) {
      console.error("Error calculating target for date:", error);
      return 0;
    }
  };

  // Handle plan change from ActivePlanSelector
  const handlePlanChange = async (selectedPlan) => {
    console.log('🔄 Progress - Plan changed to:', selectedPlan.plan_name || selectedPlan.planName);
    console.log('🔄 Switching to plan with ID:', selectedPlan.id);

    // Update userPlan state immediately
    setUserPlan(selectedPlan);
    setHasPlan(true);

    // Clear previous stats temporarily to show loading state
    setDashboardStats({
      noSmokingDays: 0,
      savedCigarettes: 0,
      savedMoney: 0,
      healthProgress: 0
    });

    // Reload progress data for the new plan
    setIsLoading(true);
    try {
      // Load progress data (which includes checkin history)
      await loadActualProgressFromCheckins(selectedPlan);

      // Force recalculate statistics with new plan data
      console.log('🔄 Recalculating stats for new plan...');
      setTimeout(() => {
        recalculateStatistics();
      }, 100); // Small delay to ensure state updates

    } catch (error) {
      console.error('❌ Error loading progress for new plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * XỬ LÝ CẬP NHẬT TIẾN TRÌNH TỪ CHECKINHISTORY VÀ DAILYCHECKIN
   * Callback function được truyền cho CheckinHistory component
   * Khi user chỉnh sửa/xóa data trong CheckinHistory, function này sẽ:
   * 1. Reload toàn bộ progress data
   * 2. Recalculate statistics cho dashboard
   * @param {object} newProgress - Dữ liệu progress mới (hoặc null nếu xóa)
   */
  const handleProgressUpdate = async (newProgress) => {
    console.log('Progress updated, reloading all data...');

    // Thay vì load riêng từ localStorage, gọi lại loadActualProgressFromCheckins
    // để đảm bảo có đầy đủ dữ liệu từ cả database và localStorage
    await loadActualProgressFromCheckins();

    // Tính toán lại thống kê
    setTimeout(() => {
      recalculateStatistics();
    }, 100);
  };

  /**
   * XỬ LÝ CẬP NHẬT TÂM TRẠNG TỪ MOOD TRACKING
   * @param {object} newMoodData - Dữ liệu tâm trạng mới
   */
  const handleMoodUpdate = (newMoodData) => {
    // Có thể thêm logic cập nhật mood data ở đây nếu cần
    setMoodData(prev => [...prev, newMoodData]);
  };

  // Check for plan completion data on component mount
  useEffect(() => {
    const savedCompletion = localStorage.getItem('quitPlanCompletion');
    if (savedCompletion) {
      const completion = JSON.parse(savedCompletion);
      setCompletionData(completion);
      setShowCompletionDashboard(true);
    }
  }, []);

  // Recalculate statistics whenever actualProgress changes với debounce để tránh vòng lặp
  useEffect(() => {
    // Recalculate cho cả trường hợp có và không có data
    const timeoutId = setTimeout(() => {
      if (actualProgress && actualProgress.length > 0) {
        console.log('🔄 Recalculating stats for actualProgress:', actualProgress.length);
      } else {
        console.log('🔄 Recalculating stats for empty actualProgress');
      }
      recalculateStatistics();
    }, 200); // Debounce 200ms

    return () => clearTimeout(timeoutId);
  }, [actualProgress]);

  // Không chuyển hướng tự động, chỉ hiển thị nút cho người dùng
  useEffect(() => {
    if (userPlan) {
      // Chỉ kiểm tra xem có kế hoạch và cập nhật state
    }
  }, [userPlan, hasPlan]);
  // Tính toán lại tất cả các thống kê từ lịch sử checkin của kế hoạch hiện tại
  const recalculateStatistics = () => {
    console.log("📊 ==> RECALCULATING STATISTICS FROM CHECKIN HISTORY FOR CURRENT PLAN <==");
    console.log("📊 Current userPlan:", userPlan?.plan_name || userPlan?.planName);
    console.log("📊 actualProgress data:", actualProgress);

    // Nếu không có dữ liệu actualProgress, set stats về 0
    if (!actualProgress || actualProgress.length === 0) {
      console.log("⚠️ No actualProgress data, setting stats to zero");
      const emptyStats = {
        noSmokingDays: 0,
        savedCigarettes: 0,
        savedMoney: 0,
        healthProgress: 0
      };
      setDashboardStats(emptyStats);
      console.log("📊 Empty stats set:", emptyStats);
      return emptyStats;
    }

    // Filter chỉ lấy những ngày có checkin thực tế (actual cigarettes !== null)
    const realCheckins = actualProgress.filter(day =>
      day.actualCigarettes !== null &&
      day.actualCigarettes !== undefined
    );

    console.log(`📊 Total progress entries: ${actualProgress.length}`);
    console.log(`📊 Real checkins (with actual data): ${realCheckins.length}`);

    // 1. TÍNH SỐ NGÀY THEO DÕI (Ngày theo dõi)
    // Đếm số ngày đã có checkin thực tế
    const noSmokingDays = realCheckins.length;
    console.log(`📅 Số ngày theo dõi: ${noSmokingDays} ngày`);

    // 2. TÍNH SỐ ĐIẾU ĐÃ TRÁNH VÀ TIỀN TIẾT KIỆM TỪ LỊCH SỬ CHECKIN THỰC TẾ
    // Lấy thông tin kế hoạch hiện tại từ userPlan hoặc localStorage
    let currentPlan = userPlan;
    if (!currentPlan) {
      try {
        const activePlanData = localStorage.getItem('activePlan');
        if (activePlanData) {
          currentPlan = JSON.parse(activePlanData);
        }
      } catch (error) {
        console.error("Error parsing activePlan from localStorage:", error);
      }
    }

    console.log(`🎯 Current plan for calculation:`, currentPlan?.plan_name || currentPlan?.planName || 'No plan');

    // Tính tổng số điếu đã tránh và tiền tiết kiệm trực tiếp từ lịch sử checkin
    let totalSavedCigarettes = 0;
    let totalSavedMoney = 0;
    let detailLog = [];

    realCheckins.forEach(dayRecord => {
      let daySavedCigarettes = 0;
      let daySavedMoney = 0;

      // PHƯƠNG PHÁP 1: Ưu tiên lấy từ cột cigarettes_avoided và money_saved từ lịch sử checkin
      if (dayRecord.cigarettes_avoided !== undefined && dayRecord.cigarettes_avoided !== null) {
        daySavedCigarettes = Math.max(0, dayRecord.cigarettes_avoided);
        console.log(`✅ [${dayRecord.date}] From checkin history cigarettes_avoided: ${daySavedCigarettes} điếu`);
      }

      if (dayRecord.money_saved !== undefined && dayRecord.money_saved !== null) {
        daySavedMoney = Math.max(0, dayRecord.money_saved);
        console.log(`💰 [${dayRecord.date}] From checkin history money_saved: ${daySavedMoney.toLocaleString('vi-VN')}₫`);
      }

      // PHƯƠNG PHÁP 2: Nếu không có trong lịch sử, tính toán từ target và actual của ngày đó
      if (daySavedCigarettes === 0 && currentPlan) {
        // Tính target cho ngày cụ thể dựa trên kế hoạch
        const dayTarget = calculateTargetForDate(dayRecord.date, currentPlan);
        const actualSmoked = dayRecord.actualCigarettes || dayRecord.actual_cigarettes || 0;

        // Số điếu tránh = Target của ngày đó - Số điếu thực tế đã hút
        daySavedCigarettes = Math.max(0, dayTarget - actualSmoked);
        console.log(`📊 [${dayRecord.date}] Calculated: target ${dayTarget} - actual ${actualSmoked} = ${daySavedCigarettes} điếu`);

        // Tính tiền tiết kiệm tương ứng
        if (daySavedMoney === 0) {
          const packPrice = currentPlan?.packPrice || 25000;
          const cigarettesPerPack = 20;
          const pricePerCigarette = packPrice / cigarettesPerPack;
          daySavedMoney = daySavedCigarettes * pricePerCigarette;
        }
      }

      totalSavedCigarettes += daySavedCigarettes;
      totalSavedMoney += daySavedMoney;

      detailLog.push({
        date: dayRecord.date,
        target: calculateTargetForDate(dayRecord.date, currentPlan),
        actual: dayRecord.actualCigarettes || dayRecord.actual_cigarettes || 0,
        savedCigarettes: daySavedCigarettes,
        savedMoney: daySavedMoney,
        source: dayRecord.cigarettes_avoided !== undefined ? 'checkin_history' : 'calculated'
      });
    });

    console.log(`💰 TỔNG SỐ ĐIẾU ĐÃ TRÁNH: ${totalSavedCigarettes} điếu`);
    console.log(`💵 TỔNG SỐ TIỀN TIẾT KIỆM: ${totalSavedMoney.toLocaleString('vi-VN')}₫`);
    console.log("📊 Chi tiết từng ngày:", detailLog);

    // Hàm helper tính target cho ngày cụ thể
    function calculateTargetForDate(date, plan) {
      if (!plan || !plan.weeks || !plan.start_date) return 0;

      const targetDate = new Date(date);
      const planStartDate = new Date(plan.start_date || plan.startDate);
      const daysDiff = Math.floor((targetDate - planStartDate) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysDiff / 7) + 1;

      if (weekNumber > 0 && weekNumber <= plan.weeks.length) {
        const weekPlan = plan.weeks[weekNumber - 1];
        return weekPlan?.amount || weekPlan?.target || weekPlan?.cigarettes || 0;
      }

      return 0;
    }

    console.log(`💰 TỔNG SỐ ĐIẾU ĐÃ TRÁNH: ${totalSavedCigarettes} điếu`);
    console.log(`� TỔNG SỐ TIỀN TIẾT KIỆM: ${totalSavedMoney.toLocaleString('vi-VN')}₫`);
    console.log("� Chi tiết từng ngày:", detailLog);

    // 3. TÍNH MILESTONE SỨC KHỎE (Milestone sức khỏe)
    // Milestone theo WHO guidelines
    const healthMilestones = [
      { days: 1, title: '24 giờ đầu tiên', description: 'Carbon monoxide được loại bỏ khỏi cơ thể', icon: '🫁' },
      { days: 2, title: '48 giờ', description: 'Nicotine được loại bỏ, vị giác cải thiện', icon: '👅' },
      { days: 3, title: '72 giờ', description: 'Đường hô hấp thư giãn, năng lượng tăng', icon: '⚡' },
      { days: 7, title: '1 tuần', description: 'Huyết áp và nhịp tim ổn định', icon: '❤️' },
      { days: 14, title: '2 tuần', description: 'Tuần hoàn máu cải thiện', icon: '🩸' },
      { days: 30, title: '1 tháng', description: 'Chức năng phổi tăng 30%', icon: '🌬️' },
      { days: 90, title: '3 tháng', description: 'Ho và khó thở giảm đáng kể', icon: '🌟' },
      { days: 365, title: '1 năm', description: 'Nguy cơ bệnh tim giảm 50%', icon: '💪' }
    ];

    // Tính số ngày từ checkin đầu tiên đến hiện tại
    let daysInPlan = 0;
    if (realCheckins.length > 0) {
      // Sắp xếp theo ngày để lấy ngày đầu tiên
      const sortedProgress = [...realCheckins].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstCheckinDate = new Date(sortedProgress[0].date);
      const currentDate = new Date();
      daysInPlan = Math.floor((currentDate - firstCheckinDate) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Đếm số milestone đã đạt được
    const achievedMilestones = healthMilestones.filter(milestone => daysInPlan >= milestone.days);
    const healthProgress = Math.round((achievedMilestones.length / healthMilestones.length) * 100);

    console.log(`🏆 Milestone sức khỏe: ${achievedMilestones.length}/${healthMilestones.length} = ${healthProgress}%`);
    console.log(`📈 Đã theo dõi ${daysInPlan} ngày, đạt được:`, achievedMilestones.map(m => m.title));

    // Cập nhật state với dữ liệu tính từ lịch sử checkin thực tế
    const newStats = {
      noSmokingDays, // Số ngày theo dõi (số ngày có checkin thực tế)
      savedCigarettes: totalSavedCigarettes, // Điếu thuốc đã tránh (từ lịch sử checkin)
      savedMoney: totalSavedMoney, // VND đã tiết kiệm (từ lịch sử checkin)
      healthProgress, // Milestone sức khỏe (%)

      // Thông tin chi tiết để debug
      calculationDetails: {
        currentPlan: currentPlan?.plan_name || currentPlan?.planName || 'Unknown',
        planId: currentPlan?.id || 'Unknown',
        daysInPlan,
        realCheckinsCount: realCheckins.length,
        totalProgressEntries: actualProgress.length,
        achievedMilestones: achievedMilestones.length,
        totalMilestones: healthMilestones.length,
        dailyBreakdown: detailLog,
        lastCalculated: new Date().toISOString(),
        calculationSource: 'checkin_history_based'
      }
    };

    // Cập nhật state
    setDashboardStats(newStats);

    // Lưu vào localStorage
    localStorage.removeItem('dashboardStats');
    localStorage.setItem('dashboardStats', JSON.stringify(newStats));

    console.log("✅ ==> STATISTICS CALCULATION COMPLETED <==");
    console.log("📊 Final stats:", newStats);
    console.log("📊 Calculation details:", newStats.calculationDetails);

    return newStats;
  };

  // Debug logging trước khi render (chỉ log một lần khi component mount)
  if (isLoading) {
    // Removed detailed logging for cleaner console
  }

  // Hiển thị loading trong khi tải dữ liệu
  if (isLoading) {
    return (
      <div className="progress-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Đang tải kế hoạch của bạn...</p>
        </div>
      </div>
    );
  }

  // Kiểm tra xem có cần hiển thị thông báo cần lập kế hoạch
  if (!hasPlan || !userPlan) {
    return (
      <div className="progress-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '3rem',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          marginTop: '2rem'
        }}>          <h2 style={{
          fontSize: '1.8rem',
          marginBottom: '1.5rem',
          color: '#2c3e50',
          textAlign: 'center',
          width: '100%',
          position: 'relative',
          fontWeight: '600',
          display: 'inline-block'
        }}>
            <span style={{ position: 'relative', zIndex: '1' }}>
              Bạn cần lập kế hoạch cai thuốc
              <span style={{
                position: 'absolute',
                height: '3px',
                width: '100px',
                background: '#3498db',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '2px'
              }}></span>
            </span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '2rem',
            color: '#7f8c8d',
            lineHeight: '1.6',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            Để theo dõi tiến trình cai thuốc, hãy lập một kế hoạch phù hợp với mục tiêu
            và khả năng của bạn. Kế hoạch này sẽ giúp bạn duy trì động lực và đo lường
            sự tiến bộ hàng ngày.
          </p>          <a
            href="/journey"
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              padding: '12px 25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'block',
              margin: '0 auto',
              width: 'fit-content',
              textAlign: 'center'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Lập kế hoạch cai thuốc ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1 className="page-title">
          {showCompletionDashboard ? 'Chúc mừng! Bạn đã lập kế hoạch cai thuốc' : 'Tiến trình cai thuốc hiện tại'}
        </h1>
      </div>

      {/* Active Plan Selector - Cho phép chọn kế hoạch để theo dõi */}
      <ActivePlanSelector
        selectedPlan={userPlan}
        onPlanChange={handlePlanChange}
        isLoading={isLoading}
      />

      {/* Daily Checkin Section - Luôn hiển thị để người dùng có thể nhập số điếu đã hút */}
      <DailyCheckin
        onProgressUpdate={handleProgressUpdate}
        selectedPlan={userPlan}
      />

      {/* Luôn hiển thị ProgressDashboard */}
      <ProgressDashboard
        userPlan={userPlan}
        completionDate={completionData?.completionDate || new Date().toISOString()}
        dashboardStats={dashboardStats}
        actualProgress={actualProgress}
        onDataReset={async () => {
          // Reset data & recalculate
          localStorage.removeItem('dashboardStats');
          try {
            await loadActualProgressFromCheckins();
            recalculateStatistics();
          } catch (error) {
            console.error('❌ Error during data reset:', error);
          }
        }}
      />

      {/* LỊCH SỬ CHECK-IN COMPONENT */}
      {/* CheckinHistory component nhận prop onProgressUpdate từ parent */}
      {/* Prop này là callback function để thông báo khi có thay đổi data */}
      {/* Khi user edit/delete entry trong CheckinHistory, nó sẽ gọi onProgressUpdate */}
      {/* để trigger reload toàn bộ data ở parent component (Progress.jsx) */}
      <div className="section-divider"></div>
      <CheckinHistory
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
