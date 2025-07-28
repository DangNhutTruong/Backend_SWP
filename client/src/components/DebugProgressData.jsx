import React, { useState, useEffect } from 'react';
import { getCurrentUserId } from '../utils/userUtils';

const DebugProgressData = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const runDebug = async () => {
    console.log("🔍 RUNNING DEBUG...");
    
    const debug = {
      localStorage: {},
      database: {},
      calculated: {}
    };

    // 1. Check localStorage
    try {
      const activePlan = localStorage.getItem('activePlan');
      const dashboardStats = localStorage.getItem('dashboardStats');
      
      debug.localStorage = {
        activePlan: activePlan ? JSON.parse(activePlan) : null,
        dashboardStats: dashboardStats ? JSON.parse(dashboardStats) : null
      };
    } catch (error) {
      debug.localStorage.error = error.message;
    }

    // 2. Check database
    try {
      // Sử dụng getCurrentUserId để tìm user ID như các component khác
      const userId = getCurrentUserId();
      
      // Debug thêm thông tin về user ID
      debug.userInfo = {
        userId: userId,
        userIdSources: {
          user_id: localStorage.getItem('user_id'),
          userId: localStorage.getItem('userId'), 
          nosmoke_user: localStorage.getItem('nosmoke_user'),
          user: localStorage.getItem('user')
        }
      };
      
      console.log("🔍 Debug - User ID sources:", debug.userInfo);
      
      if (userId) {
        console.log(`🔍 Debug - Trying to fetch progress for user ID: ${userId}`);
        const response = await fetch(`/api/progress/${userId}`);
        console.log(`🔍 Debug - Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          debug.database = result;
          console.log("🔍 Debug - Database result:", result);
          
          // 3. Calculate stats
          if (result.success && result.data) {
            let totalSaved = 0;
            let totalMoney = 0;
            
            result.data.forEach(item => {
              const saved = Math.max(0, (item.target_cigarettes || 0) - (item.actual_cigarettes || 0));
              totalSaved += saved;
              totalMoney += item.money_saved || 0;
            });
            
            debug.calculated = {
              totalSaved,
              totalMoney,
              checkinsCount: result.data.length
            };
          }
        } else {
          debug.database.error = `HTTP ${response.status}`;
        }
      } else {
        debug.database.error = "No user ID found using getCurrentUserId()";
      }
    } catch (error) {
      debug.database.error = error.message;
    }

    setDebugInfo(debug);
    console.log("Debug info:", debug);
  };

  useEffect(() => {
    runDebug();
  }, []);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 10000,
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔍 DEBUG
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      background: 'white',
      border: '2px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      zIndex: 10000,
      fontSize: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>Debug Progress Data</h3>
        <button onClick={() => setIsVisible(false)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px' }}>×</button>
      </div>
      
      <button onClick={runDebug} style={{ marginBottom: '10px', padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}>
        🔄 Refresh Debug
      </button>

      <div style={{ marginBottom: '15px' }}>
        <h4>� User Info:</h4>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo.userInfo, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>�📦 LocalStorage:</h4>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo.localStorage, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>🗄️ Database:</h4>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo.database, null, 2)}
        </pre>
      </div>

      <div>
        <h4>🧮 Calculated:</h4>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '10px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo.calculated, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugProgressData;
