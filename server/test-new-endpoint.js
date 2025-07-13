// Kiểm tra endpoint mới với fetch API

import fetch from 'node-fetch';

const testNewEndpoint = async () => {
  try {
    console.log('🔍 Kiểm tra endpoint mới...');
    
    // Thông tin cuộc hẹn cần cập nhật
    const appointmentId = 148; // Thay bằng ID thực tế
    
    // URL endpoint mới
    const url = `http://localhost:5000/api/appointment-update/${appointmentId}/status`;
    
    console.log(`📡 Gửi request POST đến: ${url}`);
    
    // Thay thế bằng token thực tế của bạn
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Cần thay thế
    
    // Gửi request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'confirmed'
      })
    });
    
    console.log(`🔄 Mã trạng thái: ${response.status} ${response.statusText}`);
    console.log('📋 Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response thành công:', data);
    } else {
      const text = await response.text();
      try {
        const errorJson = JSON.parse(text);
        console.error('❌ Lỗi:', errorJson);
      } catch (e) {
        console.error('❌ Lỗi:', text);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi gọi API:', error);
  }
};

// Chạy test
testNewEndpoint().catch(console.error);
