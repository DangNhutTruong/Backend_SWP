import React, { useState, useEffect } from 'react';
import { FaHeart, FaComment, FaShare, FaTrophy, FaRegHeart, FaEllipsisV, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from './CommunityPostCreator';
import '../styles/CommunityPost.css';

/**
 * Component hiển thị bài viết cộng đồng
 */
const CommunityPost = ({ post, onLike, onComment, onShare, onDelete, currentUserId }) => {
  const { user } = useAuth();
  const [showFullContent, setShowFullContent] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Kiểm tra xem bài viết có thuộc về người dùng hiện tại không
  const isOwnPost = user && post.user && post.user.id === user.id;
  
  // Kiểm tra xem người dùng đã thích bài viết chưa
  const userId = currentUserId || (user ? user.id : 'anonymous');
  const isLiked = post.likedBy && post.likedBy.includes(userId);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
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
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    
    const newComment = {
      id: Date.now(),
      user: {
        name: user.fullName || user.name || 'Người dùng',
        avatar: user.avatar || '/image/hero/quit-smoking-2.png',
        id: user.id
      },
      text: commentText,
      timestamp: new Date()
    };
    
    if (onComment) {
      onComment(post.id, newComment);
      setCommentText('');
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="community-post">
      {/* Header */}      
      <div className="post-header">
        <div className="user-info">
          <img 
            src={post.user?.avatar || '/image/hero/quit-smoking-2.png'} 
            alt={post.user?.name || 'Người dùng'} 
            className="user-avatar"
          />
          <div className="user-details">
            <h3 className="user-name">{post.user?.name || 'Người dùng'}</h3>
            <span className="post-time">{formatTime(post.timestamp)}</span>
          </div>
        </div>

        <div className="post-header-right">
          {/* Hiển thị huy hiệu nếu có */}
          {post.achievements && post.achievements.length > 0 && (
            <div className="post-achievements">
              {post.achievements.map((achievement, index) => (
                <div key={achievement.id || index} className="achievement-badge">
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
            
            {post.content && post.content.length > 200 && (
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
        {post.images && post.images.length > 0 && (
          <div className={`post-images ${post.images.length === 1 ? 'single-image' : 'multiple-images'}`}>
            {post.images.slice(0, 4).map((image, index) => (
              <div 
                key={image.id || index} 
                className={`image-container ${index === 3 && post.images.length > 4 ? 'more-images' : ''}`}
              >
                <img src={image.url} alt={`Hình ảnh ${index + 1}`} />
                {index === 3 && post.images.length > 4 && (
                  <div className="more-overlay">
                    <span>+{post.images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
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
          <span>{post.likes || 0} lượt thích</span>
        </button>

        <button 
          className="action-btn comment-btn"
          onClick={toggleComments}
        >
          <FaComment />
          <span>{post.comments || 0} bình luận</span>
        </button>

        <button 
          className="action-btn share-btn"
          onClick={() => onShare && onShare(post)}
        >
          <FaShare />
          <span>Chia sẻ</span>
        </button>
      </div>
      
      {/* Comment Section */}
      {showComments && (
        <div className="comments-section">
          {post.commentsList && post.commentsList.length > 0 ? (
            <div className="comments-list">
              {post.commentsList.map(comment => (
                <div key={comment.id} className="comment-item">
                  <img 
                    src={comment.user?.avatar || '/image/hero/quit-smoking-2.png'} 
                    alt={comment.user?.name || 'Người dùng'} 
                    className="comment-avatar" 
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user?.name || 'Người dùng'}</span>
                      <span className="comment-time">{formatTime(comment.timestamp)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-comments">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          )}
          
          {user ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <img 
                src={user.avatar || '/image/hero/quit-smoking-2.png'} 
                alt={user.fullName || user.name || 'Người dùng'} 
                className="comment-avatar" 
              />
              <div className="comment-input-container">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="comment-input"
                />
                <button 
                  type="submit" 
                  className="comment-submit"
                  disabled={!commentText.trim()}
                >
                  Gửi
                </button>
              </div>
            </form>
          ) : (
            <p className="login-to-comment">Vui lòng đăng nhập để bình luận</p>
          )}
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
