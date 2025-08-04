import React, { useState } from 'react';
import { FaHeart, FaComment, FaShare, FaTrophy, FaRegHeart, FaEllipsisV, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from './CommunityPostCreator';
import '../styles/CommunityPost.css';

/**
 * Component hiển thị bài viết cộng đồng
 */
const CommunityPost = ({ post, onLike, onComment, onShare, onDelete }) => {
  const { user } = useAuth();
  
  // Debug log để kiểm tra achievements
  React.useEffect(() => {
    console.log('🔍 CommunityPost received post:', {
      id: post.id,
      title: post.title,
      achievements: post.achievements,
      achievements_length: post.achievements ? post.achievements.length : 0
    });
  }, [post]);
  
  const [isLiked, setIsLiked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Kiểm tra xem bài viết có thuộc về người dùng hiện tại không
  const isOwnPost = user && post.user_id === user.id;

  // Đồng bộ avatar: nếu là bài viết của user hiện tại, sử dụng avatar từ context
  const getPostAvatar = () => {
    if (isOwnPost && user.avatar) {
      return user.avatar;
    }
    return post.user_avatar || '/image/default-user-avatar.svg';
  };

  // Đồng bộ tên người dùng: nếu là bài viết của user hiện tại, sử dụng tên từ context
  const getPostUserName = () => {
    if (isOwnPost && user.name) {
      return user.name;
    }
    return post.user_name || 'Anonymous';
  };

  // Đóng menu khi click bên ngoài
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest('.post-options')) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsMenu]);

  // State để ngăn chặn việc click liên tục
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

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
  
  const handleLike = () => {
    // Nếu đang xử lý, không làm gì
    if (isLikeProcessing) return;
    
    // Đánh dấu là đang xử lý
    setIsLikeProcessing(true);
    
    // Cập nhật trạng thái thích local
    setIsLiked(!isLiked);
    
    // Gọi callback từ parent
    if (onLike) {
      onLike(post.id, isLiked);
    }
    
    // Sau 500ms, mới cho phép nhấp lại
    setTimeout(() => {
      setIsLikeProcessing(false);
    }, 500);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
  };
  const handleDelete = () => {
    setShowOptionsMenu(false);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    setShowDeleteModal(false);
  };

  const toggleOptionsMenu = (e) => {
    e.stopPropagation();
    setShowOptionsMenu(!showOptionsMenu);
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="community-post">
      {/* Header */}      <div className="post-header">
        <div className="user-info">
          <img 
            src={getPostAvatar()} 
            alt={post.user_name || 'User'} 
            className="user-avatar"
          />
          <div className="user-details">
            <h3 className="user-name">{getPostUserName()}</h3>
            <span className="post-time">{formatTime(post.created_at)}</span>
          </div>
        </div>

        <div className="post-header-right">
          {/* Hiển thị huy hiệu nếu có */}
          {post.achievements && post.achievements.length > 0 && (
            <div className="post-achievements">
              {post.achievements.map((achievement, index) => (
                <div key={achievement.id} className="achievement-badge">
                  <span className="achievement-icon">{getAchievementIcon(achievement.name)}</span>
                  <span className="achievement-name">{achievement.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Menu options cho chủ bài viết */}
          {isOwnPost && (
            <div className="post-options">
              <button 
                className="options-btn"
                onClick={toggleOptionsMenu}
                title="Tùy chọn"
              >
                <FaEllipsisV />
              </button>
              
              {showOptionsMenu && (
                <div className="options-menu">
                  <button 
                    className="option-item delete-option"
                    onClick={handleDelete}
                  >
                    <FaTrash /> Xóa bài viết
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="post-content">
        {post.content && (
          <div className="post-text">
            {showFullContent ? (
              <p>{post.content}</p>
            ) : (
              <p>{truncateText(post.content)}</p>
            )}
            
            {post.content.length > 200 && (
              <button 
                className="show-more-btn"
                onClick={() => setShowFullContent(!showFullContent)}
              >
                {showFullContent ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        )}

        {/* Hiển thị hình ảnh nếu có */}
        {post.thumbnail_url && (
          <div className="post-images single-image">
            <div className="image-container">
              <img src={post.thumbnail_url} alt="Post thumbnail" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLikeProcessing}
        >
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          
        </button>

        

        <button 
          className="action-btn share-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (onShare) onShare(post);
          }}
        >
          <FaShare />
          <span>Chia sẻ</span>
        </button>
      </div>      {/* Comment Section Preview */}
      {post.comments_count > 0 && (
        <div className="comments-preview">
          <button className="view-comments-btn">
            Xem tất cả {post.comments_count} bình luận
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Xóa bài viết"
      />
    </div>
  );
};

export default CommunityPost;
