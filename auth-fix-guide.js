#!/usr/bin/env node

/**
 * Quick Authentication Fix Script
 * Fixes common authentication issues in the appointment system
 */

console.log('🔧 Authentication Quick Fix Script');
console.log('==================================\n');

const fixes = [
  {
    title: 'Frontend Authentication Issues',
    steps: [
      '1. Open browser console (F12)',
      '2. Run: window.debugAuth.fullReport()',
      '3. Check if token exists and is valid',
      '4. If no token: Login again',
      '5. If token exists but API fails: Check backend logs'
    ]
  },
  {
    title: 'Common API Error: "No token provided"',
    steps: [
      '1. Check localStorage: localStorage.getItem("nosmoke_token")',
      '2. If null: User needs to login again',
      '3. If exists: Check if AuthContext is saving token correctly',
      '4. Verify API utility is adding Authorization header'
    ]
  },
  {
    title: 'Coach API not loading',
    steps: [
      '1. Check if backend is running on port 5000',
      '2. Test: curl http://localhost:5000/api/coaches',
      '3. Coaches endpoint is public - no auth needed',
      '4. Check network tab for CORS/proxy issues'
    ]
  },
  {
    title: 'Backend Token Validation',
    steps: [
      '1. Check JWT_SECRET in server/.env',
      '2. Verify middleware/authMiddleware.js',
      '3. Check token format: Bearer <token>',
      '4. Test with Postman/curl'
    ]
  }
];

fixes.forEach((fix, index) => {
  console.log(`${index + 1}. ${fix.title}`);
  console.log('   ' + fix.steps.join('\n   '));
  console.log('');
});

console.log('🚀 Quick Test Commands:');
console.log('========================');
console.log('');
console.log('Frontend (Browser Console):');
console.log('  window.debugAuth.fullReport()');
console.log('  window.debugAuth.clearAuth()  // Reset auth');
console.log('');
console.log('Backend (Terminal):');
console.log('  curl http://localhost:5000/health');
console.log('  curl http://localhost:5000/api/coaches');
console.log('');
console.log('Test with auth:');
console.log('  curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/appointments/user');
console.log('');

console.log('📝 Files to check:');
console.log('==================');
console.log('Frontend:');
console.log('  - src/utils/api.js (token handling)');
console.log('  - src/context/AuthContext.jsx (token storage)');
console.log('  - src/utils/userAppointmentApi.js (API calls)');
console.log('');
console.log('Backend:');
console.log('  - server/src/middleware/authMiddleware.js');
console.log('  - server/src/routes/appointmentRoutes.js');
console.log('  - server/.env (JWT_SECRET)');
console.log('');

console.log('✅ Authentication Fix Complete!');
console.log('');
console.log('Next steps:');
console.log('1. Restart both frontend and backend');
console.log('2. Login with a test account');
console.log('3. Use debug utility to verify token');
console.log('4. Test appointment creation');
console.log('');
console.log('If issues persist, check the console logs and network tab.');
