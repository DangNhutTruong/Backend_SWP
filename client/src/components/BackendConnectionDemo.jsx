import React, { useState, useEffect } from "react";
import apiService from "../services/apiService.js";
import { useAuth } from "../hooks/useAuth.js";

const BackendConnectionDemo = () => {
  const { user, login, register, logout, loading, error } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [packages, setPackages] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [testResults, setTestResults] = useState([]);

  // Test health endpoint khi component load
  useEffect(() => {
    const testBackendHealth = async () => {
      try {
        const health = await apiService.healthCheck();
        setHealthStatus(health);
        addTestResult("✅ Backend Health Check", "SUCCESS", health);
      } catch (error) {
        setHealthStatus({ status: "ERROR", message: error.message });
        addTestResult("❌ Backend Health Check", "FAILED", error.message);
      }
    };

    const loadPublicData = async () => {
      try {
        // Test load packages
        const packagesData = await apiService.getPackages();
        setPackages(packagesData.data || []);
        addTestResult(
          "✅ Load Packages",
          "SUCCESS",
          `Loaded ${packagesData.data?.length || 0} packages`
        );

        // Test load achievements
        const achievementsData = await apiService.getAchievements();
        setAchievements(achievementsData.data || []);
        addTestResult(
          "✅ Load Achievements",
          "SUCCESS",
          `Loaded ${achievementsData.data?.length || 0} achievements`
        );
      } catch (error) {
        addTestResult("❌ Load Public Data", "FAILED", error.message);
      }
    };

    testBackendHealth();
    loadPublicData();
  }, []);

  const addTestResult = (test, status, detail) => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        status,
        detail,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleTestRegister = async () => {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: "password123",
      full_name: "Test User Demo",
      role: "smoker",
    };

    try {
      const result = await register(testUser);
      if (result.success) {
        addTestResult(
          "✅ User Registration",
          "SUCCESS",
          "User registered successfully"
        );
      } else {
        addTestResult("❌ User Registration", "FAILED", result.error);
      }
    } catch (error) {
      addTestResult("❌ User Registration", "FAILED", error.message);
    }
  };

  const handleTestLogin = async () => {
    const credentials = {
      email: "test@example.com",
      password: "password123",
    };

    try {
      const result = await login(credentials.email, credentials.password);
      if (result.success) {
        addTestResult(
          "✅ User Login",
          "SUCCESS",
          `Logged in as ${result.user.email}`
        );
      } else {
        addTestResult("❌ User Login", "FAILED", result.error);
      }
    } catch (error) {
      addTestResult("❌ User Login", "FAILED", error.message);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">
        🔗 Demo Kết Nối Frontend - Backend
      </h1>

      {/* Backend Health Status */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🏥 Trạng thái Backend</h2>
        {healthStatus ? (
          <div
            className={`p-4 rounded-md ${
              healthStatus.status === "OK"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <p>
              <strong>Status:</strong> {healthStatus.status}
            </p>
            <p>
              <strong>Message:</strong> {healthStatus.message}
            </p>
            {healthStatus.timestamp && (
              <p>
                <strong>Time:</strong> {healthStatus.timestamp}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Đang kiểm tra kết nối...</p>
        )}
      </div>

      {/* User Authentication */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">👤 Xác thực người dùng</h2>
        {user ? (
          <div className="bg-green-100 p-4 rounded-md">
            <p className="text-green-800">
              <strong>Đã đăng nhập:</strong> {user.email}
            </p>
            <p className="text-green-800">
              <strong>Vai trò:</strong> {user.role}
            </p>
            <button
              onClick={logout}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={loading}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleTestRegister}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
              disabled={loading}
            >
              Test Đăng ký
            </button>
            <button
              onClick={handleTestLogin}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              Test Đăng nhập
            </button>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
            <strong>Lỗi:</strong> {error}
          </div>
        )}
      </div>

      {/* Public Data */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Packages */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            📦 Gói dịch vụ ({packages.length})
          </h2>
          <div className="max-h-60 overflow-y-auto">
            {packages.length > 0 ? (
              packages.map((pkg, index) => (
                <div key={index} className="p-3 bg-white rounded-md mb-2">
                  <p>
                    <strong>{pkg.name}</strong>
                  </p>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                  <p className="text-sm font-semibold text-green-600">
                    {pkg.price} VND
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Chưa có dữ liệu gói dịch vụ</p>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            🏆 Thành tựu ({achievements.length})
          </h2>
          <div className="max-h-60 overflow-y-auto">
            {achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <div key={index} className="p-3 bg-white rounded-md mb-2">
                  <p>
                    <strong>{achievement.name}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {achievement.description}
                  </p>
                  <p className="text-sm font-semibold text-blue-600">
                    {achievement.points} điểm
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Chưa có dữ liệu thành tựu</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🧪 Kết quả Test API</h2>
          <button
            onClick={clearTestResults}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Xóa kết quả
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md mb-2 ${
                  result.status === "SUCCESS" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{result.test}</p>
                    <p className="text-sm">{result.detail}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Chưa có kết quả test nào</p>
          )}
        </div>
      </div>

      {/* API Documentation */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📖 Thông tin API</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">🔐 Authentication APIs:</h3>
            <ul className="space-y-1 text-gray-700">
              <li>POST /api/auth/register - Đăng ký</li>
              <li>POST /api/auth/login - Đăng nhập</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📊 Public APIs:</h3>
            <ul className="space-y-1 text-gray-700">
              <li>GET /api/packages - Danh sách gói</li>
              <li>GET /api/achievements - Thành tựu</li>
              <li>GET /api/coaches - Huấn luyện viên</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          🌐 Backend URL:{" "}
          <code className="bg-white px-2 py-1 rounded">
            http://localhost:5000
          </code>
        </p>
      </div>
    </div>
  );
};

export default BackendConnectionDemo;
