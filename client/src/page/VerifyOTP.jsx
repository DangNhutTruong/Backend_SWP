import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiService from "../services/apiService";
import "./VerifyOTP.css";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Refs for OTP inputs
  const inputRefs = useRef([]);

  useEffect(() => {
    // Lấy email từ state hoặc sessionStorage
    const emailFromState = location.state?.email;
    const emailFromSession = sessionStorage.getItem("verificationEmail");

    const userEmail = emailFromState || emailFromSession;

    if (!userEmail) {
      // Nếu không có email, chuyển về trang đăng ký
      navigate("/register");
      return;
    }

    setEmail(userEmail);
  }, [location.state, navigate]);

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus last filled input or next empty input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setMessage("Vui lòng nhập đầy đủ 6 số");
      return;
    }

    setIsVerifying(true);
    setMessage("");

    try {
      const data = await apiService.verifyOTP(email, otpString);

      if (data.success) {
        setMessage("Xác thực thành công! Đang chuyển hướng...");

        // Clear verification email from session
        sessionStorage.removeItem("verificationEmail");

        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Email đã được xác thực thành công. Vui lòng đăng nhập.",
            },
          });
        }, 2000);
      } else {
        setMessage(data.message || "Mã OTP không đúng. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setMessage(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setMessage("");

    try {
      const data = await apiService.resendOTP(email);

      if (data.success) {
        setMessage("Mã OTP mới đã được gửi đến email của bạn!");
        setCountdown(60); // 60 seconds countdown
        setOtp(["", "", "", "", "", ""]); // Clear current OTP
        inputRefs.current[0]?.focus();
      } else {
        setMessage(data.message || "Có lỗi xảy ra khi gửi lại mã OTP.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setMessage(error.message || "Có lỗi xảy ra khi gửi lại mã OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-container">
        <div className="verify-otp-card">
          <div className="otp-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
                stroke="#4CAF50"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1>Nhập mã xác thực</h1>

          <p className="instruction">
            Chúng tôi đã gửi mã 6 số đến email <strong>{email}</strong>
          </p>

          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                className="otp-input"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                maxLength="1"
                disabled={isVerifying}
              />
            ))}
          </div>

          {message && (
            <div
              className={`message ${
                message.includes("thành công") ? "success" : "error"
              }`}
            >
              {message}
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={handleVerifyOTP}
              disabled={isVerifying || otp.join("").length !== 6}
              className="verify-button"
            >
              {isVerifying ? "Đang xác thực..." : "Xác thực"}
            </button>
          </div>

          <div className="resend-section">
            <p>Không nhận được mã?</p>
            <button
              onClick={handleResendOTP}
              disabled={isResending || countdown > 0}
              className="resend-button"
            >
              {isResending
                ? "Đang gửi..."
                : countdown > 0
                ? `Gửi lại sau ${countdown}s`
                : "Gửi lại mã"}
            </button>
          </div>

          <div className="help-section">
            <h4>Lưu ý:</h4>
            <ul>
              <li>Mã OTP có hiệu lực trong 10 phút</li>
              <li>Kiểm tra thư mục spam nếu không thấy email</li>
              <li>Nhập đúng 6 số như trong email</li>
            </ul>
          </div>

          <div className="footer-links">
            <Link to="/register">← Quay lại đăng ký</Link>
            <Link to="/contact">Cần hỗ trợ?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
