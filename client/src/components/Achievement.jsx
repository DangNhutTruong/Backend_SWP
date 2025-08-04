import React, { useState, useEffect, useRef } from "react";
import { FaTrophy, FaShare, FaFacebook, FaTwitter, FaCopy, FaTimes, FaLock, FaClock, FaStar, FaSpinner, FaCheckCircle } from "react-icons/fa";
import achievementService from "../services/achievementService";
import achievementAwardService from "../services/achievementAwardService";
import { useAuth } from "../context/AuthContext";
import "../styles/Achievement.css";

const Achievement = ({ userId, title = "Huy hiệu đã đạt", showViewAll = true }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [shareStatus, setShareStatus] = useState({ show: false, message: '' });
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const shareMenuRef = useRef(null);

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  // Hàm lấy icon dựa trên tên huy hiệu
  const getAchievementIcon = (achievementName) => {
    // Huy hiệu thời gian
    if (achievementName.includes('24 giờ')) return '⏰';
    if (achievementName.includes('3 ngày')) return '🌟';
    if (achievementName.includes('1 tuần')) return '💎';
    if (achievementName.includes('1 tháng')) return '👑';
    if (achievementName.includes('6 tháng')) return '🚀';
    if (achievementName.includes('1 năm')) return '🎊';
    
    // Huy hiệu sức khỏe  
    if (achievementName.includes('Giảm 25%')) return '💪';
    if (achievementName.includes('Giảm 50%')) return '🎯';
    if (achievementName.includes('Giảm 75%')) return '🔥';
    if (achievementName.includes('Hoàn toàn')) return '🏆';
    
    // Huy hiệu tiết kiệm
    if (achievementName.includes('50,000') || achievementName.includes('50.000')) return '🪙';
    if (achievementName.includes('500,000') || achievementName.includes('500.000')) return '💳';
    if (achievementName.includes('1 triệu')) return '💰';
    if (achievementName.includes('5 triệu')) return '💎';
    if (achievementName.includes('10 triệu')) return '🏦';
    if (achievementName.includes('tiết kiệm')) return '💵';
    
    return '🏅'; // Default medal icon
  };

  // Tải huy hiệu từ API và kiểm tra award mới
  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Achievement Component Debug:');
      console.log('- userId:', userId);
      console.log('- user:', user);

      // Luôn luôn cố gắng lấy tất cả achievements trước
      console.log('📍 Đang lấy tất cả huy hiệu từ database...');
      const allAchievementsResponse = await achievementService.getAllAchievements();
      console.log('📊 All Achievements Response:', allAchievementsResponse);

      if (allAchievementsResponse.success) {
        // Nếu user đã đăng nhập, cố gắng lấy thêm thông tin đã đạt được
        let userAchievements = [];
        if (user && user.id) {
          console.log('📍 User đã đăng nhập, cố gắng lấy achievements của user...');
          
          // Kiểm tra và award huy hiệu mới trước
          await checkAndAwardNewAchievements();
          
          const userResponse = await achievementService.getMyAchievements();
          console.log('📊 User Achievements Response:', userResponse);
          
          if (userResponse.success) {
            userAchievements = userResponse.data;
          }
        }

        // Merge dữ liệu: tất cả achievements + thông tin đã đạt được (nếu có)
        const formattedAchievements = allAchievementsResponse.data.map(achievement => {
          // Tìm achievement tương ứng trong user achievements
          const userAchievement = userAchievements.find(ua => ua.id === achievement.id);
          
          return {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: getAchievementIcon(achievement.name),
            category: getCategoryFromName(achievement.name),
            completed: !!userAchievement?.achieved_at,
            date: userAchievement?.achieved_at ? new Date(userAchievement.achieved_at) : null,
            progressText: userAchievement?.achieved_at ? 
              `Đạt được: ${new Intl.DateTimeFormat('vi-VN').format(new Date(userAchievement.achieved_at))}` : 
              'Chưa đạt được'
          };
        });
        
        console.log('✅ Formatted achievements:', formattedAchievements);
        setAchievements(formattedAchievements);
      } else {
        console.error('❌ Không thể lấy achievements từ database');
        setError("Không thể tải huy hiệu từ database: " + (allAchievementsResponse.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error("❌ Error loading achievements:", error);
      setError("Có lỗi xảy ra khi tải dữ liệu huy hiệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra và award huy hiệu mới
  const checkAndAwardNewAchievements = async () => {
    try {
      const userProgress = calculateUserProgress();
      console.log('🏆 Checking achievements with progress:', userProgress);
      
      const awardResult = await achievementAwardService.checkAndAwardAchievements(userProgress);
      
      if (awardResult.success && awardResult.newAchievements.length > 0) {
        console.log('🎉 New achievements awarded:', awardResult.newAchievements);
        
        // Hiển thị thông báo huy hiệu mới
        achievementAwardService.showAchievementNotification(awardResult.newAchievements);
      }
    } catch (error) {
      console.error('❌ Error checking new achievements:', error);
    }
  };

  // Tính toán tiến trình của user từ localStorage (giống Profile)
  const calculateUserProgress = () => {
    try {
      // Lấy dữ liệu từ localStorage
      const dashboardStats = localStorage.getItem('dashboardStats');
      if (dashboardStats) {
        const stats = JSON.parse(dashboardStats);
        return {
          days: stats.daysWithoutSmoking || 0,
          money: stats.savedMoney || 0,
          cigarettes: stats.savedCigarettes || 0
        };
      }

      // Fallback: tính từ activePlan
      const activePlan = localStorage.getItem('activePlan');
      if (activePlan) {
        const plan = JSON.parse(activePlan);
        if (plan.startDate) {
          const startDate = new Date(plan.startDate);
          const currentDate = new Date();
          const timeDiff = currentDate.getTime() - startDate.getTime();
          const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
          
          const cigarettesPerDay = plan.initialCigarettes || 20;
          const savedCigarettes = daysDiff * cigarettesPerDay;
          const savedMoney = savedCigarettes * 2500; // 2500 VND/điếu
          
          return {
            days: daysDiff,
            money: savedMoney,
            cigarettes: savedCigarettes
          };
        }
      }

      return { days: 0, money: 0, cigarettes: 0 };
    } catch (error) {
      console.error('❌ Error calculating user progress:', error);
      return { days: 0, money: 0, cigarettes: 0 };
    }
  };

  // Xác định category dựa trên tên huy hiệu
  const getCategoryFromName = (name) => {
    if (name.includes('giờ') || name.includes('ngày') || name.includes('tuần') || name.includes('tháng') || name.includes('năm')) {
      return 'time';
    }
    if (name.includes('Giảm') || name.includes('lượng thuốc') || name.includes('phổi')) {
      return 'health';
    }
    if (name.includes('tiết kiệm') || name.includes('chi phí') || name.includes('triệu') || name.includes('đồng')) {
      return 'money';
    }
    return 'health'; // Default
  };
  
  // Lọc huy hiệu theo category
  const getFilteredAchievements = () => {
    if (activeCategory === 'all') return achievements;
    return achievements.filter(achievement => achievement.category === activeCategory);
  };

  // Nhóm huy hiệu theo category
  const getAchievementsByCategory = () => {
    const categories = {
      time: { name: 'Thời gian cai thuốc', icon: '⏰', achievements: [] },
      health: { name: 'Cải thiện sức khỏe', icon: '❤️', achievements: [] },
      money: { name: 'Tiết kiệm tài chính', icon: '💰', achievements: [] }
    };
    
    achievements.forEach(achievement => {
      if (categories[achievement.category]) {
        categories[achievement.category].achievements.push(achievement);
      }
    });
    
    return categories;
  };
  
  // Đóng menu share khi nhấn ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Đóng thông báo chia sẻ sau 3 giây
  useEffect(() => {
    if (shareStatus.show) {
      const timer = setTimeout(() => {
        setShareStatus({ show: false, message: '' });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [shareStatus]);
  
  // Hiển thị thông báo chia sẻ thành công
  const showShareNotification = (message) => {
    setShareStatus({
      show: true,
      message: message
    });
  };
    
  
  
  // Hàm để chia sẻ huy hiệu đạt được
  const handleShareAchievement = (achievement, platform = null) => {
    // Đóng menu chia sẻ
    setShowShareMenu(null);
    
    // Tạo nội dung chia sẻ
    const shareContent = `
🏆 Tôi đã đạt được huy hiệu "${achievement.name}" trong hành trình cai thuốc lá!
📅 ${achievement.progressText}
🎯 ${achievement.reward}
💪 Hãy tham gia cùng tôi trong hành trình hướng tới một cuộc sống khỏe mạnh hơn!
    `;
    
    // Xử lý chia sẻ dựa trên nền tảng được chọn
    if (platform === 'facebook') {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareContent)}`;
      window.open(facebookUrl, '_blank');
      showShareNotification('Đã mở cửa sổ chia sẻ Facebook');
    } 
    else if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent)}`;
      window.open(twitterUrl, '_blank');
      showShareNotification('Đã mở cửa sổ chia sẻ Twitter');
    }
    else if (platform === 'copy') {
      try {
        navigator.clipboard.writeText(shareContent);
        showShareNotification('Đã sao chép thông tin huy hiệu!');
      } catch (err) {
        // Fallback cho các trình duyệt không hỗ trợ clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showShareNotification('Đã sao chép thông tin huy hiệu!');
      }
    } else {
      // Hiển thị menu chia sẻ tùy chỉnh
      setShowShareMenu(achievement.id);
    }
  };

  // Đóng menu chia sẻ
  const closeShareMenu = (e) => {
    e.stopPropagation();
    setShowShareMenu(null);
  };
  
 

  // Content component
  const AchievementContent = () => {
    const completedCount = achievements.filter(a => a.completed).length;
    const totalCount = achievements.length;

    // Xác định thông báo phù hợp
    let statusMessage = '';
    if (user && user.id && completedCount === 0) {
      statusMessage = "Bạn chưa đạt được huy hiệu nào. Hãy bắt đầu hành trình cai thuốc!";
    } else if (!user) {
      statusMessage = "Đăng nhập để xem tiến trình huy hiệu của bạn!";
    }

    return (
      <div className="achievements-section">
        <div className="achievements-header">
          <h1 style={{ color: "#333", fontWeight: "700" }}>{title}</h1>
          <div className="achievement-stats">
            <span className="completed-count">{completedCount}/{totalCount} hoàn thành</span>
            {user && user.id && (
              <button 
                className="check-achievements-btn"
                onClick={async () => {
                  setLoading(true);
                  await checkAndAwardNewAchievements();
                  await loadAchievements();
                  setLoading(false);
                }}
                style={{
                  marginLeft: '15px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                }}
                disabled={loading}
              >
                {loading ? '🔄 Đang kiểm tra...' : '🏆 Kiểm tra huy hiệu mới'}
              </button>
            )}
          </div>
        </div>

        {/* Hiển thị thông báo status nếu có */}
        {statusMessage && (
          <div className="status-message" style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px', 
            margin: '20px 0',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
              ✨ {statusMessage}
            </p>
          </div>
        )}

        {shareStatus.show && (
          <div className="share-notification">
            <p>{shareStatus.message}</p>
          </div>
        )}

        {/* Category Filter */}
        <div className="category-filter">
          <button 
            className={activeCategory === 'all' ? 'active' : ''}
            onClick={() => setActiveCategory('all')}
          >
            Tất cả
          </button>
          <button 
            className={activeCategory === 'time' ? 'active' : ''}
            onClick={() => setActiveCategory('time')}
          >
            ⏰ Thời gian
          </button>
          <button 
            className={activeCategory === 'health' ? 'active' : ''}
            onClick={() => setActiveCategory('health')}
          >
            ❤️ Sức khỏe
          </button>
          <button 
            className={activeCategory === 'money' ? 'active' : ''}
            onClick={() => setActiveCategory('money')}
          >
            💰 Tiết kiệm
          </button>
        </div>

        <div className="achievements-grid">
          {getFilteredAchievements().map((achievement) => {
            const getCardClass = () => {
              if (achievement.completed) return 'achievement-card completed';
              return 'achievement-card locked';
            };

            const getStatusIcon = () => {
              if (achievement.completed) return <FaStar className="status-icon completed" />;
              return <FaLock className="status-icon locked" />;
            };

            return (
              <div key={achievement.id} className={getCardClass()}>
                <div className="achievement-header">
                  <div className="achievement-icon">{achievement.icon}</div>
                  {getStatusIcon()}
                </div>
                
                <h3 className="achievement-name">{achievement.name}</h3>
                <p className="achievement-description">{achievement.description}</p>
                
                <div className="achievement-progress">
                  <span className="progress-text">{achievement.progressText}</span>
                </div>

                {achievement.completed && achievement.date && (
                  <div className="achievement-date">
                    <FaCheckCircle />
                    <span>Đạt được: {new Intl.DateTimeFormat('vi-VN').format(new Date(achievement.date))}</span>
                  </div>
                )}
                
                {achievement.completed && (
                  <div className="share-container">
                    <button 
                      className="share-achievement-btn"
                      onClick={() => handleShareAchievement(achievement)}
                    >
                      <FaShare /> Chia sẻ
                    </button>
                    
                    {showShareMenu === achievement.id && (
                      <div className="share-menu" ref={shareMenuRef}>
                        <button onClick={() => handleShareAchievement(achievement, 'facebook')}>
                          <FaFacebook /> Facebook
                        </button>
                        <button onClick={() => handleShareAchievement(achievement, 'twitter')}>
                          <FaTwitter /> Twitter
                        </button>
                        <button onClick={() => handleShareAchievement(achievement, 'copy')}>
                          <FaCopy /> Sao chép
                        </button>
                        <button onClick={closeShareMenu} className="close-menu">
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  // Modal hiển thị tất cả huy hiệu
  const AchievementModal = () => {
    if (!showAllAchievements) return null;

    const categories = getAchievementsByCategory();

    return (
      <div className="achievement-modal-overlay" onClick={() => setShowAllAchievements(false)}>
        <div className="achievement-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>🏆 Tất cả huy hiệu</h2>
            <button 
              className="close-modal"
              onClick={() => setShowAllAchievements(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-content">
            {Object.entries(categories).map(([key, category]) => (
              <div key={key} className="category-section">
                <h3 className="category-title">
                  {category.icon} {category.name}
                </h3>
                <div className="achievements-grid">
                  {category.achievements.map((achievement) => {
                    const getCardClass = () => {
                      if (achievement.completed) return 'achievement-card completed';
                      return 'achievement-card locked';
                    };

                    const getStatusIcon = () => {
                      if (achievement.completed) return <FaStar className="status-icon completed" />;
                      return <FaLock className="status-icon locked" />;
                    };

                    return (
                      <div key={achievement.id} className={getCardClass()}>
                        <div className="achievement-header">
                          <div className="achievement-icon">{achievement.icon}</div>
                          {getStatusIcon()}
                        </div>
                        
                        <h3 className="achievement-name">{achievement.name}</h3>
                        <p className="achievement-description">{achievement.description}</p>
                        
                        <div className="achievement-progress">
                          <span className="progress-text">{achievement.progressText}</span>
                          {!achievement.completed && achievement.progress !== undefined && achievement.targetDays && (
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${(achievement.progress / achievement.targetDays) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>

                        {achievement.reward && (
                          <div className="achievement-reward">
                            <small>🎁 {achievement.reward}</small>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <div className="achievements-loading">
          <FaSpinner className="spinning" />
          <p>Đang tải huy hiệu...</p>
        </div>
      ) : error ? (
        <div className="achievements-error">
          <p>{error}</p>
          <button onClick={loadAchievements}>Thử lại</button>
        </div>
      ) : (
        <>
          <AchievementContent />
          <AchievementModal />
        </>
      )}
    </>
  );
};

export default Achievement;
