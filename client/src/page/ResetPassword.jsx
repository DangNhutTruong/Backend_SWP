import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loading, error } = useAuth();

  const [formData, setFormData] = useState({
    token: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy token từ URL khi component mount (tự động, không hiển thị)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setFormData((prev) => ({ ...prev, token }));
    } else {
      setLocalError("Link reset password không hợp lệ hoặc đã hết hạn");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (localError) setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Validation
    if (!formData.token) {
      setLocalError("Link reset password không hợp lệ");
      return;
    }

    if (!formData.newPassword) {
      setLocalError("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (formData.newPassword.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔐 Resetting password với token:", formData.token);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: formData.token,
            newPassword: formData.newPassword,
          }),
        }
      );

      const result = await response.json();
      console.log("🔐 Reset response:", result);

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Đặt lại mật khẩu thất bại"
        );
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.",
            },
          });
        }, 2000);
      } else {
        throw new Error(result.message || "Đặt lại mật khẩu thất bại");
      }
    } catch (err) {
      console.error("🔐 Reset error:", err);
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  if (success) {
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
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#10B981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "24px",
            }}
          >
            ✅
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1F2937",
              margin: "0 0 16px 0",
            }}
          >
            Đặt lại mật khẩu thành công!
          </h2>

          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: "8px",
              padding: "16px",
              margin: "0 0 24px 0",
            }}
          >
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "16px",
                color: "#065F46",
                fontWeight: "500",
              }}
            >
              Mật khẩu của bạn đã được đặt lại thành công.
            </p>
            <p
              style={{
                margin: "0",
                fontSize: "14px",
                color: "#047857",
              }}
            >
              Đang chuyển hướng đến trang đăng nhập...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          🔑
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 8px 0",
          }}
        >
          Đặt lại mật khẩu
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
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        {/* Error Message */}
        {displayError && (
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
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div style={{ marginBottom: "20px", textAlign: "left" }}>
            <label
              htmlFor="newPassword"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Mật khẩu mới
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Nhập mật khẩu mới"
              value={formData.newPassword}
              onChange={handleChange}
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

          {/* Confirm Password Input */}
          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              backgroundColor: isLoading || loading ? "#9CA3AF" : "#4F46E5",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading || loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading || loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!(isLoading || loading)) {
                e.target.style.backgroundColor = "#4338CA";
              }
            }}
            onMouseLeave={(e) => {
              if (!(isLoading || loading)) {
                e.target.style.backgroundColor = "#4F46E5";
              }
            }}
          >
            {isLoading || loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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
              Mật khẩu phải có ít nhất 6 ký tự
            </li>
            <li style={{ marginBottom: "4px" }}>
              Nên sử dụng kết hợp chữ và số
            </li>
            <li style={{ marginBottom: "4px" }}>
              Không chia sẻ mật khẩu với ai khác
            </li>
            <li style={{ marginBottom: "4px" }}>
              Sau khi đổi mật khẩu, hãy đăng nhập lại
            </li>
            <li style={{ marginBottom: "4px" }}>
              Link reset chỉ có hiệu lực trong 1 giờ
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
