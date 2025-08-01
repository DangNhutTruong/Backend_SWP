import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StorageDebugger = () => {
  const { user } = useAuth();
  const [storageData, setStorageData] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const loadStorageData = () => {
    const data = {
      localStorage: {},
      sessionStorage: {}
    };

    // Lấy tất cả keys từ localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        data.localStorage[key] = value ? JSON.parse(value) : value;
      } catch (e) {
        data.localStorage[key] = localStorage.getItem(key);
      }
    }

    // Lấy tất cả keys từ sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      try {
        const value = sessionStorage.getItem(key);
        data.sessionStorage[key] = value ? JSON.parse(value) : value;
      } catch (e) {
        data.sessionStorage[key] = sessionStorage.getItem(key);
      }
    }

    setStorageData(data);
  };

  useEffect(() => {
    loadStorageData();
    
    // Refresh mỗi 5 giây nếu component đang hiển thị
    const interval = setInterval(() => {
      if (isVisible) {
        loadStorageData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const clearAllStorage = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu localStorage và sessionStorage? Điều này sẽ đăng xuất bạn.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const clearSpecificKey = (storage, key) => {
    if (storage === 'localStorage') {
      localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
    loadStorageData();
  };

  const clearAppData = () => {
    const appKeys = ['activePlan', 'actualProgress', 'dashboardStats', 'quitPlanCompletion'];
    appKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    loadStorageData();
    alert('Đã xóa dữ liệu ứng dụng');
  };

  if (!isVisible) {
    return (
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontSize: '12px'
          }}
        >
          Debug Storage
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      overflow: 'auto',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>Storage Debugger</h4>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', fontSize: '16px' }}>×</button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Current User:</strong> {user ? `${user.name} (ID: ${user.id})` : 'Not logged in'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={loadStorageData} style={{ marginRight: '5px', padding: '3px 8px', fontSize: '11px' }}>
          Refresh
        </button>
        <button onClick={clearAppData} style={{ marginRight: '5px', padding: '3px 8px', fontSize: '11px', backgroundColor: '#ffc107' }}>
          Clear App Data
        </button>
        <button onClick={clearAllStorage} style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: '#dc3545', color: 'white' }}>
          Clear All
        </button>
      </div>

      <div>
        <h5>localStorage:</h5>
        {Object.keys(storageData.localStorage || {}).length === 0 ? (
          <p>No data</p>
        ) : (
          Object.entries(storageData.localStorage).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '5px', padding: '3px', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{key}:</strong>
                <button 
                  onClick={() => clearSpecificKey('localStorage', key)}
                  style={{ background: 'none', border: 'none', color: 'red', fontSize: '10px' }}
                >
                  ×
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              </pre>
            </div>
          ))
        )}
      </div>

      <div>
        <h5>sessionStorage:</h5>
        {Object.keys(storageData.sessionStorage || {}).length === 0 ? (
          <p>No data</p>
        ) : (
          Object.entries(storageData.sessionStorage).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '5px', padding: '3px', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{key}:</strong>
                <button 
                  onClick={() => clearSpecificKey('sessionStorage', key)}
                  style={{ background: 'none', border: 'none', color: 'red', fontSize: '10px' }}
                >
                  ×
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StorageDebugger;
