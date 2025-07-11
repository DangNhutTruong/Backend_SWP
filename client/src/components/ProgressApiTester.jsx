import React, { useState } from "react";
import {
  createCheckin,
  getUserProgress,
  getProgressByDate,
  updateCheckin,
  deleteCheckin,
  getProgressStats,
  getChartData,
  createCheckinData,
} from "../services/progressService";

const ProgressApiTester = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testCreateCheckin = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const testCheckin = createCheckinData(
        1, // plan_id (cần có plan trong database)
        today,
        5, // cigarettes_smoked
        10, // target_cigarettes
        "good", // status
        "Ngày tốt, ít hút hơn mục tiêu"
      );

      const response = await createCheckin(testCheckin);
      setResult(
        `✅ Created checkin successfully: ${JSON.stringify(response, null, 2)}`
      );
    } catch (error) {
      setResult(`❌ Error creating checkin: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetUserProgress = async () => {
    setLoading(true);
    try {
      const response = await getUserProgress(1, 10); // planId=1, limit=10
      setResult(`✅ Got user progress: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error getting progress: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetProgressByDate = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await getProgressByDate(today);
      setResult(
        `✅ Got progress by date: ${JSON.stringify(response, null, 2)}`
      );
    } catch (error) {
      setResult(`❌ Error getting progress by date: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetProgressStats = async () => {
    setLoading(true);
    try {
      const response = await getProgressStats(1); // planId=1
      setResult(`✅ Got progress stats: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error getting stats: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetChartData = async () => {
    setLoading(true);
    try {
      const response = await getChartData(1, 30); // planId=1, days=30
      setResult(`✅ Got chart data: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ Error getting chart data: ${error.message}`);
    }
    setLoading(false);
  };

  const checkToken = () => {
    const token =
      localStorage.getItem("auth_token") || localStorage.getItem("token");
    if (token) {
      setResult(`✅ Token found: ${token.substring(0, 50)}...`);
    } else {
      setResult(`❌ No auth token found in localStorage`);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>📊 Progress API Tester</h2>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={checkToken} style={{ marginRight: "10px" }}>
          Check Auth Token
        </button>
        <button
          onClick={testCreateCheckin}
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          Test Create Checkin
        </button>
        <button
          onClick={testGetUserProgress}
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          Test Get User Progress
        </button>
        <button
          onClick={testGetProgressByDate}
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          Test Get Progress By Date
        </button>
        <button
          onClick={testGetProgressStats}
          disabled={loading}
          style={{ marginRight: "10px" }}
        >
          Test Get Progress Stats
        </button>
        <button onClick={testGetChartData} disabled={loading}>
          Test Get Chart Data
        </button>
      </div>

      {loading && <div>⏳ Loading...</div>}

      <div
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "5px",
          minHeight: "200px",
          whiteSpace: "pre-wrap",
          maxHeight: "400px",
          overflow: "auto",
        }}
      >
        {result || "Click a button to test API..."}
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p>ℹ️ Make sure you're logged in and the backend server is running</p>
        <p>
          📍 Backend URL:{" "}
          {import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}
        </p>
        <p>
          ⚠️ You need at least one quit plan in database for progress APIs to
          work
        </p>

        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#fff3cd",
            borderRadius: "5px",
          }}
        >
          <h4>📋 Test Sequence:</h4>
          <ol>
            <li>Check Auth Token</li>
            <li>Create a quit plan first (use Quit Plan Tester)</li>
            <li>Test Create Checkin</li>
            <li>Test other APIs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ProgressApiTester;
