/**
 * VietQR Integration Test
 * Chạy file này để test VietQR generation
 */

import VietQRService from '../src/utils/vietqr.js';

const testVietQR = async () => {
    console.log('🔄 Testing VietQR Integration...\n');

    // Test 1: Basic QR generation
    console.log('📋 Test 1: Basic QR Generation');
    try {
        const result1 = await VietQRService.generateQR({
            bankCode: 'VCB',
            accountNumber: '1234567890',
            amount: 99000,
            content: 'UPGRADEPREMIUM123456789ABC',
            template: 'compact2'
        });

        console.log('✅ QR Generation Result:');
        console.log('- Success:', result1.success);
        console.log('- QR URL:', result1.qr_data_url);
        console.log('- Bank Info:', result1.bank_info);
        console.log('');
    } catch (error) {
        console.error('❌ Test 1 Failed:', error.message);
    }

    // Test 2: Payment content generation
    console.log('📋 Test 2: Payment Content Generation');
    try {
        const content1 = VietQRService.generatePaymentContent(123, 'premium');
        const content2 = VietQRService.generatePaymentContent(456, 'pro');

        console.log('✅ Generated Payment Contents:');
        console.log('- Premium:', content1);
        console.log('- Pro:', content2);
        console.log('- Valid Premium:', VietQRService.validatePaymentContent(content1));
        console.log('- Valid Pro:', VietQRService.validatePaymentContent(content2));
        console.log('');
    } catch (error) {
        console.error('❌ Test 2 Failed:', error.message);
    }

    // Test 3: Bank validation
    console.log('📋 Test 3: Bank Validation');
    try {
        const validations = [
            { bank: 'VCB', account: '1234567890' },
            { bank: 'TCB', account: '123456789' },
            { bank: 'INVALID', account: '1234567890' },
            { bank: 'VCB', account: '123' }
        ];

        validations.forEach(({ bank, account }) => {
            const isValid = VietQRService.validateBankAccount(bank, account);
            console.log(`- ${bank} - ${account}: ${isValid ? '✅' : '❌'}`);
        });
        console.log('');
    } catch (error) {
        console.error('❌ Test 3 Failed:', error.message);
    }

    // Test 4: Supported banks
    console.log('📋 Test 4: Supported Banks');
    try {
        const banks = VietQRService.getSupportedBanks();
        console.log(`✅ Total Supported Banks: ${banks.length}`);
        banks.slice(0, 5).forEach(bank => {
            console.log(`- ${bank.code}: ${bank.name} (ID: ${bank.id})`);
        });
        console.log('');
    } catch (error) {
        console.error('❌ Test 4 Failed:', error.message);
    }

    // Test 5: Different templates
    console.log('📋 Test 5: Different QR Templates');
    try {
        const templates = ['compact', 'compact2', 'qr_only'];

        for (const template of templates) {
            const result = await VietQRService.generateQR({
                bankCode: 'VCB',
                accountNumber: '1234567890',
                amount: 50000,
                content: 'TEST' + template.toUpperCase(),
                template
            });

            console.log(`✅ Template '${template}':`, result.success ? 'Success' : 'Failed');
            if (result.success) {
                console.log(`   URL: ${result.qr_data_url}`);
            }
        }
        console.log('');
    } catch (error) {
        console.error('❌ Test 5 Failed:', error.message);
    }

    console.log('🎉 VietQR Integration Test Completed!');
};

// Run test
testVietQR().catch(console.error);
