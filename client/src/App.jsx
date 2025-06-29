import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ApiTestComponent from "./components/ApiTestComponent.jsx";

// Simple components
const HomePage = () => (
  <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1>🚭 Quit Smoking Support Platform</h1>
    <p>Chào mừng bạn đến với ứng dụng hỗ trợ cai thuốc lá!</p>
    <div style={{ marginTop: '30px' }}>
      <p><a href="/api-test" style={{ color: '#007bff', textDecoration: 'none' }}>🔧 Test API</a></p>
      <p><a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>🔑 Đăng nhập</a></p>
      <p><a href="/register" style={{ color: '#007bff', textDecoration: 'none' }}>📝 Đăng ký</a></p>
    </div>
    <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
      <p>Backend: <a href="http://localhost:5000" target="_blank" rel="noopener noreferrer">http://localhost:5000</a></p>
      <p>Frontend: http://localhost:5177</p>
    </div>
  </div>
);

const LoginPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Đăng nhập</h2>
    <p>Trang đăng nhập đang được phát triển...</p>
    <p><a href="/">← Quay về trang chủ</a></p>
  </div>
);

const RegisterPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Đăng ký</h2>
    <p>Trang đăng ký đang được phát triển...</p>
    <p><a href="/">← Quay về trang chủ</a></p>
  </div>
);

const ApiTestPage = () => (
  <div style={{ padding: '20px' }}>
    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
      <h2>API Test</h2>
      <p><a href="/">← Quay về trang chủ</a></p>
    </div>
    <ApiTestComponent />
  </div>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/api-test",
    element: <ApiTestPage />,
  }
]);

function App() {
  return (
    <AuthProvider>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;
