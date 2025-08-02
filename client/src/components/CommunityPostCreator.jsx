import React, { useState, useRef } from 'react';
import { FaImage, FaCamera, FaTimes, FaHeart, FaComment, FaShare, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
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
const CommunityPostCreator = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);

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
      thumbnail_url: selectedImages.length > 0 ? selectedImages[0].url : null
    };

    // Kiểm tra kích thước tổng của dữ liệu
    const dataSize = JSON.stringify(postData).length;
    console.log('📊 Post data size:', dataSize, 'bytes');
    
    if (dataSize > 500 * 1024) { // 500KB
      alert('Dữ liệu bài viết quá lớn! Vui lòng giảm kích thước hình ảnh hoặc nội dung.');
      return;
    }

    // Callback để thông báo bài viết mới được tạo (Blog.jsx sẽ xử lý API call)
    if (typeof onPostCreated === 'function') {
      onPostCreated(postData);
    } else {
      console.error('onPostCreated is not a function:', onPostCreated);
    }

    // Reset form
    setPostText('');
    setSelectedImages([]);
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
                
            </div>

            <div className="toolbar-right">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setIsExpanded(false);
                  setPostText('');
                  setSelectedImages([]);
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
};

export default CommunityPostCreator;
