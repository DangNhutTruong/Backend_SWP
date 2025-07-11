import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const { QueryTypes } = Sequelize;

class MembershipController {
  // Lấy danh sách các gói membership
  async getPlans(req, res) {
    try {
      const plans = await sequelize.query(
        `SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price ASC`,
        { type: QueryTypes.SELECT }
      );

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách gói thành viên'
      });
    }
  }

  // Lấy thông tin subscription hiện tại của user
  async getUserSubscription(req, res) {
    try {
      const userId = req.user.id;

      const [subscription] = await sequelize.query(
        `SELECT us.*, mp.name as plan_name, mp.display_name, mp.price, mp.features, mp.duration_days
         FROM user_subscriptions us
         JOIN membership_plans mp ON us.membership_plan_id = mp.id
         WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
         ORDER BY us.created_at DESC LIMIT 1`,
        { 
          replacements: [userId],
          type: QueryTypes.SELECT 
        }
      );

      if (!subscription) {
        return res.json({
          success: true,
          data: {
            plan: 'free',
            plan_name: 'free',
            display_name: 'Miễn phí',
            status: 'active',
            end_date: null,
            features: {
              basic_tracking: true,
              basic_plan: true,
              community_access: false,
              coach_support: false,
              premium_content: false
            }
          }
        });
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tải thông tin gói thành viên'
      });
    }
  }

  // Tạo subscription mới (sau khi thanh toán thành công)
  async createSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { plan_id, payment_method, transaction_id } = req.body;

      // Lấy thông tin plan
      const [plan] = await sequelize.query(
        `SELECT * FROM membership_plans WHERE id = ? AND is_active = 1`,
        { 
          replacements: [plan_id],
          type: QueryTypes.SELECT 
        }
      );

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Gói thành viên không tồn tại'
        });
      }

      // Tính ngày bắt đầu và kết thúc
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);
      const endDateStr = endDate.toISOString().split('T')[0];

      // Hủy subscription cũ nếu có
      await sequelize.query(
        `UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`,
        { 
          replacements: [userId],
          type: QueryTypes.UPDATE 
        }
      );

      // Tạo subscription mới
      const [subscriptionResult] = await sequelize.query(
        `INSERT INTO user_subscriptions (user_id, membership_plan_id, start_date, end_date, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        { 
          replacements: [userId, plan_id, startDate, endDateStr],
          type: QueryTypes.INSERT 
        }
      );

      const subscriptionId = subscriptionResult;

      // Tạo transaction record
      await sequelize.query(
        `INSERT INTO payment_transactions (user_id, subscription_id, amount, currency, payment_method, transaction_id, status, payment_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW(), NOW(), NOW())`,
        { 
          replacements: [userId, subscriptionId, plan.price, plan.currency || 'VND', payment_method, transaction_id],
          type: QueryTypes.INSERT 
        }
      );

      // Cập nhật membership_type trong bảng users
      await sequelize.query(
        `UPDATE users SET membership_type = ?, updated_at = NOW() WHERE id = ?`,
        { 
          replacements: [plan.name, userId],
          type: QueryTypes.UPDATE 
        }
      );

      res.json({
        success: true,
        message: 'Đăng ký gói thành viên thành công',
        data: {
          subscription_id: subscriptionId,
          plan: plan.name,
          end_date: endDateStr
        }
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tạo gói thành viên'
      });
    }
  }

  // Kiểm tra quyền truy cập feature
  async checkFeatureAccess(req, res) {
    try {
      const userId = req.user.id;
      const { feature } = req.params;

      // Lấy thông tin subscription hiện tại
      const [subscription] = await sequelize.query(
        `SELECT us.*, mp.name as plan_name, mp.features
         FROM user_subscriptions us
         JOIN membership_plans mp ON us.membership_plan_id = mp.id
         WHERE us.user_id = ? AND us.status = 'active' AND us.end_date >= CURDATE()
         ORDER BY us.created_at DESC LIMIT 1`,
        { 
          replacements: [userId],
          type: QueryTypes.SELECT 
        }
      );

      let hasAccess = false;
      let planType = 'free';

      if (subscription) {
        planType = subscription.plan_name;
        const features = subscription.features || {};
        hasAccess = features[feature] === true;
      } else {
        // Free plan features
        const freeFeatures = ['basic_tracking', 'basic_plan'];
        hasAccess = freeFeatures.includes(feature);
      }

      res.json({
        success: true,
        data: {
          hasAccess,
          planType,
          feature
        }
      });
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể kiểm tra quyền truy cập'
      });
    }
  }

  // Hủy subscription
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.id;

      const [subscription] = await sequelize.query(
        `SELECT * FROM user_subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`,
        { 
          replacements: [userId],
          type: QueryTypes.SELECT 
        }
      );

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói thành viên đang hoạt động'
        });
      }

      // Cập nhật status
      await sequelize.query(
        `UPDATE user_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
        { 
          replacements: [subscription.id],
          type: QueryTypes.UPDATE 
        }
      );

      // Cập nhật membership_type về free
      await sequelize.query(
        `UPDATE users SET membership_type = 'free', updated_at = NOW() WHERE id = ?`,
        { 
          replacements: [userId],
          type: QueryTypes.UPDATE 
        }
      );

      res.json({
        success: true,
        message: 'Đã hủy gói thành viên thành công'
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể hủy gói thành viên'
      });
    }
  }

  // Lịch sử thanh toán
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;

      const transactions = await sequelize.query(
        `SELECT pt.*, us.start_date, us.end_date, mp.display_name as plan_name
         FROM payment_transactions pt
         LEFT JOIN user_subscriptions us ON pt.subscription_id = us.id
         LEFT JOIN membership_plans mp ON us.membership_plan_id = mp.id
         WHERE pt.user_id = ?
         ORDER BY pt.created_at DESC`,
        { 
          replacements: [userId],
          type: QueryTypes.SELECT 
        }
      );

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Không thể tải lịch sử thanh toán'
      });
    }
  }
}

export default new MembershipController();
