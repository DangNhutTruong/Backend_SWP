// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,

    // Package endpoints
    PACKAGES: `${API_BASE_URL}/api/packages`,
    PACKAGE_PURCHASE: `${API_BASE_URL}/api/packages/purchase`,
    PACKAGE_CURRENT: `${API_BASE_URL}/api/packages/current`,

    // Payment endpoints
    PAYMENT_STATUS: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/status`,
    PAYMENT_VERIFY: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/verify`,
    PAYMENT_HISTORY: `${API_BASE_URL}/api/payments/history`,
    PAYMENT_REFUND: (paymentId) => `${API_BASE_URL}/api/payments/${paymentId}/refund`,

    // User endpoints
    USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
    USER_UPDATE: `${API_BASE_URL}/api/user/update`,
};

// Helper function to make authenticated requests
export const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken');

    console.log('API Request:', { url, token: token ? 'Present' : 'Missing' });

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...options,
    };

    if (options.body && typeof options.body === 'object') {
        defaultOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            const errorData = await response.text();
            let errorMessage;

            try {
                const jsonError = JSON.parse(errorData);
                errorMessage = jsonError.message || `HTTP Error: ${response.status}`;
            } catch {
                errorMessage = errorData || `HTTP Error: ${response.status}`;
            }

            throw new Error(errorMessage);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

export default API_ENDPOINTS;
