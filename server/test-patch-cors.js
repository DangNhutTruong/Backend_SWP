// Test script to diagnose CORS issues with PATCH requests

import fetch from 'node-fetch';

const testPatchRequest = async () => {
  try {
    console.log('🔄 Testing PATCH request to appointment status endpoint...');
    
    const appointmentId = 148; // Replace with an actual appointment ID
    const status = 'confirmed';
    
    // URL to test
    const url = 'http://localhost:5000/api/appointments/148/status';
    
    // Options for the request
    const options = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with an actual token
      },
      body: JSON.stringify({ status })
    };
    
    console.log(`📡 Sending request to: ${url}`);
    console.log('🔧 Request options:', {
      method: options.method,
      headers: options.headers,
      body: options.body
    });
    
    // Send the request
    const response = await fetch(url, options);
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log('📋 Response headers:', response.headers.raw());
    
    // Get response body
    const data = await response.text();
    try {
      const jsonData = JSON.parse(data);
      console.log('📄 Response data:', jsonData);
    } catch (e) {
      console.log('📄 Response text:', data);
    }
    
    if (!response.ok) {
      console.error('❌ Request failed');
    } else {
      console.log('✅ Request succeeded');
    }
    
  } catch (error) {
    console.error('❌ Error testing PATCH request:', error);
  }
};

// Run the test
testPatchRequest();
