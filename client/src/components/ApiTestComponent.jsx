import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import apiService from "../utils/apiService";

const ApiTestComponent = () => {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    {
      name: "Get User Plans",
      endpoint: "plans.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Plan Templates",
      endpoint: "plans.getTemplates",
      requiresAuth: true,
    },
    {
      name: "Get User Progress",
      endpoint: "progress.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Achievements",
      endpoint: "achievements.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Coaches",
      endpoint: "coaches.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Appointments",
      endpoint: "appointments.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Blogs",
      endpoint: "blogs.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Community Posts",
      endpoint: "community.getPosts",
      requiresAuth: true,
    },
    {
      name: "Get Packages",
      endpoint: "packages.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Dashboard Stats",
      endpoint: "dashboard.getStats",
      requiresAuth: true,
    },
    {
      name: "Get Notifications",
      endpoint: "notifications.getAll",
      requiresAuth: true,
    },
    {
      name: "Get Smoking Status",
      endpoint: "smokingStatus.getUser",
      requiresAuth: true,
    },
    {
      name: "Get User Settings",
      endpoint: "settings.getUser",
      requiresAuth: true,
    },
    {
      name: "Get App Settings",
      endpoint: "settings.getApp",
      requiresAuth: false,
    },
  ];

  const testEndpoint = async (test) => {
    try {
      if (test.requiresAuth && !isAuthenticated) {
        return { status: "skipped", message: "Requires authentication" };
      }

      const pathArray = test.endpoint.split(".");
      let apiFunction = apiService;

      for (const path of pathArray) {
        apiFunction = apiFunction[path];
      }

      if (typeof apiFunction !== "function") {
        return { status: "error", message: "API function not found" };
      }

      const result = await apiFunction();
      return {
        status: "success",
        data: result,
        message: `✅ Success: ${result?.data?.length || "Data received"}`,
      };
    } catch (error) {
      return {
        status: "error",
        message: `❌ Error: ${error.response?.data?.message || error.message}`,
        details: error.response?.data,
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});

    for (const test of testEndpoints) {
      console.log(`Testing ${test.name}...`);
      const result = await testEndpoint(test);
      setTestResults((prev) => ({
        ...prev,
        [test.name]: result,
      }));
      // Add small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "skipped":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Frontend-Backend API Integration Test</h2>

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h3>Authentication Status</h3>
        <p>
          <strong>Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}
        </p>
        {user && (
          <p>
            <strong>User:</strong>{" "}
            {user.name || user.FullName || user.email || "Unknown"}
          </p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={runAllTests}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Testing APIs..." : "Test All APIs"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {testEndpoints.map((test) => {
          const result = testResults[test.name];
          return (
            <div
              key={test.name}
              style={{
                padding: "15px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                backgroundColor: result
                  ? result.status === "success"
                    ? "#f0fdf4"
                    : result.status === "error"
                    ? "#fef2f2"
                    : "#fefce8"
                  : "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "16px" }}>{test.name}</h4>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: result
                      ? getStatusColor(result.status)
                      : "#6b7280",
                    color: "white",
                  }}
                >
                  {test.endpoint}
                </span>
              </div>
              {result && (
                <div style={{ marginTop: "10px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: getStatusColor(result.status),
                    }}
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <details style={{ marginTop: "5px", fontSize: "12px" }}>
                      <summary>Details</summary>
                      <pre
                        style={{
                          marginTop: "5px",
                          padding: "10px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "4px",
                          overflow: "auto",
                          maxHeight: "200px",
                        }}
                      >
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApiTestComponent;
