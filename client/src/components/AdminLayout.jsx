import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaSignOutAlt, 
  FaTachometerAlt, 
  FaUsersCog, 
  FaCreditCard,
  FaNewspaper,
  FaClipboardList,
  FaUserTie
} from 'react-icons/fa';
import '../styles/AdminLayout.css';

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Kiểm tra nếu không phải admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-layout">
        <div className="access-denied">
          <h2>Không có quyền truy cập</h2>
          <p>Bạn cần đăng nhập với tài khoản admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-profile">
          <h3>{user.name || user.username}</h3>
          <p>Quản trị viên hệ thống</p>
        </div>

        <nav className="admin-nav">
          <ul>
            <li>
              <button 
                onClick={() => navigate('/admin')}
                className={`nav-btn${location.pathname === '/admin' ? ' active' : ''}`}
              >
                <FaTachometerAlt /> Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/admin/users')}
                className={`nav-btn${location.pathname.startsWith('/admin/users') ? ' active' : ''}`}
              >
                <FaUsersCog /> Quản lý người dùng
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/admin/memberships')}
                className={`nav-btn${location.pathname.startsWith('/admin/memberships') ? ' active' : ''}`}
              >
                <FaCreditCard /> Gói thành viên & Thanh toán
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/admin/blog')}
                className={`nav-btn${location.pathname.startsWith('/admin/blog') ? ' active' : ''}`}
              >
                <FaNewspaper /> Quản lý bài viết
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/admin/quit-plans')}
                className={`nav-btn${location.pathname.startsWith('/admin/quit-plans') ? ' active' : ''}`}
              >
                <FaClipboardList /> Kế hoạch cai thuốc mẫu
              </button>
            </li>
            <li>
              <button 
                onClick={() => navigate('/admin/coaches')}
                className={`nav-btn${location.pathname.startsWith('/admin/coaches') ? ' active' : ''}`}
              >
                <FaUserTie /> Quản lý huấn luyện viên
              </button>
            </li>
          </ul>
        </nav>

        <div className="admin-logout">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
