import React, { useState, useEffect, useRef } from "react";
import { FaTrophy, FaShare, FaFacebook, FaTwitter, FaCopy, FaTimes, FaLock, FaClock, FaStar } from "react-icons/fa";
import "../styles/Achievement.css";

const Achievement = ({ achievements, title = "Huy hiệu đã đạt", showViewAll = true }) => {
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [shareStatus, setShareStatus] = useState({ show: false, message: '' });
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const shareMenuRef = useRef(null);
  
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

    return (
      <div className="achievements-section">
        <div className="achievements-header">
          <h1 style={{ color: "#333", fontWeight: "700" }}>{title}</h1>
          <div className="achievement-stats">
            <span className="completed-count">{completedCount}/{totalCount} hoàn thành</span>
          </div>
        </div>

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
      <AchievementContent />
      <AchievementModal />
    </>
  );
};

export default Achievement;
