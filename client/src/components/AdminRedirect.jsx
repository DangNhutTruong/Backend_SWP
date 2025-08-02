import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component này sẽ redirect admin đến trang quản trị của họ
const AdminRedirect = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu user có quyền admin, redirect đến /admin
    if (user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Nếu không phải admin, render children bình thường
  if (user && user.role === 'admin') {
    return null; // Không render gì cả khi đang redirect
  }

  return children;
};

export default AdminRedirect;
