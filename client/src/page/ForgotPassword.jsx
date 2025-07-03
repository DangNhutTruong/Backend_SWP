import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Base API URL - should match AuthContext
const API_BASE_URL = "http://localhost:5000/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false); // Chỉ cần 2 trạng thái: chưa gửi và đã gửi
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown timer cho resend

  const navigate = useNavigate();

  // Cooldown timer effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Link đặt lại mật khẩu đã được gửi về email của bạn");
        setEmailSent(true);
        setCooldown(60); // Set 60 giây cooldown
      } else {
        setError(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return; // Không cho phép gửi lại khi còn cooldown

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Link đặt lại mật khẩu mới đã được gửi về email của bạn");
        setCooldown(60); // Set lại 60 giây cooldown
      } else {
        setError(data.message || "Có lỗi xảy ra khi gửi lại email");
      }
    } catch (err) {
      setError("Có lỗi xảy ra, vui lòng thử lại");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          backgroundColor: "white",
          borderRadius: "16px",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 25px rgba(0, 0, 0, 0.1)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        {/* Header Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            backgroundColor: "#4F46E5",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "24px",
          }}
        >
          📧
        </div>

        {!emailSent ? (
          <>
            {/* Title */}
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 8px 0",
              }}
            >
              Quên mật khẩu?
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "16px",
                color: "#6B7280",
                margin: "0 0 24px 0",
                lineHeight: "1.5",
              }}
            >
              Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
            </p>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "12px",
                  margin: "0 0 20px 0",
                  fontSize: "14px",
                  color: "#DC2626",
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendEmail}>
              <div style={{ marginBottom: "24px", textAlign: "left" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  required
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "16px",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    outline: "none",
                    backgroundColor: isLoading ? "#F9FAFB" : "#FFFFFF",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    !isLoading && (e.target.style.borderColor = "#4F46E5")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "white",
                  backgroundColor: isLoading ? "#9CA3AF" : "#4F46E5",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = "#4338CA";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = "#4F46E5";
                  }
                }}
              >
                {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </button>
            </form>

            {/* Navigation Links */}
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "14px",
              }}
            >
              <a
                href="/login"
                style={{
                  color: "#6B7280",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  padding: "8px",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#4F46E5";
                  e.target.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#6B7280";
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Nhớ lại mật khẩu? Đăng nhập
              </a>
              <a
                href="/register"
                style={{
                  color: "#6B7280",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  padding: "8px",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#4F46E5";
                  e.target.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#6B7280";
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                Chưa có tài khoản? Đăng ký ngay
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Success Title */}
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#1F2937",
                margin: "0 0 16px 0",
              }}
            >
              Kiểm tra email của bạn!
            </h2>

            {/* Success Message */}
            <div
              style={{
                backgroundColor: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: "8px",
                padding: "16px",
                margin: "0 0 24px 0",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#065F46",
                  fontWeight: "500",
                }}
              >
                {success}
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  color: "#047857",
                }}
              >
                Chúng tôi đã gửi link đặt lại mật khẩu đến{" "}
                <span style={{ fontWeight: "600", color: "#065F46" }}>
                  {email}
                </span>
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "#047857",
                }}
              >
                Vui lòng kiểm tra email và click vào link để đặt lại mật khẩu.
              </p>
            </div>

            {/* Resend Section */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "14px",
                  color: "#6B7280",
                }}
              >
                Không nhận được email?
              </p>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isLoading || cooldown > 0}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: cooldown > 0 || isLoading ? "#9CA3AF" : "#4F46E5",
                  backgroundColor: "transparent",
                  border: `1px solid ${
                    cooldown > 0 || isLoading ? "#E5E7EB" : "#4F46E5"
                  }`,
                  borderRadius: "6px",
                  cursor: cooldown > 0 || isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!(cooldown > 0 || isLoading)) {
                    e.target.style.backgroundColor = "#4F46E5";
                    e.target.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(cooldown > 0 || isLoading)) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#4F46E5";
                  }
                }}
              >
                {cooldown > 0 ? `Gửi lại (${cooldown}s)` : "Gửi lại email"}
              </button>
            </div>

            {/* Navigation Link */}
            <div style={{ fontSize: "14px" }}>
              <a
                href="/login"
                style={{
                  color: "#6B7280",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  padding: "8px",
                  borderRadius: "6px",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = "#4F46E5";
                  e.target.style.backgroundColor = "#F3F4F6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#6B7280";
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                ← Quay lại đăng nhập
              </a>
            </div>
          </>
        )}

        {/* Tips */}
        <div
          style={{
            marginTop: "32px",
            padding: "16px",
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#92400E",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            💡 Lưu ý quan trọng
          </div>
          <ul
            style={{
              margin: "0",
              padding: "0 0 0 16px",
              fontSize: "12px",
              color: "#78350F",
              lineHeight: "1.4",
            }}
          >
            <li style={{ marginBottom: "4px" }}>
              Link đặt lại mật khẩu có hiệu lực trong 1 giờ
            </li>
            <li style={{ marginBottom: "4px" }}>
              Kiểm tra cả hộp thư spam nếu không thấy email
            </li>
            <li style={{ marginBottom: "4px" }}>
              Click vào link trong email để đặt lại mật khẩu
            </li>
            <li style={{ marginBottom: "4px" }}>
              Sau khi đổi mật khẩu, hãy đăng nhập lại
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
