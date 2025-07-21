// unit-test.js
const { isValidEmail, calculatePlanDays, isValidFeedback, getRegisterFormFields, getPlanFormFields, getFeedbackFormFields } = require('./testFunctions');

// Test đăng ký - kiểm tra các trường hiển thị
test('Form đăng ký có các trường cần thiết', () => {
  const fields = getRegisterFormFields();
  expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'confirmPassword']));
});

// Test đăng ký - kiểm tra email hợp lệ
test('Email hợp lệ trả về true', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
});

// Test tạo kế hoạch - kiểm tra giao diện
test('Form tạo kế hoạch có trường ngày bắt đầu và kết thúc', () => {
  const fields = getPlanFormFields();
  expect(fields).toEqual(expect.arrayContaining(['startDate', 'endDate']));
});

// Test tạo kế hoạch - tính số ngày giữa 2 mốc
test('Tính số ngày giữa 2 mốc', () => {
  expect(calculatePlanDays('2025-07-01', '2025-07-31')).toBe(30);
});

// Test gửi phản hồi - kiểm tra giao diện phản hồi
test('Form phản hồi có trường nội dung', () => {
  const fields = getFeedbackFormFields();
  expect(fields).toEqual(expect.arrayContaining(['content']));
});

// Test gửi phản hồi - kiểm tra nội dung phản hồi hợp lệ
test('Feedback hợp lệ trả về true', () => {
  expect(isValidFeedback('This is a valid feedback text.')).toBe(true);
});
