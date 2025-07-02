import React, { useState, useEffect } from "react";
import apiService from "../services/apiService.js";
import { useAuth } from "../hooks/useAuth.js";

const EndToEndTester = () => {
  const { user, login, register, logout, loading, error, clearError } =
    useAuth();
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState("");
  const [testUser] = useState({
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: "testpassword123",
    fullName: "Test User",
  });

  const addTestResult = (test, status, details = "") => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults((prev) => [
      ...prev,
      {
        test,
        status,
        details,
        timestamp,
      },
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
    clearError();
  };

  // Test 1: Backend Health Check
  const testBackendHealth = async () => {
    setCurrentTest("Backend Health Check");
    try {
      const response = await fetch("http://localhost:5000/health");
      const data = await response.json();

      if (response.ok && data.status === "OK") {
        addTestResult(
          "✅ Backend Health",
          "SUCCESS",
          `Server running: ${data.message}`
        );
      } else {
        addTestResult("❌ Backend Health", "FAILED", "Server response invalid");
      }
    } catch (error) {
      addTestResult(
        "❌ Backend Health",
        "FAILED",
        `Connection failed: ${error.message}`
      );
    }
  };

  // Test 2: API Endpoints Access
  const testAPIEndpoints = async () => {
    setCurrentTest("API Endpoints Access");
    const endpoints = [
      { path: "/api/packages", name: "Packages" },
      { path: "/api/achievements", name: "Achievements" },
      { path: "/api/coaches", name: "Coaches" },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint.path}`);
        if (response.ok || response.status === 401) {
          addTestResult(
            `✅ ${endpoint.name} API`,
            "SUCCESS",
            `HTTP ${response.status}`
          );
        } else {
          addTestResult(
            `❌ ${endpoint.name} API`,
            "FAILED",
            `HTTP ${response.status}`
          );
        }
      } catch (error) {
        addTestResult(`❌ ${endpoint.name} API`, "FAILED", error.message);
      }
    }
  };

  // Test 3: Registration Flow
  const testRegistration = async () => {
    setCurrentTest("User Registration");
    try {
      const result = await register({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        fullName: testUser.fullName,
      });

      if (result.success) {
        addTestResult(
          "✅ Registration",
          "SUCCESS",
          "User registered successfully"
        );
        return true;
      } else {
        addTestResult(
          "❌ Registration",
          "FAILED",
          result.error || "Registration failed"
        );
        return false;
      }
    } catch (error) {
      addTestResult("❌ Registration", "FAILED", error.message);
      return false;
    }
  };

  // Test 4: Login Flow
  const testLogin = async () => {
    setCurrentTest("User Login");
    try {
      const result = await login(testUser.email, testUser.password);

      if (result.success && result.user) {
        addTestResult(
          "✅ Login",
          "SUCCESS",
          `Logged in as: ${result.user.email}`
        );
        return true;
      } else {
        addTestResult("❌ Login", "FAILED", result.error || "Login failed");
        return false;
      }
    } catch (error) {
      addTestResult("❌ Login", "FAILED", error.message);
      return false;
    }
  };

  // Test 5: Protected API Access
  const testProtectedAPIs = async () => {
    setCurrentTest("Protected API Access");
    try {
      const profileResponse = await apiService.getUserProfile();
      if (profileResponse.success) {
        addTestResult(
          "✅ Get Profile",
          "SUCCESS",
          `User: ${profileResponse.data.email}`
        );
      } else {
        addTestResult("❌ Get Profile", "FAILED", "Profile fetch failed");
      }

      // Test other protected endpoints
      const protectedEndpoints = [
        { method: apiService.getQuitPlans, name: "Quit Plans" },
        { method: apiService.getProgress, name: "Progress" },
        { method: apiService.getNotifications, name: "Notifications" },
      ];
      for (const endpoint of protectedEndpoints) {
        try {
          await endpoint.method();
          addTestResult(`✅ ${endpoint.name}`, "SUCCESS", "API accessible");
        } catch (error) {
          addTestResult(`⚠️ ${endpoint.name}`, "WARNING", error.message);
        }
      }
    } catch (error) {
      addTestResult("❌ Protected APIs", "FAILED", error.message);
    }
  };

  // Test 6: Database Operations
  const testDatabaseOperations = async () => {
    setCurrentTest("Database Operations");
    try {
      // Test create operation
      const createResult = await apiService.createQuitPlan({
        name: "Test Plan",
        description: "Test quit smoking plan",
        targetDate: new Date().toISOString().split("T")[0],
      });

      if (createResult.success) {
        addTestResult("✅ Create Data", "SUCCESS", "Quit plan created");

        // Test read operation
        const readResult = await apiService.getQuitPlans();
        if (readResult.success) {
          addTestResult(
            "✅ Read Data",
            "SUCCESS",
            `Found ${readResult.data?.length || 0} plans`
          );
        }
      } else {
        addTestResult("❌ Database Ops", "FAILED", "Create operation failed");
      }
    } catch (error) {
      addTestResult("❌ Database Ops", "FAILED", error.message);
    }
  };

  // Test 7: Logout
  const testLogout = async () => {
    setCurrentTest("User Logout");
    try {
      const result = await logout();
      if (result.success) {
        addTestResult("✅ Logout", "SUCCESS", "User logged out successfully");
      } else {
        addTestResult("❌ Logout", "FAILED", result.error || "Logout failed");
      }
    } catch (error) {
      addTestResult("❌ Logout", "FAILED", error.message);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    clearResults();
    setCurrentTest("Starting comprehensive tests...");

    await testBackendHealth();
    await testAPIEndpoints();

    const registrationSuccess = await testRegistration();
    if (registrationSuccess) {
      const loginSuccess = await testLogin();
      if (loginSuccess) {
        await testProtectedAPIs();
        await testDatabaseOperations();
        await testLogout();
      }
    }

    setCurrentTest("Tests completed!");
  };

  // Auto-run tests on component mount
  useEffect(() => {
    const runInitialTest = async () => {
      await testBackendHealth();
    };
    runInitialTest();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      case "WARNING":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🧪 End-to-End System Tester
      </h1>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "🔄 Testing..." : "🚀 Run All Tests"}
          </button>

          <button
            onClick={clearResults}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            🗑️ Clear Results
          </button>
        </div>

        {currentTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-blue-800 font-medium">
              Current Test: {currentTest}
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
            <span className="text-red-800">❌ Error: {error}</span>
          </div>
        )}
      </div>

      {/* User Status */}
      {user && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-green-800 mb-2">👤 Current User</h3>
          <p className="text-green-700">Email: {user.email}</p>
          <p className="text-green-700">Role: {user.role}</p>
          <p className="text-green-700">ID: {user.id}</p>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            📊 Test Results ({testResults.length})
          </h2>
        </div>

        <div className="p-6">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tests run yet. Click "Run All Tests" to start.
            </p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(
                    result.status
                  )}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{result.test}</h4>
                      {result.details && (
                        <p className="text-sm mt-1 opacity-75">
                          {result.details}
                        </p>
                      )}
                    </div>
                    <span className="text-xs opacity-75 ml-4">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">📈 Test Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter((r) => r.status === "SUCCESS").length}
              </div>
              <div className="text-green-700 text-sm">Passed</div>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter((r) => r.status === "FAILED").length}
              </div>
              <div className="text-red-700 text-sm">Failed</div>
            </div>
            <div className="bg-yellow-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {testResults.filter((r) => r.status === "WARNING").length}
              </div>
              <div className="text-yellow-700 text-sm">Warnings</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndToEndTester;
