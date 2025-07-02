import { Payment, User, Package } from '../models/index.js';
import { Op } from 'sequelize';

// POST /api/payments/create
export const createPayment = async (req, res) => {
  try {
    const { package_id, payment_method, amount } = req.body;
    const user_id = req.user.id;

    // Validate package exists
    const packageInfo = await Package.findByPk(package_id);
    if (!packageInfo) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user_id,
      package_id,
      amount: amount || packageInfo.price,
      payment_method,
      transaction_id: `TXN_${Date.now()}_${user_id}`,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  try {
    const { transaction_id, status } = req.body;

    const payment = await Payment.findOne({
      where: { transaction_id },
      include: [
        { model: User, as: 'user' },
        { model: Package, as: 'package' }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment status
    payment.status = status;
    if (status === 'completed') {
      payment.completed_at = new Date();
    }
    await payment.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: payment
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/payments/user/history
export const getUserPaymentHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { user_id };
    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Package, as: 'package' }
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: payments.rows,
      pagination: {
        total: payments.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(payments.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// GET /api/payments/:id
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const payment = await Payment.findOne({
      where: { id, user_id },
      include: [
        { model: User, as: 'user' },
        { model: Package, as: 'package' }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// POST /api/payments/:id/refund
export const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user_id = req.user.id;

    const payment = await Payment.findOne({
      where: { id, user_id, status: 'completed' }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or cannot be refunded'
      });
    }

    // Update payment status to refunded
    payment.status = 'refunded';
    await payment.save();

    res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
