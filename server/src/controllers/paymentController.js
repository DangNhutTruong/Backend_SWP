import Payment from '../models/Payment.js';
import Package from '../models/Package.js';
import User from '../models/User.js';

class PaymentController {
    // POST /api/payments/create (nếu tạo riêng, không qua package/purchase)
    static async create(req, res) {
        try {
            const { package_id, method = 'bank_transfer' } = req.body;
            const user_id = req.user.id;

            // Validate package
            const packageInfo = await Package.findById(package_id);
            if (!packageInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }

            // Generate transaction content
            const tx_content = await Payment.generateTxContent(user_id, package_id);

            const paymentData = {
                user_id,
                package_id,
                amount: packageInfo.price,
                method,
                tx_content,
                expected_content: tx_content
            };

            const paymentId = await Payment.create(paymentData);

            res.json({
                success: true,
                data: {
                    payment_id: paymentId,
                    tx_content,
                    amount: packageInfo.price
                },
                message: 'Payment created successfully'
            });

        } catch (error) {
            console.error('Error creating payment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // POST /api/payments/verify (check khi frontend ping lại)
    static async verify(req, res) {
        try {
            const { payment_id, tx_content } = req.body;
            const user_id = req.user.id;

            let payment;

            // Tìm payment bằng ID hoặc tx_content
            if (payment_id) {
                payment = await Payment.findById(payment_id);
            } else if (tx_content) {
                payment = await Payment.findByTxContent(tx_content);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Payment ID or transaction content required'
                });
            }

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            // Kiểm tra payment thuộc về user hiện tại
            if (payment.user_id !== user_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Nếu đã completed, return thông tin
            if (payment.status === 'completed') {
                return res.json({
                    success: true,
                    data: {
                        payment_id: payment.id,
                        status: payment.status,
                        verified_at: payment.verified_at
                    },
                    message: 'Payment already verified'
                });
            }

            // TODO: Implement MBBank API verification
            // Tạm thời simulate verification logic
            const isVerified = await PaymentController.checkMBBankTransaction(payment);

            if (isVerified) {
                // Update payment status
                await Payment.updateStatus(payment.id, 'completed', new Date());

                // Update user membership
                const packageInfo = await Package.findById(payment.package_id);
                if (packageInfo) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + packageInfo.duration_days);

                    await User.updateMembership(
                        payment.user_id,
                        packageInfo.type,
                        startDate,
                        endDate
                    );
                }

                res.json({
                    success: true,
                    data: {
                        payment_id: payment.id,
                        status: 'completed',
                        verified_at: new Date()
                    },
                    message: 'Payment verified and membership updated successfully'
                });
            } else {
                res.json({
                    success: false,
                    data: {
                        payment_id: payment.id,
                        status: payment.status
                    },
                    message: 'Payment not found in bank records yet. Please try again later.'
                });
            }

        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // POST /api/payments/verify/external → xác minh payment từ MBBank script (không cần auth)
    static async verifyExternal(req, res) {
        try {
            const {
                tx_content,
                amount,
                transaction_id,
                transaction_date,
                bank_account,
                payment_id  // Optional: specific payment ID to verify
            } = req.body;

            let payment;

            if (payment_id) {
                // Verify specific payment by ID
                payment = await Payment.findById(payment_id);
                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message: 'Payment not found'
                    });
                }
            } else if (tx_content) {
                // Find payment by transaction content
                payment = await Payment.findByTxContent(tx_content);
                if (!payment) {
                    return res.status(404).json({
                        success: false,
                        message: 'Payment not found for transaction content'
                    });
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Either payment_id or tx_content is required'
                });
            }

            // Check if payment is already completed
            if (payment.status === 'completed') {
                return res.json({
                    success: true,
                    data: {
                        payment_id: payment.id,
                        status: payment.status,
                        verified_at: payment.verified_at,
                        already_verified: true
                    },
                    message: 'Payment already verified'
                });
            }

            // Validate transaction details
            const expectedAmount = parseFloat(payment.amount);
            const receivedAmount = parseFloat(amount);

            if (Math.abs(expectedAmount - receivedAmount) > 0.01) { // Allow 1 cent tolerance
                return res.status(400).json({
                    success: false,
                    message: `Amount mismatch. Expected: ${expectedAmount}, Received: ${receivedAmount}`
                });
            }

            // Validate transaction content
            if (payment.expected_content && payment.expected_content !== tx_content) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction content does not match expected content'
                });
            }

            // Update payment status to completed
            await Payment.updateStatus(payment.id, 'completed', new Date(), transaction_id);

            // Get package info for membership update
            const packageInfo = await Package.findById(payment.package_id);
            if (!packageInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }

            // Update user membership
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + packageInfo.duration_days);

            await User.updateMembership(
                payment.user_id,
                packageInfo.type,
                startDate,
                endDate
            );

            // TODO: Send notification email/telegram
            // await NotificationService.sendPaymentConfirmation(payment.user_id, payment, packageInfo);

            res.json({
                success: true,
                data: {
                    payment_id: payment.id,
                    status: 'completed',
                    verified_at: new Date(),
                    transaction_id: transaction_id,
                    membership: {
                        type: packageInfo.type,
                        start_date: startDate,
                        end_date: endDate
                    }
                },
                message: 'Payment verified and membership updated successfully'
            });

        } catch (error) {
            console.error('Error verifying payment externally:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/payments/user/history
    static async getUserHistory(req, res) {
        try {
            const user_id = req.user.id;
            const { status, limit = 20, offset = 0 } = req.query;

            let payments;
            if (status) {
                payments = await Payment.findByUser(user_id, status);
            } else {
                payments = await Payment.findByUser(user_id);
            }

            // Apply pagination
            const paginatedPayments = payments.slice(offset, offset + parseInt(limit));

            res.json({
                success: true,
                data: {
                    payments: paginatedPayments,
                    total: payments.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                message: 'Payment history retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching payment history:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/payments/:id
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const payment = await Payment.findById(id);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            // Kiểm tra quyền truy cập (chỉ user sở hữu payment hoặc admin)
            if (payment.user_id !== user_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.json({
                success: true,
                data: payment,
                message: 'Payment retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching payment:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // POST /api/payments/:id/refund
    static async refund(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user_id = req.user.id;

            const payment = await Payment.findById(id);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            // Kiểm tra quyền (chỉ user sở hữu hoặc admin có thể refund)
            if (payment.user_id !== user_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Kiểm tra payment đã completed chưa
            if (payment.status !== 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only refund completed payments'
                });
            }

            // TODO: Implement refund logic
            // Tạm thời chỉ update status
            await Payment.update(id, {
                status: 'cancelled',
                refund_reason: reason,
                refunded_at: new Date()
            });

            // Revert user membership nếu cần
            await User.updateMembership(payment.user_id, 'free', null, null);

            res.json({
                success: true,
                data: {
                    payment_id: id,
                    status: 'cancelled',
                    refunded_at: new Date()
                },
                message: 'Payment refunded successfully'
            });

        } catch (error) {
            console.error('Error processing refund:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/payments/pending (Admin only)
    static async getPendingPayments(req, res) {
        try {
            // Kiểm tra quyền admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }

            const pendingPayments = await Payment.findPendingPayments();

            res.json({
                success: true,
                data: pendingPayments,
                message: 'Pending payments retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching pending payments:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/payments/:id/status → lấy trạng thái payment (dành cho polling)
    static async getStatus(req, res) {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const payment = await Payment.findById(id);

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            // Kiểm tra quyền truy cập (chỉ user sở hữu payment hoặc admin)
            if (payment.user_id !== user_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Chỉ trả về thông tin cần thiết cho status polling
            res.json({
                success: true,
                data: {
                    payment: {
                        id: payment.id,
                        status: payment.status,
                        amount: payment.amount,
                        created_at: payment.created_at,
                        verified_at: payment.verified_at,
                        transaction_id: payment.transaction_id
                    },
                    can_refund: payment.status === 'completed' &&
                        new Date() - new Date(payment.created_at) < 24 * 60 * 60 * 1000 // 24h
                },
                message: 'Payment status retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching payment status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Helper method để check MBBank transaction (sẽ implement Python script)
    static async checkMBBankTransaction(payment) {
        try {
            // TODO: Implement MBBank API checking với Python script
            // Tạm thời return random để test
            return Math.random() > 0.7; // 30% chance verified
        } catch (error) {
            console.error('Error checking MBBank transaction:', error);
            return false;
        }
    }
}

export default PaymentController;
