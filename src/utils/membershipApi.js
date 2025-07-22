/**
 * Membership API service
 */
import api from './api';

/**
 * Get user membership status
 * @returns {Promise<Object>} API response with membership data
 */
export const getMembershipStatus = async () => {
  try {
    const options = api.addAuthHeader({
      method: 'GET'
    });
    
    const response = await api.fetch('/api/users/membership', options);
    
    // Update membership in localStorage if successful
    if (response.success && response.data) {
      const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
      currentUser.membership = response.data.membership;
      currentUser.membershipType = response.data.membership;
      localStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
    }
    
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to get membership status' 
    };
  }
};

/**
 * Upgrade user membership
 * @param {string} membershipType - Type of membership to upgrade to
 * @returns {Promise<Object>} API response with updated membership data
 */
export const upgradeMembership = async (membershipType) => {
  try {
    const options = api.addAuthHeader({
      method: 'PUT',
      body: JSON.stringify({ membershipType })
    });
    
    const response = await api.fetch('/api/users/membership', options);
    
    // Update membership in localStorage if successful
    if (response.success && response.data) {
      const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
      currentUser.membership = membershipType;
      currentUser.membershipType = membershipType;
      localStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
    }
    
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to upgrade membership' 
    };
  }
};

/**
 * Cancel user membership and downgrade to free
 * @returns {Promise<Object>} API response
 */
export const cancelMembership = async () => {
  try {
    const options = api.addAuthHeader({
      method: 'DELETE'
    });
    
    const response = await api.fetch('/api/users/membership', options);
    
    // Update membership in localStorage if successful
    if (response.success) {
      const currentUser = JSON.parse(localStorage.getItem('nosmoke_user') || '{}');
      currentUser.membership = 'free';
      currentUser.membershipType = 'free';
      localStorage.setItem('nosmoke_user', JSON.stringify(currentUser));
    }
    
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to cancel membership' 
    };
  }
};

/**
 * Process payment for membership upgrade
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} API response with payment result
 */
export const processPayment = async (paymentData) => {
  try {
    const options = api.addAuthHeader({
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    const response = await api.fetch('/api/payments/process', options);
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Payment processing failed' 
    };
  }
};

/**
 * Get user payment history
 * @returns {Promise<Object>} API response with payment history
 */
export const getPaymentHistory = async () => {
  try {
    const options = api.addAuthHeader({
      method: 'GET'
    });
    
    const response = await api.fetch('/api/payments/history', options);
    return response;
  } catch (error) {
    return { 
      success: false, 
      message: error.message || 'Failed to get payment history' 
    };
  }
};

export default {
  getMembershipStatus,
  upgradeMembership,
  cancelMembership,
  processPayment,
  getPaymentHistory
};
