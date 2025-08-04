import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DailyCheckin from '../components/DailyCheckin';
import ProgressDashboard from '../components/ProgressDashboard';
import CheckinHistory from '../components/CheckinHistory';
import ResetCheckinData from '../components/ResetCheckinData';
import { FaCalendarCheck, FaLeaf, FaCoins, FaHeart } from 'react-icons/fa';
import progressService from '../services/progressService';
import { getUserActivePlan } from '../services/quitPlanService';
import achievementAwardService from '../services/achievementAwardService';
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

  // Load user plan and progress from localStorage and API
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
      // Ưu tiên DATABASE làm nguồn dữ liệu chính
      const response = await getUserActivePlan();
      
      if (response && response.success && response.plan) {
        const planFromDatabase = response.plan;
        console.log("✅ Loaded plan from database:", planFromDatabase.plan_name);
        
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
        
        // Kiểm tra localStorage làm backup
        const savedPlan = localStorage.getItem('activePlan');
        if (savedPlan) {
          try {
            const parsedPlan = JSON.parse(savedPlan);
            console.log("✅ Found plan in localStorage:", parsedPlan.plan_name || parsedPlan.planName);
            
            setUserPlan(parsedPlan);
            setHasPlan(true);
            
            await loadActualProgressFromCheckins(parsedPlan);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error("❌ Lỗi khi parse localStorage:", error);
          }
        }
        
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
  };    // Xử lý cập nhật tiến trình từ Daily Checkin
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
  
  // Xử lý cập nhật tâm trạng từ Mood Tracking
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
    // Tính toán lại tất cả các thống kê và cập nhật state
  const recalculateStatistics = () => {
    console.log("📊 Recalculating statistics...");
    
    // Nếu không có dữ liệu actualProgress, đơn giản set stats về 0 thay vì gọi lại loadUserPlanAndProgress
    if (!actualProgress || actualProgress.length === 0) {
      console.log("⚠️ No actualProgress data, setting stats to zero");
      setDashboardStats({
        noSmokingDays: 0,
        savedCigarettes: 0,
        savedMoney: 0,
        healthProgress: 0
      });
      return;
    }
    
    // Tính số ngày đã check-in (tính bằng số ngày đã lưu DailyCheckin)
    const currentDate = new Date();
    const noSmokingDays = actualProgress.length;
    
    // Lấy số điếu ban đầu chính xác từ kế hoạch và activePlan
    let initialCigarettesPerDay = 0;
    
    // Ưu tiên lấy từ activePlan vì đó là nơi lưu giá trị người dùng nhập
    try {
      const activePlanData = localStorage.getItem('activePlan');
      if (activePlanData) {
        const activePlan = JSON.parse(activePlanData);
        if (activePlan && activePlan.initialCigarettes) {
          initialCigarettesPerDay = activePlan.initialCigarettes;
        }
      }
    } catch (error) {
      // No need to log this error
    }
    
    // Nếu không có trong activePlan, thử lấy từ userPlan
    if (!initialCigarettesPerDay) {
      initialCigarettesPerDay = userPlan?.initialCigarettes || 
                              (userPlan?.weeks && userPlan.weeks.length > 0 ? userPlan.weeks[0].amount : 22);
    }
    
    // Chỉ tìm check-in của hôm nay
    const todayDateStr = new Date().toISOString().split('T')[0];
    const todayRecord = actualProgress.find(day => day.date === todayDateStr);
    
    // Tính số điếu đã tránh tích lũy cho TẤT CẢ các ngày có check-in
    let savedCigarettes = 0;
    let dailySavings = [];
    let detailedLog = '';
    
    // Lấy số điếu ban đầu từ activePlan trong localStorage nếu có
    let userInitialCigarettes = initialCigarettesPerDay;
    try {
      const activePlanData = localStorage.getItem('activePlan');
      if (activePlanData) {
        const activePlan = JSON.parse(activePlanData);
        if (activePlan && activePlan.initialCigarettes) {
          userInitialCigarettes = activePlan.initialCigarettes;
        }
      }
    } catch (error) {
      // No need to log this error
    }
    
    // Biến để lưu số điếu đã tránh tích lũy
    let totalSavedCigarettes = 0;
    
    // Tính số điếu đã tránh cho TẤT CẢ các ngày có trong actualProgress
    detailedLog = '';
    
    // Tính toán số điếu đã tránh cho mỗi ngày và tích lũy tổng số
    actualProgress.forEach(dayRecord => {
      // Ưu tiên sử dụng cigarettes_avoided từ database trước
      let daySaved = 0;
      
      if (dayRecord.cigarettes_avoided !== undefined && dayRecord.cigarettes_avoided !== null) {
        // Sử dụng trực tiếp cigarettes_avoided từ database
        daySaved = dayRecord.cigarettes_avoided;
        console.log(`✅ [${dayRecord.date}] Database avoided: ${daySaved}`);
      } else {
        // Fallback: Tính toán theo cách cũ nếu không có cigarettes_avoided
        const targetForDay = dayRecord.targetCigarettes || dayRecord.target_cigarettes || userInitialCigarettes;
        const actualForDay = dayRecord.actualCigarettes || dayRecord.actual_cigarettes || 0;
        daySaved = Math.max(0, targetForDay - actualForDay);
        console.log(`📊 [${dayRecord.date}] Calculated: ${targetForDay} - ${actualForDay} = ${daySaved}`);
      }
      
      totalSavedCigarettes += daySaved;
      
      // Ghi chi tiết để debug
      const targetForDay = dayRecord.targetCigarettes || dayRecord.target_cigarettes || userInitialCigarettes;
      const actualForDay = dayRecord.actualCigarettes || dayRecord.actual_cigarettes || 0;
      detailedLog += `\n- ${dayRecord.date}: Target: ${targetForDay}, Actual: ${actualForDay} = Saved: ${daySaved}`;
      
      // Lưu thông tin chi tiết
      dailySavings.push({
        date: dayRecord.date,
        actual: actualForDay,
        targetFromPlan: targetForDay,
        userInitialCigarettes: userInitialCigarettes,
        saved: daySaved,
        fromDatabase: dayRecord.cigarettes_avoided !== undefined
      });
    });
    
    // Thiết lập giá trị cuối cùng
    savedCigarettes = totalSavedCigarettes;
    
    console.log(`💰 TOTAL SAVED: ${savedCigarettes} cigarettes`);
    console.log("Daily savings breakdown:", dailySavings);
      // Tính số tiền tiết kiệm dựa trên giá gói thuốc từ kế hoạch của người dùng
    let packPrice = 25000; // Giá mặc định nếu không tìm thấy
    
    // Lấy giá gói thuốc từ activePlan
    try {
      const activePlanData = localStorage.getItem('activePlan');
      if (activePlanData) {
        const activePlan = JSON.parse(activePlanData);
        if (activePlan && activePlan.packPrice) {
          packPrice = activePlan.packPrice;
        }
      }
    } catch (error) {
      // Use default price
    }
    
    const pricePerCigarette = packPrice / 20; // Giả sử 1 gói = 20 điếu
    const savedMoney = savedCigarettes * pricePerCigarette;
    
    // Tính milestone sức khỏe đạt được
    // Milestone theo thời gian WHO
    const healthMilestones = [
      { days: 1, title: '24 giờ đầu tiên', description: 'Carbon monoxide được loại bỏ khỏi cơ thể' },
      { days: 2, title: '48 giờ', description: 'Nicotine được loại bỏ, vị giác cải thiện' },
      { days: 3, title: '72 giờ', description: 'Đường hô hấp thư giãn, năng lượng tăng' },
      { days: 14, title: '2 tuần', description: 'Tuần hoàn máu cải thiện' },
      { days: 30, title: '1 tháng', description: 'Chức năng phổi tăng 30%' },
      { days: 90, title: '3 tháng', description: 'Ho và khó thở giảm đáng kể' },
      { days: 365, title: '1 năm', description: 'Nguy cơ bệnh tim giảm 50%' }
    ];
    
    // Tìm ngày đầu tiên có check-in để tính số ngày đã bắt đầu
    let daysInPlan = 0;
    if (actualProgress.length > 0) {
      const oldestRecord = new Date(actualProgress[0].date);
      daysInPlan = Math.floor((currentDate - oldestRecord) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Đếm số milestone đã đạt được
    const achievedMilestones = healthMilestones.filter(m => daysInPlan >= m.days).length;
    const healthProgress = Math.round((achievedMilestones / healthMilestones.length) * 100);
    
    console.log(`📈 Stats: ${noSmokingDays} days, ${savedCigarettes} saved, ${savedMoney.toFixed(0)}₫, ${healthProgress}% health`);
    
    // Cập nhật state với thống kê mới
    const newStats = {
      noSmokingDays,
      savedCigarettes,
      savedMoney,
      healthProgress,
      // Thêm thông tin chi tiết để debugging
      calculationDetails: {
        initialCigarettesPerDay,
        dailySavings,
        lastCalculated: new Date().toISOString(),
        debug: {
          actualData: todayRecord ? {
            date: todayDateStr,
            actualCigarettes: todayRecord.actualCigarettes,
            targetCigarettes: todayRecord.targetCigarettes
          } : "Chưa có check-in hôm nay",
          savedCalcDesc: `${initialCigarettesPerDay} - ${todayRecord?.actualCigarettes || 0} = ${savedCigarettes} điếu`
        }
      }
    };
    
    // Cập nhật state
    setDashboardStats(newStats);
    
    // Lưu vào localStorage để sử dụng giữa các phiên - xóa trước để đảm bảo không giữ lại dữ liệu cũ
    localStorage.removeItem('dashboardStats');
    localStorage.setItem('dashboardStats', JSON.stringify(newStats));
    
    // 🏆 KIỂM TRA VÀ AWARD HUY HIỆU MỚI
    checkAndAwardNewAchievements(newStats);
    
    return newStats;
  };

  // 🏆 Kiểm tra và award huy hiệu mới dựa trên tiến trình
  const checkAndAwardNewAchievements = async (stats) => {
    if (!user || !user.id) {
      console.log('🏆 No user logged in, skipping achievement check');
      return;
    }

    try {
      console.log('🏆 PROGRESS: Checking achievements with stats:', stats);
      
      const userProgress = {
        days: stats.noSmokingDays || 0,
        money: stats.savedMoney || 0,
        cigarettes: stats.savedCigarettes || 0
      };

      const awardResult = await achievementAwardService.checkAndAwardAchievements(userProgress);
      
      if (awardResult.success && awardResult.newAchievements.length > 0) {
        console.log('🎉 PROGRESS: New achievements awarded:', awardResult.newAchievements);
        
        // Hiển thị thông báo huy hiệu mới
        achievementAwardService.showAchievementNotification(awardResult.newAchievements);
        
        // Log cho user biết
        console.log(`🏆 Chúc mừng! Bạn đã nhận được ${awardResult.newAchievements.length} huy hiệu mới!`);
      } else {
        console.log('🏆 PROGRESS: No new achievements to award');
      }
    } catch (error) {
      console.error('❌ PROGRESS: Error checking achievements:', error);
    }
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
        
        {/* Test Achievement Button */}
        <button
          onClick={() => checkAndAwardNewAchievements(dashboardStats)}
          style={{
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '10px',
            boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
          }}
        >
          🏆 Kiểm tra huy hiệu mới
        </button>
      </div>
      
      {/* Daily Checkin Section - Luôn hiển thị để người dùng có thể nhập số điếu đã hút */}
      <DailyCheckin 
        onProgressUpdate={handleProgressUpdate}
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
      
      {/* Lịch sử Check-in */}
      <div className="section-divider"></div>
      <CheckinHistory 
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
