import VietQRService from '../utils/vietqr.js';

class VietQRController {
    /**
     * Test VietQR generation
     * @route POST /api/vietqr/generate
     */
    static async generateTestQR(req, res) {
        try {
            const {
                bankCode = 'VCB',
                accountNumber = process.env.BANK_ACCOUNT_NUMBER || '1234567890',
                amount = 100000,
                content = 'TEST PAYMENT',
                template = 'compact2'
            } = req.body;

            // Validate inputs
            if (!VietQRService.validateBankAccount(bankCode, accountNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid bank account information'
                });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
            }

            // Generate QR
            const qrResult = await VietQRService.generateQR({
                bankCode,
                accountNumber,
                amount,
                content,
                template
            });

            if (qrResult.success) {
                res.json({
                    success: true,
                    data: {
                        qr_data_url: qrResult.qr_data_url,
                        qr_code: qrResult.qr_code,
                        bank_info: qrResult.bank_info,
                        parameters: {
                            bankCode,
                            accountNumber,
                            amount,
                            content,
                            template
                        }
                    },
                    message: 'QR code generated successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to generate QR code',
                    error: qrResult.error
                });
            }

        } catch (error) {
            console.error('Error in generateTestQR:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get supported banks
     * @route GET /api/vietqr/banks
     */
    static async getSupportedBanks(req, res) {
        try {
            const banks = VietQRService.getSupportedBanks();

            res.json({
                success: true,
                data: {
                    banks,
                    total: banks.length
                },
                message: 'Supported banks retrieved successfully'
            });

        } catch (error) {
            console.error('Error getting supported banks:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Validate payment content
     * @route POST /api/vietqr/validate-content
     */
    static async validateContent(req, res) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required'
                });
            }

            const isValid = VietQRService.validatePaymentContent(content);

            res.json({
                success: true,
                data: {
                    content,
                    is_valid: isValid,
                    expected_format: 'UPGRADE{TYPE}{USER_ID}{TIMESTAMP}{RANDOM}'
                },
                message: isValid ? 'Content is valid' : 'Content format is invalid'
            });

        } catch (error) {
            console.error('Error validating content:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

export default VietQRController;
