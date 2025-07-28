import React, { useState } from 'react';
import { FaHeart, FaComment, FaShare, FaTrophy, FaRegHeart, FaEllipsisV, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from './CommunityPostCreator';
import '../styles/CommunityPost.css';

/**
 * Component hiển thị bài viết cộng đồng
 */
const CommunityPost = ({ post, onLike, onComment, onShare, onDelete }) => {
  const { user } = useAuth();  const [isLiked, setIsLiked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Kiểm tra xem bài viết có thuộc về người dùng hiện tại không
  const isOwnPost = user && post.user_id === user.id;

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (onLike) {
      onLike(post.id, !isLiked);
    }
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
            src={post.user_avatar || '/image/default-user-avatar.svg'} 
            alt={post.user_name || 'User'} 
            className="user-avatar"
          />
          <div className="user-details">
            <h3 className="user-name">{post.user_name || 'Anonymous'}</h3>
            <span className="post-time">{formatTime(post.created_at)}</span>
          </div>
        </div>

        <div className="post-header-right">
          {/* Hiển thị huy hiệu nếu có */}
          {post.achievements && post.achievements.length > 0 && (
            <div className="post-achievements">
              {post.achievements.map((achievement, index) => (
                <div key={achievement.id} className="achievement-badge">
                  <span className="achievement-icon">{achievement.icon}</span>
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
        >
          {isLiked ? <FaHeart /> : <FaRegHeart />}
          <span>{(post.likes_count || 0) + (isLiked ? 1 : 0)} cảm ơn</span>
        </button>

        <button 
          className="action-btn comment-btn"
          onClick={() => onComment && onComment(post.id)}
        >
          <FaComment />
          <span>{post.comments_count || 0} bình luận</span>
        </button>

        <button 
          className="action-btn share-btn"
          onClick={() => onShare && onShare(post)}
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
