class MembershipService {
  
  // Lấy danh sách gói membership
  async getPlans() {
    try {
      const response = await fetch('/api/membership/plans');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      return { success: false, message: 'Lỗi khi tải danh sách gói thành viên' };
    }
  }

  // Lấy thông tin subscription hiện tại
  async getUserSubscription() {
    try {
      const response = await fetch('/api/membership/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return { success: false, message: 'Lỗi khi tải thông tin gói thành viên' };
    }
  }

  // Tạo subscription mới (sau khi thanh toán thành công)
  async createSubscription(subscriptionData) {
    try {
      const response = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscriptionData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, message: 'Lỗi khi tạo gói thành viên' };
    }
  }

  // Kiểm tra quyền truy cập feature
  async checkFeatureAccess(featureName) {
    try {
      const response = await fetch(`/api/membership/feature/${featureName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { success: false, message: 'Lỗi khi kiểm tra quyền truy cập' };
    }
  }

  // Hủy subscription
  async cancelSubscription() {
    try {
      const response = await fetch('/api/membership/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, message: 'Lỗi khi hủy gói thành viên' };
    }
  }

  // Lấy lịch sử thanh toán
  async getPaymentHistory() {
    try {
      const response = await fetch('/api/membership/payment-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return { success: false, message: 'Lỗi khi tải lịch sử thanh toán' };
    }
  }

  // Chuyển đổi package info thành format cho API
  static packageToApiFormat(packageInfo, paymentMethod) {
    const planMap = {
      'free': 1,
      'premium': 2,
      'pro': 3
    };

    return {
      plan_id: planMap[packageInfo.name.toLowerCase()],
      payment_method: paymentMethod,
      transaction_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: packageInfo.price,
      currency: 'VND'
    };
  }

}

export default new MembershipService();
