import React, { createContext, useState, useContext, useEffect } from "react";

// Tạo context cho xác thực
const AuthContext = createContext(null);

// Hook tùy chỉnh để sử dụng AuthContext
export const useAuth = () => useContext(AuthContext);

// Hardcoded coach accounts
const COACH_ACCOUNTS = [
  {
    id: 1,
    name: "Nguyên Văn A",
    email: "coach1@nosmoke.com",
    password: "coach123",
    role: "coach",
    specialization: "Coach cai thuốc chuyên nghiệp",
    rating: 4.8,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "coach2@nosmoke.com",
    password: "coach123",
    role: "coach",
    specialization: "Chuyên gia tâm lý",
    rating: 4.9,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Phạm Minh C",
    email: "coach3@nosmoke.com",
    password: "coach123",
    role: "coach",
    specialization: "Bác sĩ phục hồi chức năng",
    rating: 4.7,
    avatar: "https://randomuser.me/api/portraits/men/64.jpg",
  },
];

// Provider component
export const AuthProvider = ({ children }) => {
  // Khởi tạo trạng thái từ localStorage (nếu có)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("nosmoke_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lưu user vào localStorage khi thay đổi
  useEffect(() => {
    if (user) {
      localStorage.setItem("nosmoke_user", JSON.stringify(user));
    }
  }, [user]);

  // Hàm đăng ký tài khoản mới
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // GỌI API BACKEND THẬT
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Đăng ký thất bại");
      }

      if (result.success) {
        // Lưu user info vào state, ưu tiên username từ backend
        const backendUser = result.data?.user || result.user;
        const userInfo = {
          id: result.userId || backendUser?.id,
          name: backendUser?.username || backendUser?.name || userData.name,
          email: userData.email,
          role: backendUser?.role || "user",
          createdAt: new Date().toISOString(),
        };

        setUser(userInfo);
        setLoading(false);

        return { success: true, user: userInfo };
      } else {
        throw new Error(result.message || "Đăng ký thất bại");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm đăng nhập
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // GỌI API BACKEND THẬT
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Đăng nhập thất bại");
      }

      if (result.success) {
        // Lưu user info vào state, ưu tiên username từ backend
        const backendUser = result.data?.user || result.user;
        const userInfo = {
          id: result.userId || backendUser?.id,
          name: backendUser?.username || backendUser?.name || email,
          email: email,
          role: backendUser?.role || "user",
          createdAt: new Date().toISOString(),
        };

        setUser(userInfo);
        setLoading(false);

        return { success: true, user: userInfo };
      } else {
        throw new Error(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      // Fallback cho coach accounts nếu backend không có
      try {
        const foundCoach = COACH_ACCOUNTS.find(
          (coach) => coach.email === email && coach.password === password
        );
        if (foundCoach) {
          const { password: _, ...coachWithoutPassword } = foundCoach;
          const coachUser = { ...coachWithoutPassword, role: "coach" };
          setUser(coachUser);
          setLoading(false);

          // Redirect coach đến dashboard
          window.location.href = "/coach";

          return { success: true, user: coachUser };
        }
      } catch {
        // Ignore coach error
      }

      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm đăng xuất
  const logout = () => {
    setUser(null);
    // Xóa thông tin user khỏi localStorage
    localStorage.removeItem("nosmoke_user");
    return { success: true };
  };
  // Đảm bảo rằng membership luôn là một giá trị hợp lệ
  const refreshMembership = () => {
    if (!user)
      return { success: false, error: "Không có người dùng để cập nhật" };

    // Đơn giản hóa - chỉ trả về user hiện tại
    return { success: true, user };
  };

  useEffect(() => {
    if (user) {
      let needUpdate = false;
      let updates = {};

      // Kiểm tra và đảm bảo membership hợp lệ
      if (
        !user.membership ||
        !["free", "premium", "pro"].includes(user.membership)
      ) {
        updates.membership = "free";
        needUpdate = true;
      }

      // Cập nhật nếu cần
      if (needUpdate) {
        console.log("Đồng bộ dữ liệu membership:", updates);
        setUser({ ...user, ...updates });
      }
    }
  }, [user]);
  // Hàm cập nhật thông tin người dùng
  const updateUser = (updatedData) => {
    if (!user)
      return { success: false, error: "Không có người dùng để cập nhật" };

    try {
      // Đảm bảo membership hợp lệ nếu đang cập nhật membership
      if (
        "membership" in updatedData &&
        !["free", "premium", "pro"].includes(updatedData.membership)
      ) {
        updatedData.membership = "free";
      }

      // Cập nhật user hiện tại trong state
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);

      // Cập nhật user trong localStorage cho phiên hiện tại
      localStorage.setItem("nosmoke_user", JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };
  // Hàm verify email
  const verifyEmail = async (email, token) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔐 Verifying email ${email} với token: ${token}`);
      
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      });

      const result = await response.json();
      console.log('🔐 Verify response:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || "Xác thực email thất bại");
      }

      if (result.success) {
        // Update user verification status if logged in
        if (user) {
          const updatedUser = { ...user, emailVerified: true };
          setUser(updatedUser);
        }
        
        setLoading(false);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || "Xác thực email thất bại");
      }
    } catch (err) {
      console.error('🔐 Verify error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm resend verification email
  const resendVerificationCode = async (email) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📧 Gửi lại mã xác thực cho email: ${email}`);
      
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Chỉ gửi email để resend
      });

      const result = await response.json();
      console.log('📧 Resend response:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || "Gửi lại mã xác thực thất bại");
      }

      if (result.success) {
        setLoading(false);
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || "Gửi lại mã xác thực thất bại");
      }
    } catch (err) {
      console.error('📧 Resend error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Giá trị context
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    verifyEmail,
    resendVerificationCode,
    updateUser,
    refreshMembership,
    setUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
