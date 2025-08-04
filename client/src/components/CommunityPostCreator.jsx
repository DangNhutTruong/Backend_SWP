import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaImage, FaTimes, FaTrash, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import achievementService from '../services/achievementService';
import '../styles/CommunityPostCreator.css';

/**
 * Component hiển thị trạng thái rỗng
 */
export const EmptyState = ({ 
  icon = "📝", 
  title = "Chưa có bài viết nào", 
  description = "Hãy là người đầu tiên chia sẻ câu chuyện của bạn!", 
  actionText = "Tạo bài viết đầu tiên",
  onAction 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

/**
 * Modal xác nhận xóa bài viết
 */
export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = "Xóa bài viết" }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-confirm-modal">
        <div className="modal-header">
          <div className="modal-icon">
            <FaTrash />
          </div>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <h3 className="modal-title">{title}</h3>
          <p className="modal-description">
            Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            <FaTrash />
            Xóa bài viết
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component tạo bài viết cộng đồng với hình ảnh
 */
const CommunityPostCreator = React.memo(({ onPostCreated }) => {
  const { user } = useAuth();
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const achievementsLoadedRef = useRef(false);
  const fileInputRef = useRef(null);

  // Load huy hiệu của user khi component mount
  const loadUserAchievements = useCallback(async () => {
    if (!user?.id || achievementsLoadedRef.current || loadingAchievements) {
      return;
    }
    
    try {
      setLoadingAchievements(true);
      achievementsLoadedRef.current = true; // Set flag ngay lập tức để prevent duplicate calls
      
      const response = await achievementService.getMyAchievements();
      if (response.success && response.data) {
        // Chỉ lấy những huy hiệu đã đạt được và remove duplicates
        const completedAchievements = response.data.filter(achievement => achievement.achieved_at);
        // Remove duplicates based on ID
        const uniqueAchievements = completedAchievements.filter((achievement, index, self) => 
          index === self.findIndex(a => a.id === achievement.id)
        );
        setUserAchievements(uniqueAchievements);
      }
    } catch (error) {
      console.error('Error loading user achievements:', error);
      setUserAchievements([]);
      achievementsLoadedRef.current = false; // Reset flag on error
    } finally {
      setLoadingAchievements(false);
    }
  }, [user?.id, loadingAchievements]);

  useEffect(() => {
    loadUserAchievements();
  }, [loadUserAchievements]);

  // Hàm lấy icon cho huy hiệu
  const getAchievementIcon = (achievementName) => {
    if (achievementName.includes('24 giờ')) return '⏰';
    if (achievementName.includes('3 ngày')) return '🌟';
    if (achievementName.includes('1 tuần')) return '💎';
    if (achievementName.includes('1 tháng')) return '👑';
    if (achievementName.includes('6 tháng')) return '🚀';
    if (achievementName.includes('1 năm')) return '🎊';
    if (achievementName.includes('Giảm 25%')) return '💪';
    if (achievementName.includes('Giảm 50%')) return '🎯';
    if (achievementName.includes('Giảm 75%')) return '🔥';
    if (achievementName.includes('Hoàn toàn')) return '🏆';
    if (achievementName.includes('50,000') || achievementName.includes('50.000')) return '🪙';
    if (achievementName.includes('500,000') || achievementName.includes('500.000')) return '💳';
    if (achievementName.includes('1 triệu')) return '💰';
    if (achievementName.includes('5 triệu')) return '💎';
    if (achievementName.includes('10 triệu')) return '🏦';
    if (achievementName.includes('tiết kiệm')) return '💵';
    return '🏅';
  };

  // Xử lý chọn/bỏ chọn huy hiệu
  const toggleAchievement = (achievement) => {
    setSelectedAchievements(prev => {
      const isSelected = prev.find(a => a.id === achievement.id);
      if (isSelected) {
        return prev.filter(a => a.id !== achievement.id);
      } else {
        // Đảm bảo không có duplicates khi thêm
        const newSelection = [...prev, achievement];
        return newSelection.filter((item, index, self) => 
          index === self.findIndex(a => a.id === item.id)
        );
      }
    });
  };

  // Xóa huy hiệu đã chọn
  const removeAchievement = (achievementId) => {
    setSelectedAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  // Cảnh báo khi rời trang nếu đang soạn bài
  React.useEffect(() => {
    const hasContent = postText.trim() || selectedImages.length > 0;
    
    if (hasContent) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Bạn có chắc chắn muốn rời trang? Nội dung bài viết sẽ bị mất.';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [postText, selectedImages]);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        // Kiểm tra kích thước file (giới hạn 3MB để tránh lỗi server)
        if (file.size > 3 * 1024 * 1024) {
          alert(`File "${file.name}" quá lớn. Vui lòng chọn file nhỏ hơn 3MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          // Tạo một image element để resize nếu cần
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Giới hạn kích thước tối đa nhỏ hơn
            const maxWidth = 600;
            const maxHeight = 400;
            let { width, height } = img;
            
            // Tính toán kích thước mới
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Vẽ và nén ảnh với chất lượng thấp hơn
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Nén với chất lượng 60%
            
            // Kiểm tra kích thước sau khi nén
            const sizeInBytes = compressedDataUrl.length * 0.75; // base64 overhead
            if (sizeInBytes > 500 * 1024) { // 500KB
              alert('Ảnh vẫn quá lớn sau khi nén. Vui lòng chọn ảnh khác.');
              return;
            }
            
            setSelectedImages(prev => [...prev, {
              id: Date.now() + Math.random(),
              url: compressedDataUrl,
              file: file,
              originalSize: file.size,
              compressedSize: sizeInBytes
            }]);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handlePostSubmit = () => {
    if (!postText.trim() && selectedImages.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn hình ảnh để đăng bài!');
      return;
    }

    // Giới hạn độ dài nội dung
    const maxContentLength = 2000;
    const trimmedContent = postText.trim();
    
    if (trimmedContent.length > maxContentLength) {
      alert(`Nội dung quá dài! Vui lòng giới hạn trong ${maxContentLength} ký tự. Hiện tại: ${trimmedContent.length} ký tự.`);
      return;
    }

    // Tạo title từ nội dung (lấy 50 ký tự đầu)
    const title = trimmedContent.length > 50 
      ? trimmedContent.substring(0, 50) + '...' 
      : trimmedContent || 'Chia sẻ hình ảnh';

    // Chuẩn bị dữ liệu cho API
    const postData = {
      title: title,
      content: trimmedContent,
      thumbnail_url: selectedImages.length > 0 ? selectedImages[0].url : null,
      achievements: selectedAchievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        icon: getAchievementIcon(achievement.name),
        achieved_at: achievement.achieved_at
      }))
    };

    // Kiểm tra kích thước tổng của dữ liệu
    const dataSize = JSON.stringify(postData).length;
    
    if (dataSize > 500 * 1024) { // 500KB
      alert('Dữ liệu bài viết quá lớn! Vui lòng giảm kích thước hình ảnh hoặc nội dung.');
      return;
    }

    // Callback để thông báo bài viết mới được tạo (Blog.jsx sẽ xử lý API call)
    if (typeof onPostCreated === 'function') {
      onPostCreated(postData);
    }

    // Reset form
    setPostText('');
    setSelectedImages([]);
    setSelectedAchievements([]);
    setShowAchievements(false);
    setIsExpanded(false);
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
  };

  return (
    <div className="community-post-creator">
      <div className="post-creator-header">
        <div className="user-avatar">
          <img 
            src={user?.avatar || '/image/hero/quit-smoking-2.png'} 
            alt={user?.fullName || 'User'} 
          />
        </div>
        <div className="post-input-container">
          <textarea
            className="post-input"
            placeholder="Chia sẻ hành trình hôm nay của bạn..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onFocus={handleInputFocus}
            rows={isExpanded ? 4 : 2}
            maxLength={2000}
          />
          {isExpanded && (
            <div className="character-count">
              <span className={postText.length > 1800 ? 'warning' : ''}>
                {postText.length}/2000 ký tự
              </span>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="post-creator-expanded">
          {/* Hiển thị huy hiệu đã chọn */}
          {selectedAchievements.length > 0 && (
            <div className="selected-achievements">
              <h4>🏆 Huy hiệu được khoe:</h4>
              <div className="achievement-tags">
                {selectedAchievements.map((achievement, index) => (
                  <div key={`selected-${achievement.id}-${index}`} className="achievement-tag">
                    <span className="achievement-icon">{getAchievementIcon(achievement.name)}</span>
                    <span className="achievement-name">{achievement.name}</span>
                    <button 
                      className="remove-achievement"
                      onClick={() => removeAchievement(achievement.id)}
                      title="Bỏ chọn huy hiệu"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel chọn huy hiệu */}
          {showAchievements && userAchievements.length > 0 && (
            <div className="achievements-panel">
              <h4>🏅 Chọn huy hiệu để khoe:</h4>
              {loadingAchievements ? (
                <div className="loading-achievements">Đang tải huy hiệu...</div>
              ) : (
                <div className="achievements-list">
                  {userAchievements.map((achievement, index) => (
                    <div 
                      key={`available-${achievement.id}-${index}`} 
                      className={`achievement-item ${selectedAchievements.find(a => a.id === achievement.id) ? 'selected' : ''}`}
                      onClick={() => toggleAchievement(achievement)}
                    >
                      <span className="achievement-icon">{getAchievementIcon(achievement.name)}</span>
                      <div className="achievement-info">
                        <span className="achievement-name">{achievement.name}</span>
                        <span className="achievement-date">
                          {new Date(achievement.achieved_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hiển thị hình ảnh đã chọn */}
          {selectedImages.length > 0 && (
            <div className="selected-images">
              {selectedImages.map(image => (
                <div key={image.id} className="image-preview">
                  <img src={image.url} alt="Preview" />
                  <button 
                    className="remove-image"
                    onClick={() => removeImage(image.id)}
                  >
                    <FaTimes />
                  </button>
                  {image.compressedSize && (
                    <div className="image-info">
                      <span className="compression-info">
                        Đã nén: {Math.round((image.originalSize - image.compressedSize) / image.originalSize * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="post-creator-toolbar">
            <div className="toolbar-left">
              <button 
                className="toolbar-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Thêm hình ảnh"
              >
                <FaImage /> Hình ảnh
              </button>
              
              {userAchievements.length > 0 && (
                <button 
                  className={`toolbar-btn ${showAchievements ? 'active' : ''}`}
                  onClick={() => setShowAchievements(!showAchievements)}
                  title="Thêm huy hiệu"
                >
                  <FaTrophy /> Huy hiệu ({userAchievements.length})
                </button>
              )}
                
            </div>

            <div className="toolbar-right">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsExpanded(false);
                  setPostText('');
                  setSelectedImages([]);
                  setSelectedAchievements([]);
                  setShowAchievements(false);
                }}
              >
                Hủy
              </button>
              
              <button 
                className="submit-btn"
                onClick={handlePostSubmit}
                disabled={!postText.trim() && selectedImages.length === 0}
              >
                Đăng bài
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
CommunityPostCreator.displayName = 'CommunityPostCreator';

export default CommunityPostCreator;
