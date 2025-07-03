import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EmailVerification() {
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerificationCode } = useAuth();

  // Extract email and token from URL/state first
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get("token");
    const emailFromUrl = urlParams.get("email");

    // Set email from state (register redirect) or URL
    if (location.state?.email) {
      setEmail(location.state.email);
    } else if (emailFromUrl) {
      setEmail(emailFromUrl);
    }

    // Set verification code from URL if present
    if (tokenFromUrl) {
      setVerificationCode(tokenFromUrl);
    }
  }, [location]);

  // Auto-verify when we have both email and token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get("token");

    if (email && tokenFromUrl && !autoVerifyAttempted) {
      setAutoVerifyAttempted(true);
      handleAutoVerify(tokenFromUrl);
    }
  }, [email, location.search, autoVerifyAttempted]);

  // Auto-verify function
  const handleAutoVerify = async (token) => {
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      console.log(`🔐 Auto-verifying email ${email} với token: ${token}`);
      const result = await verifyEmail(email, token);

      if (result.success) {
        console.log("✅ Auto-verify thành công");
        alert(
          "Email đã được xác thực thành công! Chào mừng bạn đến với NoSmoke!"
        );
        navigate("/", {
          state: { message: "Email đã được xác thực thành công!" },
        });
      } else {
        console.error("❌ Auto-verify thất bại:", result.error);
        setError(
          result.error || "Xác thực thất bại. Vui lòng nhập mã thủ công."
        );
      }
    } catch (error) {
      console.error("🔐 Auto verify error:", error);
      setError("Có lỗi xảy ra khi xác thực email. Vui lòng nhập mã thủ công.");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to register if no email provided
  useEffect(() => {
    if (!email && !location.state?.email) {
      const urlParams = new URLSearchParams(location.search);
      const emailFromUrl = urlParams.get("email");

      if (!emailFromUrl) {
        navigate("/register");
      }
    }
  }, [email, location.state, location.search, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Vui lòng cung cấp địa chỉ email");
      return;
    }

    if (verificationCode.length !== 6) {
      setError("Mã xác nhận phải có 6 chữ số");
      return;
    }

    setIsLoading(true);
    console.log(`🔐 Đang xác thực email ${email} với mã: ${verificationCode}`);

    try {
      const result = await verifyEmail(email, verificationCode);
      console.log("🔐 Kết quả xác thực:", result);

      if (result.success) {
        console.log("✅ Xác thực email thành công");
        alert("Xác nhận email thành công! Chào mừng bạn đến với NoSmoke!");
        // Redirect to home page after successful verification
        navigate("/");
      } else {
        console.error("❌ Xác thực thất bại:", result.error);
        setError(
          result.error ||
            "Mã xác nhận không đúng. Vui lòng kiểm tra và thử lại."
        );
      }
    } catch (err) {
      console.error("🔐 Lỗi xác thực:", err);
      setError(`Có lỗi xảy ra: ${err.message || "Không xác định được lỗi"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;

    setError("");
    setIsLoading(true);

    try {
      console.log(`📧 Đang gửi lại mã xác thực cho email: ${email}`);
      const result = await resendVerificationCode(email);

      if (result.success) {
        console.log("✅ Gửi lại mã thành công");
        alert("Mã xác nhận mới đã được gửi đến email của bạn");
        setResendCooldown(60); // 60 seconds cooldown
        setVerificationCode(""); // Clear current code
      } else {
        console.error("❌ Gửi lại mã thất bại:", result.error);
        setError(result.error || "Không thể gửi lại mã xác nhận");
      }
    } catch (err) {
      console.error("📧 Lỗi gửi lại mã:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setVerificationCode(value);
      console.log(`📟 Mã xác thực đã nhập: ${value}`);
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
          position: "relative",
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

        {/* Title */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#1F2937",
            margin: "0 0 8px 0",
          }}
        >
          Xác nhận Email
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "16px",
            color: "#6B7280",
            margin: "0 0 24px 0",
            lineHeight: "1.5",
          }}
        >
          Chúng tôi đã gửi mã xác nhận 6 chữ số đến email:
        </p>

        {/* Email Display */}
        <div
          style={{
            backgroundColor: "#EEF2FF",
            border: "1px solid #C7D2FE",
            borderRadius: "8px",
            padding: "16px",
            margin: "0 0 24px 0",
            fontSize: "14px",
            fontWeight: "500",
            color: "#4F46E5",
            wordBreak: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {email}
        </div>

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
        <form onSubmit={handleVerify}>
          {/* Email Input */}
          <div style={{ marginBottom: "20px", textAlign: "left" }}>
            <label
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
              disabled={isLoading}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                outline: "none",
                backgroundColor: "#F9FAFB",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#4F46E5")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
          </div>

          {/* Verification Code Input */}
          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Mã xác nhận (6 chữ số)
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              placeholder="Nhập 6 chữ số"
              maxLength="6"
              disabled={isLoading}
              required
              autoComplete="one-time-code"
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "20px",
                letterSpacing: "4px",
                fontWeight: "600",
                textAlign: "center",
                border:
                  verificationCode.length === 6
                    ? "2px solid #10B981"
                    : "2px solid #D1D5DB",
                borderRadius: "8px",
                outline: "none",
                backgroundColor: "#FFFFFF",
                fontFamily: "monospace",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor =
                  verificationCode.length === 6 ? "#10B981" : "#4F46E5";
                e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor =
                  verificationCode.length === 6 ? "#10B981" : "#D1D5DB";
                e.target.style.boxShadow = "none";
              }}
            />
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                textAlign: "center",
                marginTop: "6px",
              }}
            >
              Nhập mã 6 chữ số từ email của bạn
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || verificationCode.length !== 6}
            style={{
              width: "100%",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              backgroundColor:
                verificationCode.length === 6 && !isLoading
                  ? "#4F46E5"
                  : "#9CA3AF",
              border: "none",
              borderRadius: "8px",
              cursor:
                verificationCode.length === 6 && !isLoading
                  ? "pointer"
                  : "not-allowed",
              transition: "all 0.2s",
              opacity: verificationCode.length === 6 && !isLoading ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (verificationCode.length === 6 && !isLoading) {
                e.target.style.backgroundColor = "#4338CA";
              }
            }}
            onMouseLeave={(e) => {
              if (verificationCode.length === 6 && !isLoading) {
                e.target.style.backgroundColor = "#4F46E5";
              }
            }}
          >
            {isLoading ? "Đang xác nhận..." : "Xác nhận Email"}
          </button>
        </form>

        {/* Resend Section */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
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
            onClick={handleResendCode}
            disabled={isLoading || resendCooldown > 0}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              color: resendCooldown > 0 || isLoading ? "#9CA3AF" : "#4F46E5",
              backgroundColor: "transparent",
              border: `1px solid ${
                resendCooldown > 0 || isLoading ? "#E5E7EB" : "#4F46E5"
              }`,
              borderRadius: "6px",
              cursor:
                resendCooldown > 0 || isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!(resendCooldown > 0 || isLoading)) {
                e.target.style.backgroundColor = "#4F46E5";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (!(resendCooldown > 0 || isLoading)) {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#4F46E5";
              }
            }}
          >
            {resendCooldown > 0
              ? `Gửi lại sau ${resendCooldown}s`
              : "Gửi lại mã xác nhận"}
          </button>
        </div>

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
            ← Quay lại đăng ký
          </a>
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
            Đăng nhập →
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
              Mã có hiệu lực trong 10 phút
            </li>
            <li style={{ marginBottom: "4px" }}>Kiểm tra cả hộp thư spam</li>
            <li style={{ marginBottom: "4px" }}>
              Click link trong email để tự động xác nhận
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
