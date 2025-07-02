// API Service để kết nối với NoSmoke Backend
const API_BASE_URL = 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method để tạo headers
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Helper method để xử lý response
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // ==================== AUTH APIs ====================
  
  async register(userData) {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async login(credentials) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    const data = await this.handleResponse(response);
    
    // Lưu token vào localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // ==================== USER APIs ====================
  
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/api/users/profile`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async updateUserProfile(userData) {
    const response = await fetch(`${this.baseURL}/api/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  // ==================== PACKAGE APIs ====================
  
  async getPackages() {
    const response = await fetch(`${this.baseURL}/api/packages`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPackageById(id) {
    const response = await fetch(`${this.baseURL}/api/packages/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ==================== ACHIEVEMENT APIs ====================
  
  async getAchievements() {
    const response = await fetch(`${this.baseURL}/api/achievements`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserAchievements() {
    const response = await fetch(`${this.baseURL}/api/achievements/user`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async unlockAchievement(achievementId) {
    const response = await fetch(`${this.baseURL}/api/achievements/unlock`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ achievement_id: achievementId }),
    });
    return this.handleResponse(response);
  }

  // ==================== QUIT PLAN APIs ====================
  
  async getQuitPlans() {
    const response = await fetch(`${this.baseURL}/api/quit-plans`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async createQuitPlan(planData) {
    const response = await fetch(`${this.baseURL}/api/quit-plans`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(planData),
    });
    return this.handleResponse(response);
  }

  async updateQuitPlan(id, planData) {
    const response = await fetch(`${this.baseURL}/api/quit-plans/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(planData),
    });
    return this.handleResponse(response);
  }

  async deleteQuitPlan(id) {
    const response = await fetch(`${this.baseURL}/api/quit-plans/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ==================== PROGRESS APIs ====================
  
  async getUserProgress() {
    const response = await fetch(`${this.baseURL}/api/progress`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async logProgress(progressData) {
    const response = await fetch(`${this.baseURL}/api/progress`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(progressData),
    });
    return this.handleResponse(response);
  }

  async updateProgress(id, progressData) {
    const response = await fetch(`${this.baseURL}/api/progress/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(progressData),
    });
    return this.handleResponse(response);
  }

  // ==================== COACH APIs ====================
  
  async getCoaches() {
    const response = await fetch(`${this.baseURL}/api/coaches`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getCoachById(id) {
    const response = await fetch(`${this.baseURL}/api/coaches/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ==================== APPOINTMENT APIs ====================
  
  async getUserAppointments() {
    const response = await fetch(`${this.baseURL}/api/appointments`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async createAppointment(appointmentData) {
    const response = await fetch(`${this.baseURL}/api/appointments`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(appointmentData),
    });
    return this.handleResponse(response);
  }

  async updateAppointment(id, appointmentData) {
    const response = await fetch(`${this.baseURL}/api/appointments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(appointmentData),
    });
    return this.handleResponse(response);
  }

  async cancelAppointment(id) {
    const response = await fetch(`${this.baseURL}/api/appointments/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ==================== PAYMENT APIs ====================
  
  async getPaymentHistory() {
    const response = await fetch(`${this.baseURL}/api/payments`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async createPayment(paymentData) {
    const response = await fetch(`${this.baseURL}/api/payments`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(paymentData),
    });
    return this.handleResponse(response);
  }

  async getPaymentById(id) {
    const response = await fetch(`${this.baseURL}/api/payments/${id}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ==================== NOTIFICATION APIs ====================
  
  async getNotifications() {
    const response = await fetch(`${this.baseURL}/api/notifications`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async markNotificationAsRead(id) {
    const response = await fetch(`${this.baseURL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async getUnreadNotificationsCount() {
    const response = await fetch(`${this.baseURL}/api/notifications/unread-count`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ==================== SETTINGS APIs ====================
  
  async getUserSettings() {
    const response = await fetch(`${this.baseURL}/api/settings`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async updateUserSettings(settingsData) {
    const response = await fetch(`${this.baseURL}/api/settings`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(settingsData),
    });
    return this.handleResponse(response);
  }

  async resetUserSettings() {
    const response = await fetch(`${this.baseURL}/api/settings/reset`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  // ==================== HEALTH CHECK ====================
  
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return this.handleResponse(response);
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;
