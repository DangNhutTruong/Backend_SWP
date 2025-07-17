import React, { useState, useEffect } from "react";
import {
  FaUserAlt,
  FaChartLine,
  FaCalendarAlt,
  FaHeartbeat,
  FaTrophy,
  FaComment,
  FaHeart,
  FaCheckCircle,
  FaExclamationCircle,
  FaCog,
  FaBell,
  FaCrown,
  FaTimes,
  FaSignOutAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTransgender,
  FaLock,
  FaEdit,  FaSave,
  FaImage,
  FaCheck,
  FaClipboardList,
  FaArrowRight,
} from "react-icons/fa";

import "./Profile.css";
import "./membership.css";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import AppointmentList from "../components/AppointmentList";
import QuitPlanDisplay from "../components/QuitPlanDisplay";
import DailyCheckin from "../components/DailyCheckin";
import UserProfile from "./User.jsx";
import Achievement from "../components/Achievement.jsx";
import CollapsibleSection from "../components/CollapsibleSection.jsx";
import HealthProfile from "../components/HealthProfile.jsx";
import ProfilePlan from "../components/ProfilePlan.jsx";
import "../styles/CollapsibleSection.css";
import "../styles/HealthProfile.css";
import "../styles/ProfilePlan.css";
import "../styles/ModalStyles.css";
import "../styles/JournalEntry.css";
import "../styles/ProgressTracker.css";
import CoachMessaging from "./coach/CoachMessaging.jsx";
import { getUserActivePlan } from "../services/quitPlanService";

// Component Modal chỉnh sửa kế hoạch
function PlanEditModal({ isOpen, onClose, currentPlan, activePlan, onSave }) {
  // Khi modal mở, thêm class vào body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup khi component unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
    const [planData, setPlanData] = useState({
    name: activePlan?.name || currentPlan.name || "Kế hoạch cai thuốc cá nhân",
    strategy: activePlan?.strategy || currentPlan.strategy || "Cai thuốc hoàn toàn và duy trì lâu dài",
    startDate: (() => {
      try {
        if (activePlan?.start_date) {
          const date = new Date(activePlan.start_date);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        }
        
        if (currentPlan?.startDate) {
          // Kiểm tra nếu startDate là định dạng DD/MM/YYYY
          if (typeof currentPlan.startDate === 'string' && currentPlan.startDate.includes('/')) {
            const parts = currentPlan.startDate.split('/');
            if (parts.length === 3) {
              // Nếu định dạng là DD/MM/YYYY
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1; // Trừ 1 vì tháng trong JS bắt đầu từ 0
              const year = parseInt(parts[2], 10);
              const formattedDate = new Date(year, month, day);
              if (!isNaN(formattedDate.getTime())) {
                return formattedDate.toISOString().split("T")[0];
              }
            }
          }
        }
        
        // Mặc định trả về ngày hiện tại nếu không có ngày hợp lệ khác
        return new Date().toISOString().split("T")[0];
      } catch (error) {
        console.error("Lỗi khi xử lý ngày:", error);
        return new Date().toISOString().split("T")[0];
      }
    })(),
    goal: activePlan?.goal || currentPlan.goal || "Cai thuốc hoàn toàn và duy trì lâu dài",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlanData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(planData);
    onClose();
  };
  if (!isOpen) return null;
  // Bắt sự kiện click trên overlay để đóng modal
  const handleOverlayClick = (e) => {
    // Check if the click was directly on the overlay (not on its children)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Điều chỉnh kế hoạch cai thuốc</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên kế hoạch</label>
            <input
              type="text"
              name="name"
              value={planData.name}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Phương pháp cai thuốc</label>
            <select
              name="strategy"
              value={planData.strategy}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Cai thuốc hoàn toàn và duy trì lâu dài">
                Cai thuốc hoàn toàn
              </option>
              <option value="Giảm dần số điếu thuốc">Giảm dần số điếu thuốc</option>
              <option value="Sử dụng sản phẩm thay thế nicotine">
                Sử dụng sản phẩm thay thế nicotine
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Ngày bắt đầu</label>
            <input
              type="date"
              name="startDate"
              value={planData.startDate}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Mục tiêu</label>
            <textarea
              name="goal"
              value={planData.goal}
              onChange={handleChange}
              rows="3"
              className="form-control"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="save-btn">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Component cập nhật hàng ngày
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notificationCount = 0; // nếu bạn có biến này thì replace theo đúng giá trị  
  
  // Handle logout with navigation
  const handleLogout = () => {
    logout();
    navigate('/login');
  };// Check if redirected from appointment booking
  useEffect(() => {
    const savedTab = localStorage.getItem('activeProfileTab');
    if (savedTab) {
      setActiveTab(savedTab);
      // Clear the saved tab after using it
      localStorage.removeItem('activeProfileTab');
      
      // Scroll to the top of the content area
      const profileContent = document.querySelector('.profile-content');
      if (profileContent) {
        window.scrollTo({ top: profileContent.offsetTop, behavior: 'smooth' });
      }
    }
    
    // Check for hash in URL to navigate to specific section
    if (window.location.hash) {
      const hash = window.location.hash.substring(1); // remove the # symbol
      if (hash === 'achievements' || hash === 'profile' || hash === 'appointments' || hash === 'journal' || hash === 'membership' || hash === 'health') {
        setActiveTab(hash === 'health' ? 'profile' : hash);
        
        // Scroll to the top of the content area
        window.scrollTo({ top: 0, behavior: 'auto' });
        
        // Use setTimeout to ensure the DOM has updated after the tab change
        setTimeout(() => {
          const profileContent = document.querySelector('.profile-content');
          if (profileContent) {
            window.scrollTo({ top: profileContent.offsetTop, behavior: 'auto' });
          }
          
          // If it's the health section, scroll to that section
          if (hash === 'health') {
            setTimeout(() => {
              const healthSection = document.querySelector('.health-section');
              if (healthSection) {
                healthSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }
        }, 100);
      }
    }  }, []);
  
  const [activePlan, setActivePlan] = useState(null);

  // Load active plan from database with fallback to localStorage
  const loadActivePlanFromDatabase = async () => {
    try {
      console.log("🔍 PROFILE: Đang load activePlan từ database...");
      const response = await getUserActivePlan();
      
      if (response.success && response.data) {
        console.log("✅ PROFILE: Load thành công từ database:", response.data);
        setActivePlan(response.data);
        return;
      } else {
        console.warn("🔶 PROFILE: API không thành công, fallback về localStorage");
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("❌ PROFILE: Lỗi khi load từ database:", error);
      loadFromLocalStorage();
    }
  };

  // Fallback function to load from localStorage
  const loadFromLocalStorage = () => {
    try {
      // Kiểm tra kế hoạch đã hoàn thành
      const completionData = localStorage.getItem('quitPlanCompletion');
      if (completionData) {
        const parsedData = JSON.parse(completionData);
        setActivePlan(parsedData.userPlan);
        return;
      }

      // Nếu chưa hoàn thành, tải kế hoạch đang thực hiện
      const savedPlan = localStorage.getItem('activePlan');
      if (savedPlan) {
        const parsedPlan = JSON.parse(savedPlan);
        setActivePlan(parsedPlan);
      }
    } catch (error) {
      console.error('❌ PROFILE: Lỗi khi đọc localStorage:', error);
    }
  };

  useEffect(() => {
    loadActivePlanFromDatabase();
  }, []);

  // Tính toán các giá trị từ activePlan database
  const calculateSavings = () => {
    if (!user) return { days: 0, money: 0, cigarettes: 0 };
    if (!activePlan?.start_date) return { days: 0, money: 0, cigarettes: 0 }; // Sử dụng start_date từ database

    let startDate;
    try {
      // Ưu tiên dùng start_date từ database
      startDate = new Date(activePlan.start_date);
      
      if (isNaN(startDate.getTime())) {
        console.warn("🔶 PROFILE: Ngày bắt đầu từ database không hợp lệ:", activePlan.start_date);
        return { days: 0, money: 0, cigarettes: 0 };
      }
    } catch (error) {
      console.error("❌ PROFILE: Lỗi parse ngày bắt đầu:", error);
      return { days: 0, money: 0, cigarettes: 0 };
    }

    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    // Lấy số điếu từ database (initial_cigarettes hoặc parse từ plan_details)
    let cigarettesPerDay = 0;
    if (activePlan.initial_cigarettes) {
      cigarettesPerDay = activePlan.initial_cigarettes;
    } else if (activePlan.plan_details) {
      try {
        const parsedDetails = JSON.parse(activePlan.plan_details);
        cigarettesPerDay = parsedDetails.initialCigarettes || 0;
      } catch (error) {
        console.error("❌ PROFILE: Lỗi parse plan_details:", error);
      }
    }

    const pricePerPack = 50000; // 50,000 VND per pack
    const cigarettesPerPack = 20;
    const totalCigarettesSaved = daysDiff * cigarettesPerDay;
    const totalMoneySaved = (totalCigarettesSaved / cigarettesPerPack) * pricePerPack;

    console.log("💰 PROFILE: Tính toán tiết kiệm:", {
      daysDiff,
      cigarettesPerDay,
      totalCigarettesSaved,
      totalMoneySaved,
      activePlan: activePlan.plan_name
    });

    return {
      days: daysDiff,
      money: totalMoneySaved,
      cigarettes: totalCigarettesSaved
    };
  };
  // Đảm bảo giá trị savings được tính sau khi activePlan đã được cập nhật
  const savings = calculateSavings();
  
  // Debug: Kiểm tra giá trị savings để tính huy hiệu
  console.log('🏆 ACHIEVEMENT DEBUG - savings.days:', savings.days);
  console.log('🏆 ACHIEVEMENT DEBUG - activePlan?.start_date:', activePlan?.start_date);
  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "01/05/2023"; // Default date
      
      // Xử lý định dạng DD/MM/YYYY
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Ưu tiên để định dạng hiển thị VN
          return dateString;
        }
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn("Ngày không hợp lệ:", dateString);
        return "01/05/2023";
      }
      
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      console.error("Lỗi khi định dạng ngày:", error);
      return "01/05/2023";
    }
  };
    // Dữ liệu người dùng mẫu - chỉ sử dụng cho các giá trị không có trong user
  const userData = {
    ...user,
    avatar: user?.avatar || "/image/hero/quit-smoking-2.png",
    daysWithoutSmoking: savings.days,
    moneySaved: savings.money,
    pointsEarned: savings.cigarettes,
    startDate: activePlan?.start_date ? formatDate(activePlan.start_date) : formatDate(user?.startDate),
    cigarettesPerDay: activePlan?.initial_cigarettes || user?.cigarettesPerDay || 20,
    costPerDay:
      (user?.costPerPack / user?.cigarettesPerPack) * (activePlan?.initial_cigarettes || user?.cigarettesPerDay || 20) ||
      30000,    yearsOfSmoking: 8,
    fagerstromScore: "8/10",
    // Không sử dụng healthImprovements cứng ở đây nữa,
    // HealthProfile sẽ tự tạo từ activePlan
    milestones: activePlan?.start_date ? [
      {
        id: 1,
        name: "Chuẩn bị cai thuốc",
        date: new Date(
          new Date(activePlan.start_date).getTime() - 86400000
        ).toLocaleDateString("vi-VN"),
        completed: true,
      },
      {
        id: 2,
        name: "Ngày đầu tiên không hút thuốc",
        date: new Date(activePlan.start_date).toLocaleDateString("vi-VN"),
        completed: savings.days >= 1,
      },
      {
        id: 3,
        name: "Tuần đầu tiên không hút",
        date: new Date(
          new Date(activePlan.start_date).getTime() + 7 * 86400000
        ).toLocaleDateString("vi-VN"),
        completed: savings.days >= 7,
      },
      {
        id: 4,
        name: "Duy trì 3 tháng không hút thuốc",
        progress: `${Math.min(savings.days, 90)}/90 ngày`,
        completed: savings.days >= 90,
      },
    ] : [ // Trường hợp không có kế hoạch cai thuốc
      {
        id: 1,
        name: "Chuẩn bị cai thuốc",
        date: "Chưa bắt đầu",
        completed: false,
      },
      {
        id: 2, 
        name: "Ngày đầu tiên không hút thuốc",
        date: "Chưa bắt đầu",
        completed: false,
      },
      {
        id: 3,
        name: "Tuần đầu tiên không hút thuốc",
        date: "Chưa bắt đầu",
        completed: false,
      },
      {
        id: 4,
        name: "Duy trì 3 tháng không hút thuốc",
        progress: "0/90 ngày",
        completed: false,
      },
    ],    achievements: [
      {
        id: 1,
        name: "24 giờ đầu tiên",
        date: savings.days >= 1 ? "Đã hoàn thành" : "",
        icon: "⭐",
        description: "Hoàn thành 24 giờ đầu tiên không hút thuốc"
      },
      {
        id: 2,
        name: "1 tuần không hút",
        date: savings.days >= 7 ? "Đã hoàn thành" : "",
        icon: "🏅",
        description: "Hoàn thành 1 tuần không hút thuốc"
      },
      {
        id: 3,
        name: "2 tuần không hút",
        date: savings.days >= 14 ? "Đã hoàn thành" : "",
        icon: "🏆",
        description: "Hoàn thành 2 tuần không hút thuốc"
      },
      {
        id: 4,
        name: "1 tháng không hút",
        date: savings.days >= 30 ? "Đã hoàn thành" : "",
        icon: "👑",
        description: "Hoàn thành 1 tháng không hút thuốc"
      },
    ],
    journalEntries: [
      {
        id: 1,
        day: savings.days,
        date: "Hôm nay",
        mood: "Bình thường",
        symptoms: "Không có triệu chứng",
        notes: '"Hôm nay là một ngày bình thường, không có cảm giác thèm thuốc."',
      },
      {
        id: 2,
        day: savings.days - 1,
        date: "Hôm qua",
        mood: "Tốt",
        symptoms: "Không có triệu chứng",
        notes:
          '"Cảm thấy rất tự hào về bản thân, hôm nay tôi đã từ chối một điếu thuốc từ đồng nghiệp."',
      },
    ],
  };
  // Xử lý cập nhật hôm nay
  const handleUpdateToday = (updateData) => {
    console.log("Cập nhật mới:", updateData);
    alert("Đã lưu cập nhật của bạn!");
  };  // Xử lý lưu kế hoạch
  const handleSavePlan = (planData) => {
    try {
      console.log("🎯 PROFILE: Đang lưu kế hoạch cai thuốc...", planData);
      // Lấy kế hoạch cài đặt hiện tại từ localStorage
      let currentPlanData;
      const completionData = localStorage.getItem('quitPlanCompletion');
      if (completionData) {
        const parsedData = JSON.parse(completionData);
        currentPlanData = parsedData.userPlan;
      } else {
        const savedPlan = localStorage.getItem('activePlan');
        if (savedPlan) {
          currentPlanData = JSON.parse(savedPlan);
        }
      }
      
      // Kiểm tra và chuẩn hóa định dạng ngày tháng
      let validStartDate = planData.startDate;
      try {
        // Đảm bảo rằng startDate là một chuỗi ngày tháng hợp lệ
        const date = new Date(planData.startDate);
        if (!isNaN(date.getTime())) {
          // Lưu trữ theo định dạng ISO để đảm bảo tính nhất quán
          validStartDate = date.toISOString();
        } else {
          console.error("Ngày không hợp lệ:", planData.startDate);
          validStartDate = new Date().toISOString();
        }
      } catch (error) {
        console.error("Lỗi khi xử lý ngày:", error);
        validStartDate = new Date().toISOString();
      }
      
      // Cập nhật thông tin mới vào kế hoạch
      if (currentPlanData) {        const updatedPlan = {
          ...currentPlanData,
          name: planData.name || "Kế hoạch cai thuốc cá nhân",
          strategy: planData.strategy,
          goal: planData.goal,
          startDate: validStartDate
        };
        
        console.log("✅ PROFILE: Đã tạo kế hoạch cập nhật:", updatedPlan);
        
        // Lưu lại vào localStorage
        if (completionData) {
          const updatedCompletion = JSON.parse(completionData);
          updatedCompletion.userPlan = updatedPlan;
          localStorage.setItem('quitPlanCompletion', JSON.stringify(updatedCompletion));
          console.log("✅ PROFILE: Đã lưu vào quitPlanCompletion");
        } else {
          localStorage.setItem('activePlan', JSON.stringify(updatedPlan));
          console.log("✅ PROFILE: Đã lưu vào activePlan");
        }
        
        // Cập nhật state
        setActivePlan(updatedPlan);
        alert("Đã lưu cập nhật kế hoạch thành công!");
      } else {
        // Nếu không có kế hoạch hiện tại, tạo kế hoạch mới
        const newPlan = {
          name: "Kế hoạch cai thuốc cá nhân",
          strategy: planData.strategy,
          goal: planData.goal,
          startDate: validStartDate,
          initialCigarettes: 20,
          packPrice: 30000,
          weeks: [
            { week: 1, amount: 20, completed: false },
            { week: 2, amount: 15, completed: false },
            { week: 3, amount: 10, completed: false },
            { week: 4, amount: 5, completed: false },
            { week: 5, amount: 0, completed: false },
          ]
        };
        
        console.log("✅ PROFILE: Tạo kế hoạch mới:", newPlan);
        localStorage.setItem('activePlan', JSON.stringify(newPlan));
        setActivePlan(newPlan);
        alert("Đã tạo kế hoạch cai thuốc mới!");
      }
    } catch (error) {
      console.error("❌ PROFILE: Lỗi khi lưu kế hoạch:", error);
      alert("Có lỗi xảy ra khi lưu kế hoạch. Vui lòng thử lại sau.");
    }
  };return (
    <div className="profile-container">
      {/* Sidebar */}
      <div className="profile-sidebar">
        <nav className="profile-nav">
          <div className="nav-top-group">
            <Link
              to="#"
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("profile");
                // Scroll to the top of the content area
                const profileContent = document.querySelector('.profile-content');
                if (profileContent) {
                  setTimeout(() => {
                    profileContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 10);
                }
              }}
            >
              <FaUserAlt /> Hồ sơ cá nhân
            </Link>

          <Link
            to="#"
            className={`nav-item ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("appointments");
              const profileContent = document.querySelector('.profile-content');
              if (profileContent) {
                setTimeout(() => {
                  profileContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 10);
              }
            }}
          >
            <FaCalendarAlt /> Lịch hẹn Coach
          </Link>

          {/* Mục Nhắn tin tích hợp chat coach */}
          <button
            className={`nav-item${activeTab === "coach-messaging" ? " active" : ""}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: activeTab === 'coach-messaging' ? '#1976d2' : 'none', // Blue when active
              color: activeTab === 'coach-messaging' ? '#fff' : 'inherit',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'coach-messaging' ? 'bold' : 'normal',
              boxShadow: activeTab === 'coach-messaging' ? '0 2px 8px rgba(25, 118, 210, 0.08)' : 'none',
            }}
            onClick={() => setActiveTab('coach-messaging')}
          >
            <FaComment /> Nhắn tin
          </button>

          <Link
            to="#"
            className={`nav-item ${activeTab === "achievements" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("achievements");
              const profileContent = document.querySelector('.profile-content');
              if (profileContent) {
                setTimeout(() => {
                  profileContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 10);
              }
            }}
          >            <FaTrophy /> Huy hiệu          </Link>
          </div>
          
          <div className="nav-bottom-group">
            <button onClick={handleLogout} className="nav-item logout-btn">
              <FaSignOutAlt /> Đăng xuất
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="profile-content">
        {activeTab === "profile" && (
          <div className="profile-overview">
            <div className="section-header">
              <h1>Hồ sơ</h1>
            </div>
            
            <div className="profile-sections">
              {/* Thông tin cá nhân - sử dụng component UserProfile */}
              <div className="profile-main-content">
                <UserProfile isStandalone={false} />
                <div className="action-buttons-container">
                </div>
              </div>
              
              <div className="profile-collapsible-sections">
                {/* Sử dụng CollapsibleSection cho Hồ sơ sức khỏe */}
                <CollapsibleSection 
                  title="Hồ sơ sức khỏe" 
                  icon={<FaHeartbeat />}
                  defaultOpen={false}
                  className="health-collapsible"
                >                  <HealthProfile 
                    healthData={{
                      stats: {
                        smokingHistory: `${userData.yearsOfSmoking} năm`,
                        dailyConsumption: `${activePlan?.initial_cigarettes || userData.cigarettesPerDay} điếu/ngày`,
                        quitAttempts: "2 lần",
                        healthIssues: "Tình trạng sức khỏe ban đầu",
                        bloodPressure: "Chưa cập nhật",
                        heartRate: "Chưa cập nhật",
                        oxygenLevel: "Chưa cập nhật",
                        respiratoryRate: "Chưa cập nhật"
                      },
                      // Không dùng userData.healthImprovements nữa, để component tự tạo từ activePlan
                      onUpdateStats: (updatedStats) => {
                        console.log('Cập nhật thông tin sức khỏe:', updatedStats);
                        // Thêm logic cập nhật nếu cần
                      }
                    }}
                    activePlan={activePlan} // Truyền activePlan để tạo milestone sức khỏe từ kế hoạch
                  />
                </CollapsibleSection>
                
                {/* Sử dụng CollapsibleSection cho Kế hoạch cai thuốc */}                <CollapsibleSection 
                  title="Kế hoạch cai thuốc" 
                  icon={<FaClipboardList />}
                  defaultOpen={false}
                  className="plan-collapsible"
                >                  <ProfilePlan 
                    planData={{
                      strategy: activePlan?.strategy || "Cai thuốc hoàn toàn và duy trì lâu dài",
                      startDate: activePlan?.start_date ? new Date(activePlan.start_date).toLocaleDateString('vi-VN') : null, // Không sử dụng userData.startDate khi không có activePlan
                      goal: activePlan?.goal || "Cải thiện sức khỏe và tiết kiệm chi phí",
                      initialCigarettes: activePlan?.initial_cigarettes,
                      weeks: activePlan?.weeks || [],
                      totalWeeks: activePlan?.weeks?.length || 0,
                      packPrice: activePlan?.packPrice,
                      milestones: userData.milestones
                    }}
                    activePlan={activePlan} // Truyền toàn bộ activePlan để có thể truy cập tất cả dữ liệu
                  />
                </CollapsibleSection>
              </div>
            </div>
          </div>
        )}        {activeTab === "membership" && (
          <div className="membership-section">
            <h1>Thông tin Thành viên</h1>

            <div className="membership-status">
              <div className="card membership-status-card">
                <h2>Trạng thái thành viên</h2>
                <div className="membership-status-info">
                  {userData.membershipType && userData.membershipType !== 'free' ? (
                    <div className="current-membership">
                      <div className="membership-badge-large">
                        <FaCrown className={userData.membershipType === "premium" ? "premium-icon" : "pro-icon"} />
                        <span className={`membership-type ${userData.membershipType}`}>
                          {userData.membershipType === "premium" ? "Premium" : "Pro"}
                        </span>
                      </div>
                      <p className="membership-description">
                        {userData.membershipType === "premium" 
                          ? "Bạn đang sử dụng gói Premium với đầy đủ tính năng hỗ trợ." 
                          : "Bạn đang sử dụng gói Pro với đầy đủ tính năng hàng năm."}
                      </p>
                    </div>
                  ) : (
                    <div className="free-membership">
                      <p>Bạn đang sử dụng gói Miễn phí</p>
                      <button className="upgrade-btn" onClick={() => navigate('/membership')}>
                        Nâng cấp ngay
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="membership-features">
              <h2>Tính năng của bạn</h2>
              <div className="feature-list">
                <div className="feature-item">
                  <FaCheck className="feature-check" />
                  <div className="feature-text">
                    <h3>Theo dõi cai thuốc</h3>
                    <p>Theo dõi tiến trình cai thuốc của bạn hàng ngày</p>
                  </div>
                </div>
                <div className="feature-item">
                  <FaCheck className="feature-check" />
                  <div className="feature-text">
                    <h3>Lập kế hoạch cá nhân</h3>
                    <p>Tạo kế hoạch cai thuốc phù hợp với bạn</p>
                  </div>
                </div>
                
                {userData.membershipType && userData.membershipType !== 'free' ? (
                  <>
                    <div className="feature-item">
                      <FaCheck className="feature-check" />
                      <div className="feature-text">
                        <h3>Huy hiệu & cộng đồng</h3>
                        <p>Tham gia cộng đồng và nhận huy hiệu</p>
                      </div>
                    </div>
                    <div className="feature-item">
                      <FaCheck className="feature-check" />
                      <div className="feature-text">
                        <h3>Chat huấn luyện viên</h3>
                        <p>Nhận tư vấn từ huấn luyện viên chuyên nghiệp</p>
                      </div>
                    </div>
                    <div className="feature-item">
                      <FaCheck className="feature-check" />
                      <div className="feature-text">
                        <h3>Video call tư vấn</h3>
                        <p>Tham gia các buổi tư vấn qua video</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="feature-item disabled">
                      <FaTimes className="feature-times" />
                      <div className="feature-text">
                        <h3>Huy hiệu & cộng đồng</h3>
                        <p>Nâng cấp để mở khóa tính năng này</p>
                      </div>
                    </div>
                    <div className="feature-item disabled">
                      <FaTimes className="feature-times" />
                      <div className="feature-text">
                        <h3>Chat huấn luyện viên</h3>
                        <p>Nâng cấp để mở khóa tính năng này</p>
                      </div>
                    </div>
                    <div className="feature-item disabled">
                      <FaTimes className="feature-times" />
                      <div className="feature-text">
                        <h3>Video call tư vấn</h3>
                        <p>Nâng cấp để mở khóa tính năng này</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {!userData.membershipType || userData.membershipType === 'free' ? (
                <div className="membership-upgrade">
                  <h3>Nâng cấp để sử dụng đầy đủ tính năng</h3>
                  <button className="upgrade-btn-large" onClick={() => navigate('/membership')}>
                    Khám phá gói thành viên
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}        {activeTab === "achievements" && (
          <Achievement achievements={userData.achievements} />
        )}

        {activeTab === "appointments" && (
          <div className="appointments-section">
            <h1>Lịch hẹn Coach</h1>
            <AppointmentList />
          </div>
        )}        {activeTab === "journal" && (
          <div className="journal-section">
            <h1>Cập nhật hàng ngày</h1>

            <DailyCheckin
              onProgressUpdate={(data) => {
                console.log("Dữ liệu cập nhật:", data);
                alert("Đã lưu cập nhật của bạn!");
              }}
            />
          </div>        )}
        {activeTab === "coach-messaging" && (
          <CoachMessaging />
        )}
        {/* Modal chỉnh sửa kế hoạch */}
        <PlanEditModal
          isOpen={isPlanEditOpen}
          onClose={() => setIsPlanEditOpen(false)}
          currentPlan={{
            strategy: activePlan?.strategy || "Cai thuốc hoàn toàn và duy trì lâu dài",
            startDate: activePlan?.start_date || userData.startDate,
            goal: activePlan?.goal || "Cải thiện sức khỏe và tiết kiệm chi phí",
          }}
          activePlan={activePlan}
          onSave={handleSavePlan}
        />
      </div>
    </div>
  );
}
