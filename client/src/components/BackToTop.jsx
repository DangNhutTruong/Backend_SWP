import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import '../styles/BackToTop.css';

export default function BackToTop() {
  // Đã vô hiệu hóa nút này theo yêu cầu - trả về null để không hiển thị
  return null;
  
  // Code gốc giữ lại để tham khảo sau này nếu cần
  /*
  const [isVisible, setIsVisible] = useState(true);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY === 0) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    
    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top ${isVisible ? 'visible' : ''}`}
      aria-label="Quay lại đầu trang"
    >
      <FaArrowUp className="back-to-top-icon" />
    </button>
  );
  */
}
