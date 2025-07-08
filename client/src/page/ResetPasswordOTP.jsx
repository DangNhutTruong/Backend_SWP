import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import apiService from '../services/apiService';
import './ResetPasswordOTP.css';

const ResetPasswordOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const newPassword = location.state?.newPassword || '';

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Chỉ cho phép 1 ký tự
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
  };

  // Handle OTP keydown
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const otpCode = otp.join('');
    
    // Validate OTP
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 số');
      setIsLoading(false);
      return;
    }

    if (!email || !newPassword) {
      setError('Dữ liệu không hợp lệ. Vui lòng quay lại trang quên mật khẩu.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.resetPassword(email, otpCode, newPassword);
      
      if (response && response.success) {
        setMessage('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response?.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !newPassword) {
    return (
      <div className="reset-password-otp-container">
        <div className="reset-password-otp-card">
          <div className="error-message">
            Dữ liệu không hợp lệ. Vui lòng quay lại trang quên mật khẩu.
          </div>
          <div className="back-to-login">
            <Link to="/forgot-password">← Quay lại quên mật khẩu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-otp-container">
      <div className="reset-password-otp-card">
        <div className="step-indicator">
          <div className="step completed">✓</div>
          <div className="step-line"></div>
          <div className="step completed">✓</div>
          <div className="step-line"></div>
          <div className="step active">3</div>
        </div>

        <div className="reset-password-otp-header">
          <h2>Xác thực đổi mật khẩu</h2>
          <p>Bước 3: Nhập mã OTP đã được gửi đến <strong>{email}</strong> để hoàn tất việc đổi mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-otp-form">
          <div className="form-group">
            <label>Mã xác thực (6 số)</label>
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="otp-input"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/forgot-password">← Gửi lại mã OTP</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordOTP;
