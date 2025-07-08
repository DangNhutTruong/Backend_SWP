import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './ForgotPasswordStep1.css';

const ForgotPasswordStep1 = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      // Check if email exists
      const response = await apiService.checkEmailExists(email);
      
      if (response.success) {
        // Email exists, navigate to step 2
        navigate('/forgot-password-step2', { 
          state: { email: email }
        });
      }
    } catch (error) {
      console.error('Check email error:', error);
      if (error.response?.status === 404) {
        setError('Không tìm thấy tài khoản với địa chỉ email này');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-step1-container">
      <div className="forgot-password-step1-card">
        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step-line"></div>
          <div className="step">2</div>
          <div className="step-line"></div>
          <div className="step">3</div>
        </div>

        <div className="forgot-password-step1-header">
          <h2>Quên mật khẩu</h2>
          <p>Bước 1: Nhập địa chỉ email của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-step1-form">
          <div className="form-group">
            <label htmlFor="email">Địa chỉ Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email của bạn"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">Đang kiểm tra...</span>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </form>

        <div className="back-to-login">
          <button 
            type="button"
            onClick={() => navigate('/login')}
            className="back-btn"
          >
            ← Quay lại đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordStep1;
