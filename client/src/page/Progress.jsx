import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import QuitProgressChart from "../components/QuitProgressChart";
import DailyCheckin from "../components/DailyCheckin";
import ProgressDashboard from "../components/ProgressDashboard";
import apiService from "../services/apiService";
import { getUserProgress, getProgressStats } from "../services/progressService";
import "./Progress.css";
import "../styles/DailyCheckin.css";
import "../styles/ProgressDashboard.css";

export default function Progress() {
  const { user, isAuthenticated } = useAuth();
  const [activeTimeFilter, setActiveTimeFilter] = useState("30 ngày");
  const [showCompletionDashboard, setShowCompletionDashboard] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [actualProgress, setActualProgress] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false); // Chỉ loading khi thực sự cần thiết
  const [error, setError] = useState(null);

  // Initialize with default plan on first load
  useEffect(() => {
    if (!userPlan) {
      const defaultPlan = {
        name: "Kế hoạch 6 tuần",
        startDate: new Date().toISOString().split("T")[0],
        weeks: [
          { week: 1, amount: 20, phase: "Thích nghi" },
          { week: 2, amount: 16, phase: "Thích nghi" },
          { week: 3, amount: 12, phase: "Tăng tốc" },
          { week: 4, amount: 8, phase: "Tăng tốc" },
          { week: 5, amount: 5, phase: "Hoàn thiện" },
          { week: 6, amount: 2, phase: "Hoàn thiện" },
          { week: 7, amount: 0, phase: "Mục tiêu đạt được" },
        ],
        initialCigarettes: 20,
      };
      setUserPlan(defaultPlan);
    }
  }, [userPlan]); // Chỉ chạy một lần khi component mount

  // Fallback function to load progress from localStorage
  const loadProgressFromLocalStorage = useCallback(() => {
    try {
      const localProgress = [];
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        try {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          const checkinData = localStorage.getItem(`checkin_${dateStr}`);
          if (checkinData) {
            const data = JSON.parse(checkinData);
            localProgress.push({
              date: dateStr,
              actualCigarettes:
                data.cigarettesSmoked || data.actualCigarettes || 0,
              targetCigarettes: data.targetCigarettes || 0,
              mood: data.mood,
              achievements: data.achievements || [],
              challenges: data.challenges || [],
              notes: data.notes || "",
            });
          }
        } catch (error) {
          console.error(`Error loading check-in data for day -${i}:`, error);
        }
      }

      setActualProgress(localProgress);
    } catch (error) {
      console.error("Error loading progress from localStorage:", error);
    }
  }, []);

  // Load progress data từ backend
  const loadProgressData = useCallback(
    async (planId) => {
      try {
        if (import.meta.env.DEV) {
          console.log("📊 Loading progress data for plan:", planId);
        }

        // Load progress records
        const progressData = await getUserProgress(planId, 30);

        // Convert backend data format to frontend format
        const convertedProgress = progressData.map((item) => ({
          date: item.progress_date,
          actualCigarettes: item.cigarettes_smoked || 0,
          targetCigarettes: item.target_cigarettes || 0,
          mood: item.status || "unknown",
          note: item.note || "",
        }));

        setActualProgress(convertedProgress);

        // Load dashboard stats
        const stats = await getProgressStats(planId);
        setDashboardStats(stats);

        if (import.meta.env.DEV) {
          console.log(
            "✅ Loaded progress data:",
            convertedProgress.length,
            "records"
          );
        }
      } catch (error) {
        console.error("❌ Error loading progress data:", error);
        // Fallback to localStorage when backend fails
        loadProgressFromLocalStorage();
      }
    },
    [loadProgressFromLocalStorage]
  );

  // Load user plan from backend or localStorage
  const loadUserPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from backend first if authenticated
      if (isAuthenticated && user) {
        try {
          if (import.meta.env.DEV) {
            console.log("🔍 Loading user plans from backend...");
          }
          const plans = await apiService.getUserPlans();

          if (plans && plans.length > 0) {
            // Tìm plan đang active
            const activePlan =
              plans.find((plan) => plan.status === "ongoing") || plans[0];
            setUserPlan(activePlan);

            // Load progress data cho plan này (không await để tránh hang)
            loadProgressData(activePlan.id).catch((err) => {
              console.warn("Failed to load progress data:", err);
            });

            if (import.meta.env.DEV) {
              console.log("✅ Loaded plan from backend:", activePlan.plan_name);
            }
            return;
          }
        } catch (apiError) {
          console.warn(
            "Failed to load plan from backend, falling back to localStorage:",
            apiError
          );
        }
      }

      // Fallback to localStorage
      const savedCompletion = localStorage.getItem("quitPlanCompletion");
      if (savedCompletion) {
        try {
          const completion = JSON.parse(savedCompletion);
          if (completion && completion.userPlan) {
            setCompletionData(completion);
            setUserPlan(completion.userPlan);
            setShowCompletionDashboard(true);
            return;
          }
        } catch (parseError) {
          console.error("Error parsing completion data:", parseError);
        }
      }

      // Try activePlan from localStorage
      const savedPlan = localStorage.getItem("activePlan");
      if (savedPlan) {
        try {
          const parsedPlan = JSON.parse(savedPlan);
          if (
            parsedPlan &&
            Array.isArray(parsedPlan.weeks) &&
            parsedPlan.weeks.length > 0
          ) {
            setUserPlan(parsedPlan);
            return;
          }
        } catch (parseError) {
          console.error("Error parsing saved plan:", parseError);
        }
      }

      // Default plan if nothing found
      setUserPlan(getDefaultPlan());
    } catch (error) {
      console.error("Error loading user plan:", error);
      setError("Không thể tải kế hoạch của bạn");
      setUserPlan(getDefaultPlan());
    } finally {
      // Luôn luôn tắt loading sau khi hoàn thành
      setLoading(false);
    }
  }, [isAuthenticated, user, loadProgressData]);

  // Get default plan
  const getDefaultPlan = () => ({
    name: "Kế hoạch 6 tuần",
    startDate: new Date().toISOString().split("T")[0],
    weeks: [
      { week: 1, amount: 20, phase: "Thích nghi" },
      { week: 2, amount: 16, phase: "Thích nghi" },
      { week: 3, amount: 12, phase: "Tăng tốc" },
      { week: 4, amount: 8, phase: "Tăng tốc" },
      { week: 5, amount: 5, phase: "Hoàn thiện" },
      { week: 6, amount: 2, phase: "Hoàn thiện" },
      { week: 7, amount: 0, phase: "Mục tiêu đạt được" },
    ],
    initialCigarettes: 20,
  });

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    if (!userPlan || !actualProgress) return null;

    let noSmokingDays = actualProgress.length;
    let savedCigarettes = 0;
    let initialCigarettesPerDay = userPlan.initialCigarettes || 20;

    // Calculate saved cigarettes
    actualProgress.forEach((dayRecord) => {
      const daySaved = Math.max(
        0,
        initialCigarettesPerDay - dayRecord.actualCigarettes
      );
      savedCigarettes += daySaved;
    });

    // Calculate saved money
    let packPrice = 25000; // Default price
    try {
      const activePlanData = localStorage.getItem("activePlan");
      if (activePlanData) {
        const activePlan = JSON.parse(activePlanData);
        if (activePlan && activePlan.packPrice) {
          packPrice = activePlan.packPrice;
        }
      }
    } catch (error) {
      console.error("Error getting pack price:", error);
    }

    const pricePerCigarette = packPrice / 20;
    const savedMoney = savedCigarettes * pricePerCigarette;

    // Health milestones
    const healthMilestones = [
      { days: 1, title: "24 giờ", description: "Carbon monoxide được loại bỏ" },
      {
        days: 2,
        title: "48 giờ",
        description: "Nicotine được loại bỏ, vị giác cải thiện",
      },
      {
        days: 3,
        title: "72 giờ",
        description: "Đường hô hấp thư giãn, năng lượng tăng",
      },
      {
        days: 7,
        title: "1 tuần",
        description: "Vị giác và khứu giác cải thiện rõ rệt",
      },
      { days: 14, title: "2 tuần", description: "Tuần hoàn máu cải thiện" },
      { days: 30, title: "1 tháng", description: "Chức năng phổi tăng 30%" },
      { days: 90, title: "3 tháng", description: "Ho và khó thở giảm đáng kể" },
      { days: 365, title: "1 năm", description: "Nguy cơ bệnh tim giảm 50%" },
    ];

    const achievedMilestones = healthMilestones.filter(
      (m) => noSmokingDays >= m.days
    ).length;
    const healthProgress = Math.round(
      (achievedMilestones / healthMilestones.length) * 100
    );

    return {
      noSmokingDays,
      savedCigarettes,
      savedMoney,
      healthProgress,
    };
  }, [userPlan, actualProgress]);

  // Handle progress update from DailyCheckin
  const handleProgressUpdate = async (newProgressData) => {
    try {
      // Check backend connection
      const isOnline = await apiService.healthCheck();

      // Try to save to backend first if authenticated and online
      if (isAuthenticated && user && isOnline) {
        try {
          const checkinData = {
            plan_id: userPlan?.id || 1,
            progress_date: new Date().toISOString().split("T")[0],
            cigarettes_smoked: newProgressData.actualCigarettes || 0,
            target_cigarettes: newProgressData.targetCigarettes || 0,
            mood: newProgressData.mood,
            note: newProgressData.notes || "",
            status:
              newProgressData.actualCigarettes <=
              newProgressData.targetCigarettes
                ? "on_track"
                : "struggled",
          };

          await apiService.createCheckin(checkinData);
          if (import.meta.env.DEV) {
            console.log("Progress saved to backend successfully");
          }
        } catch (apiError) {
          console.warn(
            "Failed to save to backend, continuing with localStorage:",
            apiError
          );
        }
      }

      // Always save to localStorage as backup
      const dateStr = new Date().toISOString().split("T")[0];
      localStorage.setItem(
        `checkin_${dateStr}`,
        JSON.stringify(newProgressData)
      );

      // Reload progress data
      await loadProgressData();
    } catch (error) {
      console.error("Error updating progress:", error);
      setError("Không thể cập nhật tiến trình");
    }
  };

  // Load data on component mount - chỉ chạy một lần
  useEffect(() => {
    const loadInitialData = async () => {
      if (!userPlan) {
        await loadUserPlan();
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  useEffect(() => {
    if (userPlan) {
      loadProgressData(userPlan.id);
    }
  }, [userPlan, loadProgressData]);

  // Update statistics when progress changes
  useEffect(() => {
    const stats = calculateStatistics();
    setDashboardStats(stats);
  }, [calculateStatistics]);

  // Loading state
  // Chỉ hiển thị loading khi thực sự đang load và chưa có dữ liệu
  if (loading && !userPlan) {
    return (
      <div className="progress-container">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="progress-container">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className="error-message">
            <h3>⚠️ Có lỗi xảy ra</h3>
            <p>{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadUserPlan();
              }}
              style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "10px 20px",
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No plan state
  if (
    !userPlan ||
    !Array.isArray(userPlan.weeks) ||
    userPlan.weeks.length === 0
  ) {
    return (
      <div className="progress-container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "3rem",
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
            marginTop: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.8rem",
              marginBottom: "1.5rem",
              color: "#2c3e50",
              fontWeight: "600",
            }}
          >
            Bạn cần lập kế hoạch cai thuốc
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              marginBottom: "2rem",
              color: "#7f8c8d",
              lineHeight: "1.6",
            }}
          >
            Để theo dõi tiến trình cai thuốc, hãy lập một kế hoạch phù hợp với
            mục tiêu của bạn.
          </p>
          <a
            href="/journey"
            style={{
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "30px",
              padding: "12px 25px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            Lập kế hoạch cai thuốc ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-container">
      <h1 className="page-title">
        {showCompletionDashboard
          ? "Chúc mừng! Bạn đã hoàn thành kế hoạch"
          : "Tiến trình cai thuốc của bạn"}
      </h1>

      {/* Connection Status - Only show when offline */}
      {!isAuthenticated && (
        <div
          className="connection-status"
          style={{
            padding: "8px 16px",
            borderRadius: "5px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
            backgroundColor: "#fff3cd",
            color: "#856404",
            border: "1px solid #ffeaa7",
          }}
        >
          ⚠️ Đang hoạt động offline - Dữ liệu được lưu cục bộ
        </div>
      )}

      {/* Daily Checkin Section */}
      <DailyCheckin
        onProgressUpdate={handleProgressUpdate}
        currentPlan={userPlan}
        isOnline={isAuthenticated}
      />

      {/* Show completion dashboard if completed */}
      {showCompletionDashboard && completionData ? (
        <ProgressDashboard
          userPlan={completionData.userPlan}
          completionDate={completionData.completionDate}
          dashboardStats={dashboardStats}
          actualProgress={actualProgress}
        />
      ) : (
        <>
          {/* Progress Chart */}
          <div className="chart-section">
            <div className="section-header">
              <h2>Biểu đồ tiến trình</h2>
              <div className="time-filter-buttons">
                {["7 ngày", "14 ngày", "30 ngày", "Tất cả"].map((filter) => (
                  <button
                    key={filter}
                    className={`time-filter ${
                      activeTimeFilter === filter ? "active" : ""
                    }`}
                    onClick={() => setActiveTimeFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <QuitProgressChart
              userPlan={userPlan}
              actualProgress={actualProgress}
              timeFilter={activeTimeFilter}
            />
          </div>

          {/* Progress Dashboard */}
          <div className="dashboard-section">
            <ProgressDashboard
              userPlan={userPlan}
              completionDate={userPlan?.startDate}
              dashboardStats={dashboardStats}
              actualProgress={actualProgress}
            />
          </div>

          {/* Plan Information */}
          <div className="plan-info-section">
            <h2>Kế hoạch hiện tại: {userPlan.name}</h2>
            <div className="plan-summary">
              <div className="summary-item">
                <span className="label">Thời gian:</span>
                <span className="value">{userPlan.weeks.length} tuần</span>
              </div>
              <div className="summary-item">
                <span className="label">Mục tiêu cuối:</span>
                <span className="value">0 điếu/ngày</span>
              </div>
              <div className="summary-item">
                <span className="label">Ngày bắt đầu:</span>
                <span className="value">
                  {userPlan.startDate
                    ? new Date(userPlan.startDate).toLocaleDateString()
                    : "Chưa xác định"}
                </span>
              </div>
            </div>
