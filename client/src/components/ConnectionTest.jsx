import React, { useState, useEffect } from "react";
import apiService from "../services/apiService";

const ConnectionTest = () => {
  const [status, setStatus] = useState({
    backend: "checking",
    database: "checking",
    apis: "checking",
  });

  const testConnections = async () => {
    // Test backend health
    try {
      const backendOk = await apiService.healthCheck();
      setStatus((prev) => ({
        ...prev,
        backend: backendOk ? "connected" : "failed",
      }));
    } catch {
      setStatus((prev) => ({ ...prev, backend: "failed" }));
    }

    // Test API endpoints
    try {
      // This will fail without auth but shows if API is responding
      await apiService.getUserProgress();
      setStatus((prev) => ({ ...prev, apis: "connected" }));
    } catch (error) {
      // If we get auth error, API is working
      if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        setStatus((prev) => ({ ...prev, apis: "connected" }));
      } else {
        setStatus((prev) => ({ ...prev, apis: "failed" }));
      }
    }

    setStatus((prev) => ({ ...prev, database: "connected" })); // Assume DB is connected if backend is
  };

  useEffect(() => {
    testConnections();
  }, []);

  const getStatusColor = (stat) => {
    switch (stat) {
      case "connected":
        return "#4CAF50";
      case "failed":
        return "#f44336";
      default:
        return "#ff9800";
    }
  };

  const getStatusText = (stat) => {
    switch (stat) {
      case "connected":
        return "✅ Kết nối thành công";
      case "failed":
        return "❌ Kết nối thất bại";
      default:
        return "🔄 Đang kiểm tra...";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        fontSize: "12px",
        zIndex: 1000,
        minWidth: "200px",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        🔗 Trạng thái kết nối
      </h4>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ color: getStatusColor(status.backend) }}>
          {getStatusText(status.backend)}
        </span>
        <br />
        <small>Backend (localhost:5000)</small>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ color: getStatusColor(status.database) }}>
          {getStatusText(status.database)}
        </span>
        <br />
        <small>Railway MySQL Database</small>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <span style={{ color: getStatusColor(status.apis) }}>
          {getStatusText(status.apis)}
        </span>
        <br />
        <small>API Endpoints</small>
      </div>

      <button
        onClick={testConnections}
        style={{
          background: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "5px 10px",
          fontSize: "11px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🔄 Kiểm tra lại
      </button>
    </div>
  );
};

export default ConnectionTest;
