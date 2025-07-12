import Package from '../models/Package.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import VietQRService from '../utils/vietqr.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PackageController {
    // GET /api/packages → trả danh sách gói
    static async getAll(req, res) {
        try {
            const packages = await Package.findAll();

            res.json({
                success: true,
                data: packages,
                message: 'Packages retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching packages:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/packages/:id → chi tiết 1 gói
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const packageData = await Package.findById(id);

            if (!packageData) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }

            res.json({
                success: true,
                data: packageData,
                message: 'Package retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching package:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // POST /api/packages/purchase
    static async purchase(req, res) {
        try {
            const { package_id } = req.body;
            const user_id = req.user.id; // Từ middleware auth

            // Kiểm tra package có tồn tại không
            const packageInfo = await Package.findById(package_id);
            if (!packageInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }

            // Kiểm tra user có tồn tại không
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Kiểm tra user đã có membership cao hơn chưa
            const currentMembership = user.membership || 'free';
            const membershipLevels = { 'free': 0, 'premium': 1, 'pro': 2 };

            if (membershipLevels[currentMembership] >= membershipLevels[packageInfo.type]) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have this membership level or higher'
                });
            }

            // Sinh tx_content unique sử dụng VietQR service
            const tx_content = VietQRService.generatePaymentContent(user_id, packageInfo.type);

            // Tạo payment record với status pending
            const paymentData = {
                user_id,
                package_id,
                amount: packageInfo.price,
                method: 'bank_transfer',
                tx_content,
                expected_content: tx_content,
                bank_code: process.env.BANK_CODE || 'VCB'
            };

            const paymentId = await Payment.create(paymentData);

            // Generate VietQR code
            const qrResult = await VietQRService.generateQR({
                bankCode: process.env.BANK_CODE || 'VCB',
                accountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
                amount: packageInfo.price,
                content: tx_content,
                accountName: process.env.BANK_ACCOUNT_NAME || 'NOUPGRADE PAYMENT',
                template: 'compact2'
            });

            if (!qrResult.success) {
                // Nếu QR generation failed, vẫn tiếp tục với thông tin manual
                console.error('QR generation failed, proceeding with manual transfer info');
            }

            // Update payment với QR code URL
            if (qrResult.qr_data_url) {
                await Payment.update(paymentId, { qr_code_url: qrResult.qr_data_url });
            }

            // 🔔 Send notification about new payment
            try {
                const scriptPath = path.join(__dirname, '../../scripts/payment_notifier.py');
                const notificationData = JSON.stringify({
                    payment_id: paymentId,
                    amount: packageInfo.price,
                    package_name: packageInfo.name,
                    user_email: user.email,
                    qr_content: tx_content
                });
                
                // Run notification script in background
                execSync(`python "${scriptPath}" --add-payment '${notificationData}'`, { 
                    cwd: path.dirname(scriptPath),
                    stdio: 'pipe' 
                });
                
                console.log(`📧 Payment notification sent for payment ${paymentId}`);
            } catch (notificationError) {
                console.error('❌ Failed to send payment notification:', notificationError.message);
                // Don't fail the entire request if notification fails
            }

            res.json({
                success: true,
                data: {
                    payment_id: paymentId,
                    package: packageInfo,
                    amount: packageInfo.price,
                    tx_content,
                    qr_code_url: qrResult.qr_data_url,
                    qr_available: qrResult.success,
                    bank_info: {
                        bank_name: 'MB Bank',
                        account_number: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
                        account_name: process.env.BANK_ACCOUNT_NAME || 'NOUPGRADE PAYMENT',
                        content: tx_content
                    },
                    instructions: {
                        step1: 'Mở ứng dụng ngân hàng hoặc quét mã QR',
                        step2: `Chuyển khoản chính xác số tiền: ${packageInfo.price.toLocaleString()}đ`,
                        step3: `Nội dung chuyển khoản: ${tx_content}`,
                        step4: 'Đợi hệ thống xác nhận (1-5 phút)',
                        note: 'Nội dung chuyển khoản phải chính xác 100% để hệ thống tự động xác nhận'
                    }
                },
                message: 'Payment created successfully. Please transfer money and wait for verification.'
            });

        } catch (error) {
            console.error('Error creating purchase:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/packages/user/current
    static async getUserCurrent(req, res) {
        try {
            const user_id = req.user.id;
            const userMembership = await User.getUserMembership(user_id);

            if (!userMembership) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Lấy thông tin package hiện tại
            let currentPackage = null;
            if (userMembership.membership && userMembership.membership !== 'free') {
                currentPackage = await Package.findByType(userMembership.membership);
            }

            // Kiểm tra membership có hết hạn không
            const expiryInfo = await User.checkMembershipExpiry(user_id);

            res.json({
                success: true,
                data: {
                    current_membership: userMembership.membership || 'free',
                    start_date: userMembership.membership_start_date,
                    end_date: userMembership.membership_end_date,
                    is_expired: expiryInfo.is_expired,
                    package_info: currentPackage
                },
                message: 'Current membership retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching user current membership:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/packages/user/history
    static async getUserHistory(req, res) {
        try {
            const user_id = req.user.id;
            const payments = await Payment.findByUser(user_id);

            res.json({
                success: true,
                data: payments,
                message: 'User package history retrieved successfully'
            });

        } catch (error) {
            console.error('Error fetching user package history:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

export default PackageController;
