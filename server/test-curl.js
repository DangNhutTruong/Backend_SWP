// Test endpoint với curl

const { exec } = require('child_process');
const appointmentId = 148; // Thay bằng ID cuộc hẹn thực tế
const status = 'confirmed';

// Thay bằng token thực tế (lấy từ localStorage sau khi đăng nhập)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Tạo curl command
const curlCommand = `
curl -v -X POST "http://localhost:5000/api/appointment-update/${appointmentId}/status" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer ${token}" ^
  -d "{\\"status\\":\\"${status}\\"}"
`;

console.log('🔄 Thực hiện request...');
console.log(curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Lỗi thực hiện: ${error.message}`);
    return;
  }
  
  console.log('🔍 Thông tin chi tiết:');
  console.log(stderr);
  
  console.log('📋 Kết quả:');
  console.log(stdout);
});
