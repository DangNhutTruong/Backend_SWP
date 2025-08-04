import achievementService from './achievementService';

class AchievementAwardService {
  // Kiểm tra và award huy hiệu dựa trên tiến trình user
  async checkAndAwardAchievements(userProgress) {
    try {
      console.log('🏆 AWARD SERVICE: Checking achievements for progress:', userProgress);
      
      const { days, money, cigarettes } = userProgress;
      const newAchievements = [];
      
      // Lấy tất cả huy hiệu hiện có
      const allAchievementsResponse = await achievementService.getAllAchievements();
      if (!allAchievementsResponse.success) {
        console.error('❌ Không thể lấy danh sách achievements');
        return { success: false, newAchievements: [] };
      }
      
      // Lấy huy hiệu user đã có
      const userAchievementsResponse = await achievementService.getMyAchievements();
      const userAchievements = userAchievementsResponse.success ? userAchievementsResponse.data : [];
      const completedIds = userAchievements.map(ua => ua.id);
      
      console.log('🔍 Completed achievement IDs:', completedIds);
      
      // Kiểm tra từng huy hiệu
      for (const achievement of allAchievementsResponse.data) {
        // Bỏ qua nếu đã hoàn thành
        if (completedIds.includes(achievement.id)) {
          continue;
        }
        
        const shouldAward = this.shouldAwardAchievement(achievement, userProgress);
        
        if (shouldAward) {
          console.log(`🎉 Awarding achievement: ${achievement.name}`);
          
          // Award huy hiệu
          const awardResponse = await achievementService.awardAchievement(achievement.id);
          
          if (awardResponse.success) {
            newAchievements.push({
              ...achievement,
              awardedAt: new Date()
            });
            console.log(`✅ Successfully awarded: ${achievement.name}`);
          } else {
            console.error(`❌ Failed to award: ${achievement.name}`, awardResponse.message);
          }
        }
      }
      
      return {
        success: true,
        newAchievements,
        message: newAchievements.length > 0 ? 
          `Chúc mừng! Bạn đã nhận được ${newAchievements.length} huy hiệu mới!` : 
          'Không có huy hiệu mới'
      };
      
    } catch (error) {
      console.error('❌ AWARD SERVICE Error:', error);
      return { success: false, error: error.message, newAchievements: [] };
    }
  }
  
  // Logic kiểm tra xem có nên award huy hiệu không
  shouldAwardAchievement(achievement, userProgress) {
    const { days, money } = userProgress;
    const name = achievement.name.toLowerCase();
    
    console.log(`🔍 Checking "${achievement.name}" - Days: ${days}, Money: ${money}`);
    
    // Huy hiệu thời gian
    if (name.includes('24 giờ') && days >= 1) return true;
    if (name.includes('3 ngày') && days >= 3) return true;
    if (name.includes('1 tuần') && days >= 7) return true;
    if (name.includes('1 tháng') && days >= 30) return true;
    if (name.includes('6 tháng') && days >= 180) return true;
    if (name.includes('1 năm') && days >= 365) return true;
    
    // Huy hiệu sức khỏe (dựa trên thời gian)
    if (name.includes('giảm 25%') && days >= 7) return true;
    if (name.includes('giảm 50%') && days >= 30) return true;
    if (name.includes('giảm 75%') && days >= 90) return true;
    if (name.includes('hoàn toàn') && days >= 365) return true;
    
    // Huy hiệu tiết kiệm
    if (name.includes('50,000') || name.includes('50.000')) {
      return money >= 50000;
    }
    if (name.includes('500,000') || name.includes('500.000')) {
      return money >= 500000;
    }
    if (name.includes('1 triệu')) {
      return money >= 1000000;
    }
    if (name.includes('5 triệu')) {
      return money >= 5000000;
    }
    if (name.includes('10 triệu')) {
      return money >= 10000000;
    }
    
    return false;
  }
  
  // Hiển thị thông báo huy hiệu mới
  showAchievementNotification(achievements) {
    if (achievements.length === 0) return;
    
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        this.createAchievementToast(achievement);
      }, index * 1000); // Delay 1 giây giữa các thông báo
    });
  }
  
  // Tạo toast notification
  createAchievementToast(achievement) {
    // Tạo element toast
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-toast-content">
        <div class="achievement-toast-icon">🏆</div>
        <div class="achievement-toast-text">
          <h4>Huy hiệu mới!</h4>
          <p>${achievement.name}</p>
        </div>
      </div>
    `;
    
    // Thêm CSS
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.5s ease-out;
      min-width: 300px;
    `;
    
    // Thêm CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .achievement-toast-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .achievement-toast-icon {
        font-size: 24px;
      }
      .achievement-toast-text h4 {
        margin: 0 0 5px 0;
        font-size: 16px;
        font-weight: 600;
      }
      .achievement-toast-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);
    
    // Thêm vào body
    document.body.appendChild(toast);
    
    // Tự động xóa sau 4 giây
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.5s ease-out reverse';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 500);
    }, 4000);
    
    // Click để đóng
    toast.addEventListener('click', () => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }
}

export default new AchievementAwardService();
