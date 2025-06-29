import Payment from '../models/Payment.js';
import Package from '../models/Package.js';
import User from '../models/User.js';

// Create payment
export const createPayment = async (req, res) => {
  try {
    const { packageId, paymentMethod, amount } = req.body;
    const userId = req.user.UserID;

    // Validate required fields
    if (!packageId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: packageId, paymentMethod, amount'
      });
    }

    // Check if package exists
    const packageData = await Package.findByPk(packageId);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy gói dịch vụ'
      });
    }

    // Create payment record
    const payment = await Payment.create({
      UserID: userId,
      PackageID: packageId,
      Amount: amount,
      PaymentMethod: paymentMethod,
      Status: 'pending',
      TransactionID: `TXN_${Date.now()}_${userId}`,
      PaymentDate: new Date()
    });

    // TODO: Integrate with real payment gateway
    // For now, simulate payment processing
    setTimeout(async () => {
      try {
        await payment.update({ Status: 'completed' });
        console.log(`Payment ${payment.PaymentID} completed successfully`);
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
    }, 5000);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Tạo thanh toán thành công'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo thanh toán'
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { transactionId, signature } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu transaction ID'
      });
    }

    const payment = await Payment.findOne({
      where: { TransactionID: transactionId },
      include: [Package]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // TODO: Verify signature with payment gateway
    // For now, mark as verified if signature exists
    if (signature) {
      await payment.update({ 
        Status: 'completed',
        CompletedAt: new Date()
      });

      res.json({
        success: true,
        data: payment,
        message: 'Xác thực thanh toán thành công'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác thực thanh toán'
    });
  }
};

// Get user payment history
export const getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: { UserID: userId },
      include: [Package],
      order: [['PaymentDate', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: payments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch sử thanh toán'
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const payment = await Payment.findOne({
      where: { 
        PaymentID: id,
        UserID: userId 
      },
      include: [Package]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error getting payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin giao dịch'
    });
  }
};

// Request refund
export const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.UserID;

    const payment = await Payment.findOne({
      where: { 
        PaymentID: id,
        UserID: userId 
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    if (payment.Status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hoàn tiền cho giao dịch đã hoàn thành'
      });
    }

    if (payment.Status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Giao dịch này đã được hoàn tiền'
      });
    }

    // Update payment status to refund requested
    await payment.update({
      Status: 'refund_requested',
      RefundReason: reason || 'Yêu cầu hoàn tiền',
      RefundRequestedAt: new Date()
    });

    res.json({
      success: true,
      data: payment,
      message: 'Yêu cầu hoàn tiền đã được gửi'
    });

  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi yêu cầu hoàn tiền'
    });
  }
};
