// API Service for Backend Connection
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic API call method
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      console.log(`API Call: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async verifyOTP(email, otp) {
    return this.apiCall('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  }

  // Resend OTP for email verification
  async resendOTP(email) {
    return this.apiCall('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Check if email exists
  async checkEmailExists(email) {
    return this.apiCall('/api/auth/check-email-exists', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Forgot Password - Send reset email
  async forgotPassword(email) {
    return this.apiCall('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Reset Password - Set new password with OTP
  async resetPassword(email, otp, newPassword) {
    return this.apiCall('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        email,
        otp, 
        newPassword 
      })
    });
  }

  async getUserProfile() {
    return this.apiCall('/api/users/profile');
  }

  // Progress endpoints
  async getUserProgress() {
    return this.apiCall('/api/progress/user');
  }

  async createCheckin(checkinData) {
    return this.apiCall('/api/progress/checkin', {
      method: 'POST',
      body: JSON.stringify(checkinData)
    });
  }

  async updateCheckin(date, checkinData) {
    return this.apiCall(`/api/progress/checkin/${date}`, {
      method: 'PUT',
      body: JSON.stringify(checkinData)
    });
  }

  async getProgressStats() {
    return this.apiCall('/api/progress/stats');
  }

  async getChartData(timeFilter = '30') {
    return this.apiCall(`/api/progress/chart-data?days=${timeFilter}`);
  }

  // Quit Plans endpoints
  async getActivePlan() {
    return this.apiCall('/api/quit-plans/active');
  }

  async createQuitPlan(planData) {
    return this.apiCall('/api/quit-plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  }

  async updateQuitPlan(planId, planData) {
    return this.apiCall(`/api/quit-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods for easier imports
export const {
  healthCheck,
  login,
  register,
  verifyOTP,
  resendOTP,
  getUserProfile,
  getUserProgress,
  createCheckin,
  updateCheckin,
  getProgressStats,
  getChartData,
  getActivePlan,
  createQuitPlan,
  updateQuitPlan,
  forgotPassword,
  resetPassword,
  checkEmailExists
} = apiService;
