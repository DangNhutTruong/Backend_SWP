/**
 * VietQR API Integration Utilities
 * Docs: https://api.vietqr.io/
 * Website: https://vietqr.io/danh-sach-api
 */

class VietQRService {
    static BANKS = {
        VCB: { id: '970436', name: 'Vietcombank' },
        TCB: { id: '970407', name: 'Techcombank' },
        VTB: { id: '970415', name: 'Vietinbank' },
        BIDV: { id: '970418', name: 'BIDV' },
        ACB: { id: '970416', name: 'ACB' },
        MB: { id: '970422', name: 'MBBank' },
        VPB: { id: '970432', name: 'VPBank' },
        SHB: { id: '970443', name: 'SHB' },
        SACOMBANK: { id: '970403', name: 'Sacombank' },
        EXIMBANK: { id: '970431', name: 'Eximbank' }
    };

    static API_BASE_URL = 'https://api.vietqr.io/v2';

    /**
     * Generate VietQR using official API
     * @param {Object} params - QR parameters
     * @param {string} params.bankCode - Bank code (VCB, TCB, etc.)
     * @param {string} params.accountNumber - Account number
     * @param {number} params.amount - Amount in VND
     * @param {string} params.content - Transfer content
     * @param {string} params.accountName - Account holder name
     * @param {string} params.template - QR template ('compact', 'qr_only', 'compact2')
     * @returns {Promise<Object>} QR generation result
     */
    static async generateQR({
        bankCode = 'VCB',
        accountNumber,
        amount,
        content,
        accountName = 'NOUPGRADE PAYMENT',
        template = 'compact'
    }) {
        try {
            const bankInfo = VietQRService.BANKS[bankCode];
            if (!bankInfo) {
                throw new Error(`Unsupported bank code: ${bankCode}`);
            }

            const requestBody = {
                accountNo: accountNumber,
                accountName: accountName,
                acqId: bankInfo.id,
                amount: amount,
                addInfo: content,
                format: 'text',
                template: template
            };

            console.log('🔄 Generating VietQR with params:', {
                bank: `${bankCode} (${bankInfo.name})`,
                account: accountNumber,
                amount: amount,
                content: content
            });

            // Try with API key if available
            if (process.env.VIETQR_CLIENT_ID && process.env.VIETQR_API_KEY) {
                const response = await fetch(`${VietQRService.API_BASE_URL}/generate`, {
                    method: 'POST',
                    headers: {
                        'x-client-id': process.env.VIETQR_CLIENT_ID,
                        'x-api-key': process.env.VIETQR_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`VietQR API error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();

                if (result.code === '00' && result.data) {
                    console.log('✅ VietQR generated successfully with API');
                    return {
                        success: true,
                        qr_data_url: result.data.qrDataURL,
                        qr_code: result.data.qrCode,
                        bank_info: {
                            bank_name: bankInfo.name,
                            account_number: accountNumber,
                            account_name: accountName
                        }
                    };
                } else {
                    throw new Error(`VietQR API error: ${result.desc || 'Unknown error'}`);
                }
            } else {
                // Fallback to public URL generation (no API key needed)
                console.log('⚠️ No VietQR API credentials, using fallback URL generation');
                return VietQRService.generateFallbackQR({
                    bankCode,
                    accountNumber,
                    amount,
                    content,
                    accountName,
                    template
                });
            }

        } catch (error) {
            console.error('❌ Error generating VietQR:', error);

            // Always fallback to URL generation
            console.log('🔄 Falling back to URL generation...');
            return VietQRService.generateFallbackQR({
                bankCode,
                accountNumber,
                amount,
                content,
                accountName,
                template
            });
        }
    }

    /**
     * Fallback QR generation using direct URL (no API key required)
     * @param {Object} params - QR parameters
     * @returns {Object} QR generation result
     */
    static generateFallbackQR({
        bankCode = 'VCB',
        accountNumber,
        amount,
        content,
        accountName = 'NOUPGRADE PAYMENT',
        template = 'compact2'
    }) {
        try {
            const bankInfo = VietQRService.BANKS[bankCode];
            const encodedContent = encodeURIComponent(content);
            const encodedAccountName = encodeURIComponent(accountName);

            // Use img.vietqr.io for direct URL generation
            const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-${template}.jpg?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedAccountName}`;

            console.log('✅ Fallback QR URL generated:', qrUrl);

            return {
                success: true,
                qr_data_url: qrUrl,
                qr_code: null, // URL-based QR doesn't provide base64
                bank_info: {
                    bank_name: bankInfo ? bankInfo.name : 'Unknown Bank',
                    account_number: accountNumber,
                    account_name: accountName
                }
            };

        } catch (error) {
            console.error('❌ Error generating fallback QR:', error);
            return {
                success: false,
                error: error.message,
                qr_data_url: null
            };
        }
    }

    /**
     * Validate payment content format
     * @param {string} content - Payment content
     * @returns {boolean} Valid or not
     */
    static validatePaymentContent(content) {
        try {
            // Payment content should follow pattern: UPGRADE{TYPE}{USER_ID}{TIMESTAMP}{RANDOM}
            const pattern = /^UPGRADE(FREE|PREMIUM|PRO)\d+[A-Z0-9]+$/i;
            return pattern.test(content);
        } catch (error) {
            console.error('Error validating payment content:', error);
            return false;
        }
    }

    /**
     * Generate unique payment content
     * @param {number} userId - User ID
     * @param {string} packageType - Package type (free, premium, pro)
     * @returns {string} Unique payment content
     */
    static generatePaymentContent(userId, packageType) {
        try {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            const content = `UPGRADE${packageType.toUpperCase()}${userId}${timestamp}${random}`;

            console.log(`Generated payment content: ${content}`);
            return content;
        } catch (error) {
            console.error('Error generating payment content:', error);
            return `UPGRADE${packageType.toUpperCase()}${userId}${Date.now()}`;
        }
    }

    /**
     * Validate bank account format
     * @param {string} bankCode - Bank code
     * @param {string} accountNumber - Account number
     * @returns {boolean} Valid or not
     */
    static validateBankAccount(bankCode, accountNumber) {
        try {
            if (!bankCode || !accountNumber) return false;
            if (!VietQRService.BANKS[bankCode]) return false;
            if (!/^\d{8,19}$/.test(accountNumber)) return false;

            return true;
        } catch (error) {
            console.error('Error validating bank account:', error);
            return false;
        }
    }

    /**
     * Get bank info by code
     * @param {string} bankCode - Bank code
     * @returns {Object} Bank information
     */
    static getBankInfo(bankCode) {
        const bank = VietQRService.BANKS[bankCode];
        return {
            code: bankCode,
            id: bank?.id || null,
            name: bank?.name || 'Unknown Bank',
            logo: `https://img.vietqr.io/image/${bankCode}-logo.png`
        };
    }

    /**
     * Get all supported banks
     * @returns {Array} List of supported banks
     */
    static getSupportedBanks() {
        return Object.entries(VietQRService.BANKS).map(([code, info]) => ({
            code,
            id: info.id,
            name: info.name,
            logo: `https://img.vietqr.io/image/${code}-logo.png`
        }));
    }
}

export default VietQRService;
