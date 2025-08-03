import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaEye, FaHeart, FaComment, FaCheckCircle, FaTimes, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import CommunityPostCreator, { EmptyState } from "../components/CommunityPostCreator.jsx";
import CommunityPost from "../components/CommunityPost.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getSavedPosts, savePosts, toggleLikePost, prepareShareContent } from "../utils/communityUtils.js";
import communityService from "../services/communityService.js";
import newsService from "../services/newsService.js";
import "./Blog.css";
import "../styles/Toast.css";

export default function Blog() {  
  const { user } = useAuth();
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]); // State cho tin tức thực tế
  const [loadingNews, setLoadingNews] = useState(true); // Loading state cho tin tức
  const [newsError, setNewsError] = useState(null); // Error state cho tin tức
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quản lý toast notification
  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Load bài viết từ API khi component mount
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await communityService.getAllPosts();
      if (response.success) {
        setCommunityPosts(response.data.posts || []);
      } else {
        throw new Error(response.message || 'Không thể tải bài viết');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

    // Load tin tức về thuốc lá từ API
  const loadNewsArticles = async () => {
    try {
      setLoadingNews(true);
      setNewsError(null);
      console.log('🔄 Đang tải tin tức về cai thuốc lá...');
      
      // Chỉ tải tin tức liên quan đến thuốc lá
      const response = await newsService.getCombinedNews(); // Đã được sửa để chỉ lấy tin về thuốc lá
      
      if (response.success) {
        const articles = response.data || [];
        console.log('✅ Đã tải được', articles.length, 'bài tin tức về thuốc lá');
        setNewsArticles(articles);
        
        if (response.message) {
          showToast(response.message, 'info', 2000);
        }
      } else {
        throw new Error(response.message || 'Không thể tải tin tức');
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải tin tức:', error);
      setNewsError(error.message);
      
      // Fallback: sử dụng mock data từ service
      try {
        const fallbackResponse = await newsService.getMockNews();
        setNewsArticles(fallbackResponse.data || []);
        showToast('Sử dụng dữ liệu mẫu về cai thuốc lá', 'warning', 3000);
      } catch (fallbackError) {
        console.error('❌ Lỗi khi tải dữ liệu mẫu:', fallbackError);
        showToast('Không thể tải tin tức', 'error');
      }
    } finally {
      setLoadingNews(false);
    }
  };
  
  useEffect(() => {
    loadPosts();
    loadNewsArticles(); // Tải tin tức thực tế
  }, []);

  // Xử lý khi người dùng tạo bài viết mới
  const handlePostCreated = async (newPostData) => {
    try {
      const response = await communityService.createPost(newPostData);
      if (response.success) {
        setCommunityPosts(prev => [response.data, ...prev]);
        showToast('Đã đăng bài viết thành công!', 'success');
      } else {
        throw new Error(response.message || 'Không thể tạo bài viết');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showToast(error.message, 'error');
    }
  };

  // Xử lý khi người dùng thích bài viết (tạm thời dùng local state)
  const handleLike = (postId, isLiked) => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes_count: isLiked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1,
          isLiked: !isLiked
        };
      }
      return post;
    }));
  };

  // Xử lý khi người dùng muốn xem/thêm bình luận
  const handleComment = (postId) => {
    console.log('Open comments for post:', postId);
    showToast('Tính năng bình luận sẽ sớm được cập nhật!', 'info');
  };
  
  // Xử lý khi người dùng xóa bài viết của họ
  const handleDelete = async (postId) => {
    try {
      const response = await communityService.deletePost(postId);
      if (response.success) {
        setCommunityPosts(prev => prev.filter(post => post.id !== postId));
        showToast('Đã xóa bài viết thành công!', 'success');
      } else {
        throw new Error(response.message || 'Không thể xóa bài viết');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast(error.message, 'error');
    }
  };
  // Quản lý toast notification được định nghĩa ở trên

  // Xử lý khi người dùng chia sẻ bài viết
  const handleShare = (post) => {
    const shareContent = prepareShareContent(post);

    if (navigator.share) {
      navigator.share({
        title: 'Chia sẻ từ cộng đồng NoSmoke',
        text: shareContent,
      })
      .then(() => {
        showToast('Đã chia sẻ thành công!', 'success');
      })
      .catch((error) => {
        console.log('Lỗi khi chia sẻ:', error);
      });
    } else {
      try {
        navigator.clipboard.writeText(shareContent);
        showToast('Đã sao chép nội dung! Bạn có thể dán và chia sẻ ngay bây giờ.', 'success');
      } catch (err) {
        console.log('Lỗi khi sao chép:', err);
        showToast('Không thể sao chép tự động. Vui lòng thử lại.', 'error');
      }
    }
  };

  // Hàm giải mã HTML entities
  const decodeHtmlEntities = (text) => {
    if (!text) return '';
    
    // Tạo một phần tử tạm để giải mã HTML entities
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || '';
  };
  
  // Component bài viết thông thường (hiển thị cả description)
  const BlogPostCard = ({ post }) => {
    // Xử lý format khác nhau từ API và hard code
    const imageUrl = post.urlToImage || post.image || '/image/articles/default.jpg';
    const postTitle = decodeHtmlEntities(post.title);
    const postDescription = decodeHtmlEntities(post.description || post.excerpt || '');
    const postUrl = post.url;
    const sourceName = post.source?.name || '';

    // Xử lý click vào card
    const handleCardClick = () => {
      if (postUrl.startsWith('http')) {
        window.open(postUrl, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <div 
        className={`blog-post-card ${postUrl.startsWith('http') ? 'clickable' : ''}`}
        onClick={postUrl.startsWith('http') ? handleCardClick : undefined}
        style={postUrl.startsWith('http') ? { cursor: 'pointer' } : {}}
      >
        <div className="post-image">
          <img src={imageUrl} alt={postTitle} onError={(e) => {
            e.target.src = '/image/articles/default.jpg';
          }} />
          {sourceName && (
            <div className="post-source">{sourceName}</div>
          )}
        </div>
        <div className="post-content">
          <h3 className="post-title">{postTitle}</h3>
          {postDescription && (
            <p className="post-description">{postDescription}</p>
          )}
        </div>
      </div>
    );
  };

  // Lấy tên hiển thị cho danh mục
  function getCategoryName(category) {
    const categories = {
      health: "Sức khỏe",
      tips: "Mẹo hay",
      experience: "Kinh nghiệm",
      success: "Câu chuyện thành công",
      support: "Hỗ trợ cai thuốc",
    };
    return categories[category] || "Chung";
  }  return (
    <div className="blog-page">
      <div className="container blog-container">
        {/* Bài viết mới nhất */}
        <div className="latest-posts-section">
          <div className="section-header-with-actions">
            <h2 className="section-title" style={{ marginTop: '20px' }}>
              <span className="highlight-text">Tin tức về cai thuốc lá</span>
              
            </h2>
            <button 
              onClick={loadNewsArticles} 
              className="refresh-news-btn"
              disabled={loadingNews}
              title="Tải tin tức mới"
            >
              {loadingNews ? 'Đang tải...' : 'Tải mới ↻'}
            </button>
          </div>
          
          {/* Loading state cho tin tức */}
          {loadingNews && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải tin tức mới nhất...</p>
            </div>
          )}
          
          {/* Error state cho tin tức */}
          {newsError && !loadingNews && (
            <div className="error-container">
              <FaExclamationTriangle />
              <p>Không thể tải tin tức: {newsError}</p>
              <button onClick={loadNewsArticles} className="retry-btn">
                Thử lại
              </button>
            </div>
          )}

          {/* Hiển thị tin tức */}
          {!loadingNews && !newsError && newsArticles.length > 0 && (
            <div className="blog-posts-grid">
              {newsArticles.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          
          {/* Empty state */}
          {!loadingNews && !newsError && newsArticles.length === 0 && (
            <div className="empty-news-container">
              <FaInfoCircle />
              <p>Hiện tại chưa có tin tức về cai thuốc lá. Hãy thử lại sau.</p>
              <button onClick={loadNewsArticles} className="retry-btn">
                Tải lại
              </button>
            </div>
          )}

          {/* Phân trang (tạm ẩn do sử dụng API) */}
          {/*
          <div className="pagination">
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <span>...</span>
            <button className="pagination-btn">10</button>
            <button className="pagination-btn next">Tiếp theo</button>
          </div>
          */}
        </div>        {/* Phần cộng đồng */}
        <div className="community-section">
          <h2 className="section-title">Chia sẻ từ cộng đồng</h2>
          <div className="community-box">            {/* Component tạo bài viết */}
            {user ? (
              <CommunityPostCreator 
                achievements={[]}
                onPostCreated={handlePostCreated}
              />
            ) : (
              <div className="login-to-post">
                <p>Vui lòng đăng nhập để chia sẻ hành trình của bạn</p>
                <Link to="/login" className="login-btn">Đăng nhập</Link>
              </div>
            )}

            {/* Danh sách bài viết */}
            <div className="community-posts">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Đang tải bài viết...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <FaExclamationTriangle />
                  <h3>Có lỗi xảy ra</h3>
                  <p>{error}</p>
                  <button onClick={loadPosts} className="retry-btn">Thử lại</button>
                </div>
              ) : communityPosts.length > 0 ? (
                communityPosts.map(post => (
                  <CommunityPost
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={() => handleShare(post)}
                    onDelete={handleDelete}
                    canDelete={post.user?.id === user?.id || user?.role === 'admin'}
                  />
                ))
              ) : (
                <EmptyState 
                  title="Chưa có bài viết nào trong cộng đồng"
                  description="Hãy là người đầu tiên chia sẻ câu chuyện cai thuốc lá của bạn!"
                  actionText="Tạo bài viết đầu tiên"
                  onAction={() => document.querySelector('.post-input')?.focus()}
                />
              )}
            </div>

            {communityPosts.length > 5 && (
              <div className="view-more">
                <button className="view-more-btn">
                  Xem thêm bài viết cộng đồng
                </button>
              </div>
            )}

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * Component hiển thị thông báo toast
 */
const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // Chờ animation kết thúc
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationTriangle />;
      case 'info':
        return <FaInfoCircle />;
      default:
        return <FaCheckCircle />;
    }
  };

  const handleClose = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện lan tỏa
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  // Cắt ngắn thông báo quá dài và thêm dấu "..."
  const truncateMessage = (msg) => {
    // Thông báo vẫn hiển thị đầy đủ, CSS sẽ xử lý việc xuống dòng
    return msg;
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-enter' : 'toast-exit'}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <p className="toast-message">{truncateMessage(message)}</p>
      </div>
      <button className="toast-close" onClick={handleClose} title="Đóng">
        <FaTimes />
      </button>
    </div>
  );
};

/**
 * Container quản lý các toast
 */
const ToastContainer = ({ toasts = [], removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

