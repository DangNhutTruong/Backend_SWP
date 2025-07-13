/**
 * Test script để kiểm tra endpoint appointments-update
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

// Config
const API_BASE = 'http://localhost:5000';
const APPOINTMENT_ID = 147; // Thay đổi ID nếu cần
const AUTH_TOKEN = ''; // Thêm token của bạn ở đây

async function testEndpoint() {
  console.log(chalk.blue('🔍 Kiểm tra endpoint cập nhật trạng thái booking'));
  
  // Danh sách endpoint cần test
  const endpoints = [
    {
      name: 'New POST endpoint (plural)',
      method: 'POST',
      url: `${API_BASE}/api/appointments-update/${APPOINTMENT_ID}/status`,
      body: { status: 'confirmed' }
    },
    {
      name: 'Backup POST endpoint (singular)',
      method: 'POST',
      url: `${API_BASE}/api/appointment-update/${APPOINTMENT_ID}/status`, 
      body: { status: 'confirmed' }
    },
    {
      name: 'Original PATCH endpoint',
      method: 'PATCH',
      url: `${API_BASE}/api/appointments/${APPOINTMENT_ID}/status`,
      body: { status: 'confirmed' }
    }
  ];
  
  // Test OPTIONS trước (preflight)
  console.log(chalk.yellow('\n📋 Test OPTIONS preflight:'));
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5175'
        }
      });
      
      console.log(chalk.green(`✅ ${endpoint.name} OPTIONS: ${response.status} ${response.statusText}`));
      console.log('Headers:', response.headers.raw());
    } catch (error) {
      console.log(chalk.red(`❌ ${endpoint.name} OPTIONS failed: ${error.message}`));
    }
  }
  
  // Test các endpoint chính
  console.log(chalk.yellow('\n📋 Test endpoints:'));
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5175',
          'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : ''
        },
        body: JSON.stringify(endpoint.body)
      });
      
      let responseText;
      try {
        const data = await response.json();
        responseText = JSON.stringify(data, null, 2);
      } catch (e) {
        responseText = await response.text() || '(empty response)';
      }
      
      if (response.ok) {
        console.log(chalk.green(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`));
      } else {
        console.log(chalk.red(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`));
      }
      
      console.log('Response:', responseText);
    } catch (error) {
      console.log(chalk.red(`❌ ${endpoint.name} failed: ${error.message}`));
    }
  }
}

// Chạy test
testEndpoint().catch(error => {
  console.error(chalk.red('❌ Test failed with error:'), error);
});
