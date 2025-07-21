// testFunctions.js

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function calculatePlanDays(startDate, endDate) {
  const diff = new Date(endDate) - new Date(startDate);
  return diff / (1000 * 60 * 60 * 24);
}

function isValidFeedback(text) {
  return text && text.length >= 10;
}

// Giả lập các trường giao diện của form (dùng để test màn hình)
function getRegisterFormFields() {
  return ['email', 'password', 'confirmPassword'];
}

function getPlanFormFields() {
  return ['startDate', 'endDate'];
}

function getFeedbackFormFields() {
  return ['content'];
}

module.exports = {
  isValidEmail,
  calculatePlanDays,
  isValidFeedback,
  getRegisterFormFields,
  getPlanFormFields,
  getFeedbackFormFields
};
