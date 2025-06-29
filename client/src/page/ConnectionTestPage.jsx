import React, { useState, useEffect } from 'react';

const ConnectionTestPage = () => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [users, setUsers] = useState([]);
  const [testResult, setTestResult] = useState('');

  // Test basic backend connection
  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (response.ok) {
        setBackendStatus('✅ Connected');
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        setBackendStatus('❌ Failed - ' + response.status);
      }
    } catch (error) {
      setBackendStatus('❌ Error - ' + error.message);
    }
  };

  // Test user registration
  const testUserRegistration = async () => {
    try {
      const testUser = {
        Name: 'Test User ' + Date.now(),
        Email: 'test' + Date.now() + '@example.com',
        Password: 'testpass123',
        Age: 25,
        Gender: 'Male'
      };

      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResult('✅ User registration successful: ' + JSON.stringify(data));
        testBackendConnection(); // Refresh user list
      } else {
        setTestResult('❌ Registration failed: ' + data.message);
      }
    } catch (error) {
      setTestResult('❌ Registration error: ' + error.message);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔗 Frontend ↔ Backend Connection Test</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Connection Status</h3>
        <p><strong>Frontend:</strong> ✅ Running on http://localhost:5175</p>
        <p><strong>Backend:</strong> {backendStatus}</p>
      </div>

      <div style={{ backgroundColor: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Existing Users ({users.length})</h3>
        {users.length > 0 ? (
          <ul>
            {users.slice(0, 5).map((user, index) => (
              <li key={index}>
                {user.Name} ({user.Email}) - {user.RoleName}
              </li>
            ))}
          </ul>
        ) : (
          <p>No users found or still loading...</p>
        )}
        <button 
          onClick={testBackendConnection}
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔄 Refresh Users
        </button>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Test User Registration</h3>
        <button 
          onClick={testUserRegistration}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ➕ Create Test User
        </button>
        {testResult && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
            {testResult}
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#d1ecf1', padding: '15px', borderRadius: '5px' }}>
        <h3>📝 Quick API Test</h3>
        <p>You can also test these endpoints directly:</p>
        <ul>
          <li><a href="http://localhost:5000/api/users" target="_blank" rel="noopener noreferrer">GET /api/users</a></li>
          <li><a href="http://localhost:5000/" target="_blank" rel="noopener noreferrer">Backend Home</a></li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTestPage;
