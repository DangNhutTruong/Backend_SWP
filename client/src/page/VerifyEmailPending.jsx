import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiService from "../services/apiService";
import "./VerifyEmailPending.css";

const VerifyEmailPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

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

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage("");

    try {
      const data = await apiService.resendVerificationEmail(email);

      if (data.success) {
        setResendMessage(
          "Email xác thực đã được gửi lại thành công! Vui lòng kiểm tra hộp thư của bạn."
        );
      } else {
        setResendMessage(data.message || "Có lỗi xảy ra khi gửi lại email.");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      setResendMessage(
        error.message ||
          "Có lỗi xảy ra khi gửi lại email. Vui lòng thử lại sau."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verify-email-pending-page">
      <div className="verify-email-pending-container">
        <div className="verify-email-pending-card">
          <div className="email-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="#4CAF50"
                strokeWidth="2"
                fill="none"
              />
              <polyline
                points="22,6 12,13 2,6"
                stroke="#4CAF50"
                strokeWidth="2"
              />
            </svg>
          </div>

          <h1>Kiểm tra email của bạn</h1>

          <p className="main-message">
            Chúng tôi đã gửi email xác thực đến <strong>{email}</strong>
          </p>

          <p className="instruction">
            Vui lòng kiểm tra hộp thư (bao gồm thư mục spam) và click vào link
            xác thực để hoàn tất đăng ký.
          </p>

          <div className="verification-steps">
            <h3>Các bước tiếp theo:</h3>
            <ol>
              <li>Mở email từ NoSmoke</li>
              <li>Click vào link "Xác thực email"</li>
              <li>Bạn sẽ được chuyển hướng để hoàn tất đăng ký</li>
            </ol>
          </div>

          {resendMessage && (
            <div
              className={`resend-message ${
                resendMessage.includes("thành công") ? "success" : "error"
              }`}
            >
              {resendMessage}
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="resend-button"
            >
              {isResending ? "Đang gửi..." : "Gửi lại email"}
            </button>
          </div>

          <div className="help-section">
            <h4>Không nhận được email?</h4>
            <ul>
              <li>Kiểm tra thư mục spam/rác</li>
              <li>Đảm bảo địa chỉ email đã nhập đúng</li>
              <li>Email có thể mất vài phút để đến</li>
              <li>Click "Gửi lại email" nếu cần</li>
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

export default VerifyEmailPending;
