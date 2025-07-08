import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import './ForgotPasswordStep2.css';

const ForgotPasswordStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from previous step
    const emailFromState = location.state?.email;
    if (!emailFromState) {
      navigate('/forgot-password-step1');
      return;
    }
    setEmail(emailFromState);
  }, [location.state, navigate]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to email for password reset
      const response = await apiService.forgotPassword(email);
      
      if (response.success) {
        // Navigate to OTP verification step
        navigate('/reset-password-otp', { 
          state: { 
            email: email,
            newPassword: newPassword
          }
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Không thể gửi mã xác thực. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-step2-container">
      <div className="forgot-password-step2-card">
        <div className="step-indicator">
          <div className="step completed">✓</div>
          <div className="step-line"></div>
          <div className="step active">2</div>
          <div className="step-line"></div>
          <div className="step">3</div>
        </div>

        <div className="forgot-password-step2-header">
          <h2>Đặt mật khẩu mới</h2>
          <p>Bước 2: Nhập mật khẩu mới của bạn</p>
          <div className="email-info">Email: {email}</div>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-step2-form">
          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div className="password-requirements">
            <p>Yêu cầu mật khẩu:</p>
            <ul>
              <li className={newPassword.length >= 6 ? 'valid' : ''}>
                Ít nhất 6 ký tự
              </li>
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            {isLoading ? (
              <span className="loading-spinner">Đang gửi mã xác thực...</span>
            ) : (
              'Gửi mã xác thực'
            )}
          </button>
        </form>

        <div className="back-to-step1">
          <button 
            type="button"
            onClick={() => navigate('/forgot-password-step1')}
            className="back-btn"
          >
            ← Quay lại nhập email
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordStep2;
