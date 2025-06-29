import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  FaTrophy,
  FaCalendarCheck,
  FaChartLine,
  FaLeaf,
  FaCoins,
  FaHeart,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import QuitProgressChart from "./QuitProgressChart";
import apiService from "../utils/apiService"; // Sử dụng apiService
import { useAuth } from "../context/AuthContext";

const ProgressDashboard = ({
  userPlan,
  completionDate,
  dashboardStats: externalStats,
  actualProgress = [],
}) => {
  // Khởi tạo state với xử lý lỗi mặc định
  const [dashboardStats, setDashboardStats] = useState(null);
  const [milestones, setMilestones] = useState([]); // Tính toán thống kê
  const [hoveredMilestone, setHoveredMilestone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const { user } = useAuth(); // Lấy thông tin người dùng từ context

  // Ghi log để debug
  useEffect(() => {
    if (!userPlan) {
      console.warn("ProgressDashboard: userPlan is missing or invalid");
    }
    if (!completionDate) {
      console.warn("ProgressDashboard: completionDate is missing or invalid");
    }
  }, [userPlan, completionDate]);

  // Load user achievements from API if user is logged in
  useEffect(() => {
    if (user && user.UserID) {
      setIsLoading(true);
      apiService.achievements
        .getUserAchievements(user.UserID)
        .then((response) => {
          if (response.success && response.data) {
            setUserAchievements(response.data);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user achievements:", error);
          setError("Không thể tải dữ liệu thành tựu");
          setIsLoading(false);
        });
    }
  }, [user]);

  // Load progress data from API if user is logged in
  useEffect(() => {
    if (user && user.UserID) {
      setIsLoading(true);
      apiService.progress
        .getByUserId(user.UserID)
        .then((response) => {
          if (response.success && response.data && response.data.length > 0) {
            // Process the progress data if needed
            console.log("Progress data from API:", response.data);
            // Cập nhật dashboardStats từ dữ liệu API nếu có
            const latestProgress = response.data[response.data.length - 1];
            if (latestProgress) {
              // Cập nhật thông tin tiến độ từ API
              setDashboardStats((prevStats) => ({
                ...prevStats,
                daysSincePlanCreation:
                  latestProgress.daysSinceStart ||
                  prevStats.daysSincePlanCreation,
                cigarettesSaved:
                  latestProgress.savedCigarettes || prevStats.cigarettesSaved,
                moneySaved: latestProgress.savedMoney || prevStats.moneySaved,
                healthProgress:
                  latestProgress.healthProgress || prevStats.healthProgress,
              }));
            }
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user progress:", error);
          setError("Không thể tải dữ liệu tiến độ");
          setIsLoading(false);

          // Fallback to using localStorage data for progress
          console.log("Fallback to localStorage data for progress");
          try {
            if (typeof localStorage !== "undefined") {
              const progressData = localStorage.getItem("user_progress");
              if (progressData) {
                const parsedData = JSON.parse(progressData);
                if (parsedData) {
                  console.log(
                    "Found progress data in localStorage:",
                    parsedData
                  );
                  // Cập nhật từ localStorage
                  setDashboardStats((prevStats) => ({
                    ...prevStats,
                    daysSincePlanCreation:
                      parsedData.daysSinceStart ||
                      prevStats.daysSincePlanCreation,
                    cigarettesSaved:
                      parsedData.savedCigarettes || prevStats.cigarettesSaved,
                    moneySaved: parsedData.savedMoney || prevStats.moneySaved,
                    healthProgress:
                      parsedData.healthProgress || prevStats.healthProgress,
                  }));
                }
              }
            }
          } catch (localStorageError) {
            console.error(
              "Error reading from localStorage:",
              localStorageError
            );
          }
        });
    }
  }, [user]);

  // Đảm bảo actualProgress luôn là mảng
  const safeActualProgress = useMemo(() => {
    return Array.isArray(actualProgress) ? actualProgress : [];
  }, [actualProgress]);

  // Đảm bảo userPlan có cấu trúc hợp lệ cho các phép tính
  const safePlanConfig = useMemo(() => {
    return {
      name: userPlan?.name || "Kế hoạch cá nhân",
      weeks: Array.isArray(userPlan?.weeks) ? userPlan.weeks : [],
    };
  }, [userPlan]);

  // Sử dụng useMemo cho healthMilestones để tránh re-render không cần thiết
  const healthMilestones = useMemo(
    () => [
      {
        days: 1,
        title: "24 giờ đầu tiên",
        description: "Carbon monoxide được loại bỏ khỏi cơ thể",
        achieved: false,
      },
      {
        days: 2,
        title: "48 giờ",
        description: "Nicotine được loại bỏ, vị giác cải thiện",
        achieved: false,
      },
      {
        days: 3,
        title: "72 giờ",
        description: "Đường hô hấp thư giãn, năng lượng tăng",
        achieved: false,
      },
      {
        days: 14,
        title: "2 tuần",
        description: "Tuần hoàn máu cải thiện",
        achieved: false,
      },
      {
        days: 30,
        title: "1 tháng",
        description: "Chức năng phổi tăng 30%",
        achieved: false,
      },
      {
        days: 90,
        title: "3 tháng",
        description: "Ho và khó thở giảm đáng kể",
        achieved: false,
      },
      {
        days: 365,
        title: "1 năm",
        description: "Nguy cơ bệnh tim giảm 50%",
        achieved: false,
      },
    ],
    []
  ); // Tính toán thống kê dashboard
  const calculateDashboardStats = useCallback(() => {
    if (!userPlan || !completionDate) {
      console.log(
        "Missing userPlan or completionDate in calculateDashboardStats"
      );
      setDashboardStats({
        daysSincePlanCreation: 0,
        cigarettesSaved: 0,
        moneySaved: 0,
        planDuration: 0,
        planName: "Chưa có kế hoạch",
        healthProgress: 0,
      });
      return;
    }

    // Nếu có thống kê từ bên ngoài, sử dụng nó thay vì tính toán lại
    if (externalStats && Object.keys(externalStats).length > 0) {
      console.log("Sử dụng thống kê từ Progress.jsx:", externalStats);
      setDashboardStats({
        daysSincePlanCreation: externalStats.noSmokingDays || 0,
        cigarettesSaved: externalStats.savedCigarettes || 0,
        moneySaved: externalStats.savedMoney || 0,
        planDuration: userPlan.weeks ? userPlan.weeks.length : 0,
        planName: userPlan.name || "Kế hoạch cá nhân",
        healthProgress: externalStats.healthProgress || 0,
      });
      return;
    }

    // Tính toán thông thường nếu không có thống kê từ bên ngoài
    const startDate = new Date(completionDate);
    const today = new Date();
    // Đảm bảo daysSinceStart không âm
    const daysSinceStart = Math.max(
      0,
      Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
    );

    // Tính toán số điếu đã tiết kiệm được - đảm bảo userPlan.weeks tồn tại
    const initialCigarettesPerDay =
      userPlan.weeks && userPlan.weeks.length > 0 && userPlan.weeks[0]
        ? parseInt(userPlan.weeks[0]?.amount || 20, 10) || 20 // Double-check for NaN
        : 20;
    const estimatedSaved = initialCigarettesPerDay * daysSinceStart;

    // Tính tiền tiết kiệm dựa trên giá gói thuốc
    let packPrice = 25000; // Giá mặc định nếu không tìm thấy

    // Lấy giá gói thuốc từ activePlan nếu không có thống kê từ bên ngoài
    if (!externalStats || !externalStats.savedMoney) {
      try {
        // Kiểm tra xem localStorage có khả dụng không (có thể bị vô hiệu hóa trong private mode)
        if (typeof localStorage !== "undefined") {
          const activePlanData = localStorage.getItem("activePlan");
          if (activePlanData) {
            try {
              const activePlan = JSON.parse(activePlanData);
              if (activePlan && activePlan.packPrice) {
                const parsedPrice = parseFloat(activePlan.packPrice);
                packPrice =
                  !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 25000;
                console.log(
                  `[Dashboard] Lấy giá gói thuốc từ activePlan: ${packPrice.toLocaleString()}đ`
                );
              }
            } catch (jsonError) {
              console.error("Lỗi parse activePlan:", jsonError);
              packPrice = 25000;
            }
          }
        }
      } catch (error) {
        console.error(
          "[Dashboard] Lỗi khi đọc packPrice từ activePlan:",
          error
        );
        packPrice = 25000;
      }
    }

    // Đảm bảo packPrice là một số hợp lệ
    packPrice = !isNaN(packPrice) && packPrice > 0 ? packPrice : 25000;
    const pricePerCigarette = packPrice / 20; // Giả sử 1 gói = 20 điếu

    // Đảm bảo không có giá trị NaN hoặc Infinity
    const estimatedSavedMoney =
      !isNaN(estimatedSaved) && isFinite(estimatedSaved)
        ? estimatedSaved * pricePerCigarette
        : 0;

    const moneySaved =
      externalStats &&
      externalStats.savedMoney !== undefined &&
      externalStats.savedMoney !== null &&
      !isNaN(externalStats.savedMoney)
        ? externalStats.savedMoney
        : estimatedSavedMoney;

    setDashboardStats({
      daysSincePlanCreation: daysSinceStart,
      cigarettesSaved: estimatedSaved,
      moneySaved: moneySaved,
      planDuration: userPlan.weeks ? userPlan.weeks.length : 0,
      planName: userPlan.name || "Kế hoạch cá nhân",
      healthProgress: 0, // Giá trị mặc định
    });
  }, [userPlan, completionDate, externalStats]);
  const loadMilestones = useCallback(() => {
    // Nếu không có dữ liệu đầy đủ, không thực hiện
    if (!userPlan || !dashboardStats) {
      console.log("Missing data in loadMilestones", {
        userPlan,
        dashboardStats,
      });
      return;
    }

    // Đảm bảo dashboardStats.daysSincePlanCreation là một số
    const daysSincePlanCreation = dashboardStats.daysSincePlanCreation || 0;

    const updatedMilestones = healthMilestones.map((milestone) => ({
      ...milestone,
      achieved: daysSincePlanCreation >= milestone.days,
    }));
    setMilestones(updatedMilestones);
  }, [userPlan, dashboardStats, healthMilestones]);
  // Cập nhật thống kê dashboard khi có dữ liệu kế hoạch
  useEffect(() => {
    calculateDashboardStats();
  }, [calculateDashboardStats]);
  // Tải milestone sau khi đã có thống kê
  useEffect(() => {
    if (dashboardStats) {
      loadMilestones();
    }
  }, [dashboardStats, loadMilestones]);

  // Định nghĩa hàm giúp lấy giá trị tiến độ sức khỏe
  const getAchievementProgress = () => {
    // Nếu có giá trị từ bên ngoài, sử dụng nó
    if (dashboardStats && dashboardStats.healthProgress !== undefined) {
      return dashboardStats.healthProgress;
    }

    // Nếu không, tính toán từ milestone
    if (!milestones || milestones.length === 0) return 0;
    const achieved = milestones.filter((m) => m.achieved).length;
    return Math.min((achieved / Math.max(1, milestones.length)) * 100, 100);
  };

  // Xử lý trường hợp không có dữ liệu cần thiết
  if (!userPlan || !completionDate) {
    console.error("ProgressDashboard: Missing required data:", {
      hasUserPlan: !!userPlan,
      hasCompletionDate: !!completionDate,
    });

    return (
      <div className="dashboard-error">
        <p>Không thể hiển thị dashboard - thiếu dữ liệu cần thiết</p>
        <small>Vui lòng kiểm tra thông tin kế hoạch của bạn</small>
      </div>
    );
  }

  // Show loading state while dashboardStats is not set
  if (!dashboardStats) {
    return (
      <div className="dashboard-loading">
        <p>Đang tải dashboard...</p>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const achievementProgress = getAchievementProgress();

  // Chuẩn bị các giá trị hiển thị
  const displayValues = {
    daysSincePlanCreation: dashboardStats?.daysSincePlanCreation || 0,
    cigarettesSaved:
      externalStats && externalStats.savedCigarettes !== undefined
        ? externalStats.savedCigarettes.toLocaleString()
        : dashboardStats?.cigarettesSaved
        ? dashboardStats.cigarettesSaved.toLocaleString()
        : "0",
    moneySaved: dashboardStats?.moneySaved
      ? (dashboardStats.moneySaved / 1000).toFixed(0) + "K"
      : "0",
    healthProgress: isNaN(achievementProgress)
      ? "0"
      : achievementProgress.toFixed(0),
  };
  // Các hàm xử lý sự kiện cho milestone cards
  const handleMilestoneMouseEnter = (index) => {
    setHoveredMilestone(index);
  };

  const handleMilestoneMouseLeave = () => {
    setHoveredMilestone(null);
  };

  return (
    <div className="progress-dashboard">
      {" "}
      {/* Key Statistics */}
      <div className="dashboard-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaCalendarCheck />
          </div>{" "}
          <div className="stat-content">
            <h3>{displayValues.daysSincePlanCreation}</h3>
            <p>Ngày theo dõi</p>
          </div>
        </div>{" "}
        <div className="stat-card success">
          <div className="stat-icon">
            <FaLeaf />
          </div>{" "}
          <div className="stat-content">
            <h3>{displayValues.cigarettesSaved}</h3>
            <p>Điếu thuốc đã tránh</p>
          </div>
        </div>
        <div className="stat-card money">
          <div className="stat-icon">
            <FaCoins />
          </div>{" "}
          <div className="stat-content">
            <h3>{displayValues.moneySaved}</h3>
            <p>VNĐ đã tiết kiệm</p>
          </div>
        </div>
        <div className="stat-card health">
          <div className="stat-icon">
            <FaHeart />
          </div>
          <div className="stat-content">
            <h3>{displayValues.healthProgress}%</h3>
            <p>Milestone sức khỏe</p>
          </div>
        </div>
      </div>{" "}
      {/* Progress Chart */}
      <div className="maintenance-section">
        <h2>
          <FaChartLine className="section-icon" />
          Kế hoạch của bạn
        </h2>{" "}
        <div className="maintenance-chart">
          <QuitProgressChart
            userPlan={safePlanConfig}
            actualProgress={safeActualProgress}
            timeFilter="Tất cả"
            height={250}
          />
        </div>
      </div>
      {/* Health Milestones */}
      <div className="milestones-section">
        <h2>Milestone sức khỏe</h2>
        <div className="milestones-grid">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={`milestone-card ${
                milestone.achieved ? "achieved" : "pending"
              } ${hoveredMilestone === index ? "hovered" : ""}`}
              onMouseEnter={() => handleMilestoneMouseEnter(index)}
              onMouseLeave={handleMilestoneMouseLeave}
            >
              <div className="milestone-indicator">
                {milestone.achieved ? "✅" : "⏳"}
              </div>
              <div className="milestone-content">
                <h4>{milestone.title}</h4>
                <p>{milestone.description}</p>
                {!milestone.achieved && dashboardStats && (
                  <span className="days-remaining">
                    Còn{" "}
                    {Math.max(
                      0,
                      milestone.days -
                        (dashboardStats.daysSincePlanCreation || 0)
                    )}{" "}
                    ngày
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>{" "}
      {/* Tips section */}
      <div className="maintenance-tips-section">
        <h2>Lời khuyên duy trì</h2>

        <div className="maintenance-tips">
          <h3>💡 Mẹo hữu ích</h3>
          <ul>
            <li>Tiếp tục tránh xa môi trường có khói thuốc</li>
            <li>Duy trì các hoạt động thể chất thường xuyên</li>
            <li>Ăn uống lành mạnh để tránh tăng cân</li>
            <li>Tìm kiếm hỗ trợ từ gia đình và bạn bè</li>
            <li>Nhắc nhở bản thân về lợi ích đã đạt được</li>
          </ul>
        </div>
        <div className="support-options">
          <h3>🤝 Hỗ trợ thêm</h3>
          <div className="support-buttons">
            {" "}
            <Link
              to="/blog"
              className="support-btn primary"
              title="Tìm hiểu kinh nghiệm và chia sẻ của cộng đồng"
            >
              Tham gia cộng đồng
            </Link>
            <Link
              to="/appointment"
              className="support-btn tertiary"
              title="Nhận tư vấn 1-1 với chuyên gia"
            >
              Tư vấn chuyên gia
            </Link>
          </div>
        </div>
      </div>{" "}
      {/* Success Story */}
      <div className="success-story">
        <h2>🎉 Câu chuyện thành công của bạn</h2>
        <div className="story-content">
          <p>
            Bạn đã lập thành công <strong>{safePlanConfig.name}</strong> và duy
            trì được{" "}
            <strong>
              {dashboardStats?.daysSincePlanCreation !== undefined
                ? dashboardStats.daysSincePlanCreation
                : 0}{" "}
              ngày
            </strong>{" "}
            không hút thuốc.
          </p>{" "}
          <p>
            Trong thời gian này, bạn đã tiết kiệm được{" "}
            <strong>
              {dashboardStats?.moneySaved
                ? (dashboardStats.moneySaved / 1000).toFixed(0) + "K"
                : "0"}{" "}
              VNĐ
            </strong>{" "}
            và tránh được{" "}
            <strong>{dashboardStats?.cigarettesSaved || 0}</strong> điếu thuốc.
          </p>
          <p>
            Đây là một thành tích đáng tự hào! Hãy tiếp tục duy trì và truyền
            cảm hứng cho những người khác.
          </p>
        </div>
      </div>
    </div>
  );
};

// Tối ưu với React.memo để tránh re-render không cần thiết
export default memo(ProgressDashboard);
