import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to automatically add token to headers when making requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response and common errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401 (Unauthorized) errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Service object
const apiService = {
  // Auth APIs
  auth: {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    register: (userData) => axiosInstance.post('/auth/register', userData),
    getCurrentUser: () => axiosInstance.get('/auth/me'),
    refreshToken: () => axiosInstance.post('/auth/refresh-token'),
    resetPassword: (email) => axiosInstance.post('/auth/reset-password', { email }),
    changePassword: (oldPassword, newPassword) => 
      axiosInstance.post('/auth/change-password', { oldPassword, newPassword }),
  },
  
  // User APIs
  users: {
    getAll: () => axiosInstance.get('/users'),
    getById: (id) => axiosInstance.get(`/users/${id}`),
    update: (id, userData) => axiosInstance.put(`/users/${id}`, userData),
    updateAvatar: (id, formData) => axiosInstance.put(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deactivate: (id) => axiosInstance.put(`/users/${id}/deactivate`),
    getStats: (id) => axiosInstance.get(`/users/${id}/stats`),
  },
  
  // Plan APIs
  plans: {
    getAll: () => axiosInstance.get('/plans'),
    getById: (id) => axiosInstance.get(`/plans/${id}`),
    create: (planData) => axiosInstance.post('/plans', planData),
    update: (id, planData) => axiosInstance.put(`/plans/${id}`, planData),
    delete: (id) => axiosInstance.delete(`/plans/${id}`),
    getTemplates: () => axiosInstance.get('/plans/templates'),
    getActive: () => axiosInstance.get('/plans/active'),
    completeMilestone: (planId, milestoneId) => axiosInstance.put(`/plans/${planId}/milestones/${milestoneId}/complete`),
    toggleStatus: (id) => axiosInstance.put(`/plans/${id}/toggle-status`),
  },
  
  // Progress APIs
  progress: {
    getAll: () => axiosInstance.get('/progress'),
    getByUserId: (userId) => axiosInstance.get(`/progress/${userId}`),
    create: (progressData) => axiosInstance.post('/progress', progressData),
    getByDateRange: (userId, startDate, endDate) => 
      axiosInstance.get(`/progress/${userId}/range?start=${startDate}&end=${endDate}`),
    getSummary: (userId) => axiosInstance.get(`/progress/${userId}/summary`),
  },
  
  // Appointment APIs
  appointments: {
    getAll: () => axiosInstance.get('/appointments'),
    create: (appointmentData) => axiosInstance.post('/appointments', appointmentData),
    update: (id, status) => axiosInstance.put(`/appointments/${id}/status`, { status }),
    cancel: (id, reason) => axiosInstance.put(`/appointments/${id}/cancel`, { reason }),
    getAvailableSlots: (coachId, date) => 
      axiosInstance.get(`/appointments/available-slots?coachId=${coachId}&date=${date}`),
    getUpcoming: () => axiosInstance.get('/appointments/upcoming'),
    reschedule: (id, newDate) => axiosInstance.put(`/appointments/${id}/reschedule`, { newDate }),
  },
  
  // Coach APIs
  coaches: {
    getAll: () => axiosInstance.get('/coaches'),
    getById: (id) => axiosInstance.get(`/coaches/${id}`),
    getAvailability: (id) => axiosInstance.get(`/coaches/${id}/availability`),
    updateAvailability: (id, availability) => axiosInstance.put(`/coaches/${id}/availability`, availability),
    getFeedback: (id) => axiosInstance.get(`/coaches/${id}/feedback`),
  },
  
  // Community APIs
  community: {
    getPosts: () => axiosInstance.get('/community/posts'),
    createPost: (postData) => axiosInstance.post('/community/posts', postData),
    likePost: (postId) => axiosInstance.post(`/community/posts/${postId}/like`),
    commentPost: (postId, content) => axiosInstance.post(`/community/posts/${postId}/comments`, { content }),
    deletePost: (postId) => axiosInstance.delete(`/community/posts/${postId}`),
    getComments: (postId) => axiosInstance.get(`/community/posts/${postId}/comments`),
  },
  
  // Achievements APIs
  achievements: {
    getAll: () => axiosInstance.get('/achievements'),
    getUserAchievements: (userId) => axiosInstance.get(`/achievements/user/${userId}`),
    grantAchievement: (userId, achievementId, planId) => 
      axiosInstance.post(`/achievements/user/${userId}`, { achievementId, planId }),
    getLeaderboard: () => axiosInstance.get('/achievements/leaderboard'),
  },
  
  // Blog APIs
  blogs: {
    getAll: () => axiosInstance.get('/blogs'),
    getById: (id) => axiosInstance.get(`/blogs/${id}`),
    create: (blogData) => axiosInstance.post('/blogs', blogData),
    update: (id, blogData) => axiosInstance.put(`/blogs/${id}`, blogData),
    delete: (id) => axiosInstance.delete(`/blogs/${id}`),
  },
  
  // Package APIs
  packages: {
    getAll: () => axiosInstance.get('/packages'),
    getById: (id) => axiosInstance.get(`/packages/${id}`),
    subscribe: (packageId, paymentData) => 
      axiosInstance.post(`/packages/${packageId}/subscribe`, paymentData),
    cancel: (subscriptionId) => axiosInstance.delete(`/packages/subscription/${subscriptionId}`),
  },
  
  // Dashboard APIs
  dashboard: {
    getStats: () => axiosInstance.get('/dashboard/stats'),
    getOverview: () => axiosInstance.get('/dashboard/overview'),
    getRecentActivity: () => axiosInstance.get('/dashboard/activity'),
  },
  
  // Payment APIs
  payments: {
    create: (paymentData) => axiosInstance.post('/payments/create', paymentData),
    verify: (verificationData) => axiosInstance.post('/payments/verify', verificationData),
    getUserHistory: () => axiosInstance.get('/payments/user/history'),
    getById: (id) => axiosInstance.get(`/payments/${id}`),
    requestRefund: (id, reason) => axiosInstance.post(`/payments/${id}/refund`, { reason }),
  },

  // Notification APIs
  notifications: {
    getAll: () => axiosInstance.get('/notifications'),
    create: (notificationData) => axiosInstance.post('/notifications', notificationData),
    markAsRead: (notificationId) => axiosInstance.put(`/notifications/${notificationId}/read`),
    markAllAsRead: () => axiosInstance.put('/notifications/mark-all-read'),
    delete: (notificationId) => axiosInstance.delete(`/notifications/${notificationId}`),
    getSettings: () => axiosInstance.get('/notifications/settings'),
    updateSettings: (settings) => axiosInstance.put('/notifications/settings', settings),
  },

  // Smoking Status APIs
  smokingStatus: {
    getUser: (params) => axiosInstance.get('/smoking-status/user', { params }),
    record: (statusData) => axiosInstance.post('/smoking-status/record', statusData),
    updateRecord: (date, statusData) => axiosInstance.put(`/smoking-status/record/${date}`, statusData),
    deleteRecord: (date) => axiosInstance.delete(`/smoking-status/record/${date}`),
    getAnalytics: (period) => axiosInstance.get(`/smoking-status/analytics?period=${period || 30}`),
  },

  // Settings APIs
  settings: {
    getUser: () => axiosInstance.get('/settings/user'),
    updateUser: (settings) => axiosInstance.put('/settings/user', settings),
    changePassword: (passwordData) => axiosInstance.put('/settings/password', passwordData),
    updatePrivacy: (privacyData) => axiosInstance.put('/settings/privacy', privacyData),
    updateNotifications: (notificationData) => axiosInstance.put('/settings/notifications', notificationData),
    getApp: () => axiosInstance.get('/settings/app'),
  },
};

export default apiService;
