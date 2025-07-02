import React, { createContext, useState, useEffect } from "react";
import apiService from "../services/apiService.js";

// Tạo context cho xác thực
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  // Khởi tạo trạng thái từ localStorage (nếu có)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Kiểm tra token khi app khởi động
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Hàm đăng ký tài khoản mới
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.register(userData);

      if (result.success) {
        setLoading(false);
        return { success: true, message: result.message };
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
      const result = await apiService.login({ email, password });

      if (result.success && result.user) {
        setUser(result.user);
        setLoading(false);
        return { success: true, user: result.user };
      } else {
        throw new Error(result.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    setLoading(true);

    try {
      await apiService.logout();
      setUser(null);
      setError(null);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm cập nhật thông tin user
  const updateUser = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.updateUserProfile(userData);

      if (result.success) {
        const updatedUser = { ...user, ...result.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setLoading(false);
        return { success: true, user: updatedUser };
      } else {
        throw new Error(result.message || "Cập nhật thất bại");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Hàm kiểm tra quyền
  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("token");
  };

  // Hàm clear error
  const clearError = () => {
    setError(null);
  };

  // Giá trị context
  const contextValue = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    hasRole,
    isAuthenticated,
    clearError,
    setUser, // Để compatibility với code cũ
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
