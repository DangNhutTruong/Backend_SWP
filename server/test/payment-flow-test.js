import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data - using pre-created verified user
const testUser = {
    email: 'testpayment@example.com',
    password: 'TestPassword123!'
};

let authToken = '';
let paymentId = '';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPaymentFlow() {
    console.log('🚀 Starting Payment Flow Test...\n');

    try {
        // Step 1: Login with verified user
        console.log('📋 Step 1: User Authentication');

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });

        authToken = loginResponse.data.data.token;
        console.log('✅ User logged in successfully');
        console.log(`🔑 Token: ${authToken ? authToken.substring(0, 20) + '...' : 'No token'}`);

        // Step 2: Get available packages
        console.log('\n📋 Step 2: Get Available Packages');
        const packagesResponse = await axios.get(`${BASE_URL}/packages`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Packages retrieved:');
        const packages = packagesResponse.data.data || packagesResponse.data.packages || [];
        packages.forEach(pkg => {
            console.log(`   - ${pkg.name}: ${pkg.price.toLocaleString()}đ (${pkg.duration_days} days)`);
        });

        // Select premium package for testing
        const premiumPackage = packages.find(pkg => pkg.name === 'premium' || pkg.type === 'premium' || pkg.name === 'Premium');
        if (!premiumPackage) {
            console.log('Available packages:', packages.map(p => ({ name: p.name, type: p.type, id: p.id })));
            throw new Error('Premium package not found');
        }

        console.log(`🎯 Selected package: ${premiumPackage.name} (ID: ${premiumPackage.id})`);

        // Step 3: Create payment
        console.log('\n📋 Step 3: Create Payment');
        const purchaseResponse = await axios.post(`${BASE_URL}/packages/purchase`, {
            package_id: premiumPackage.id,
            paymentMethod: 'bank_transfer'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('🔍 Purchase Response:', JSON.stringify(purchaseResponse.data, null, 2));

        const responseData = purchaseResponse.data.data;
        paymentId = responseData.payment_id;
        const qrUrl = responseData.qr_code_url;

        console.log('✅ Payment created successfully:');
        console.log(`   💳 Payment ID: ${paymentId}`);
        console.log(`   💰 Amount: ${parseFloat(responseData.amount).toLocaleString()}đ`);
        console.log(`   🏦 Bank: ${responseData.bank_info.bank_name}`);
        console.log(`   📱 Account: ${responseData.bank_info.account_number}`);
        console.log(`   📝 Content: ${responseData.tx_content}`);
        console.log(`   📱 QR URL: ${qrUrl}`);
        console.log(`   🎯 QR Available: ${responseData.qr_available}`);

        // Step 4: Check payment status (pending)
        console.log('\n📋 Step 4: Check Payment Status (Should be pending)');
        const statusResponse1 = await axios.get(`${BASE_URL}/payments/${paymentId}/status`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Payment Status:');
        console.log(`   📊 Status: ${statusResponse1.data.data.payment.status}`);
        console.log(`   ⏰ Created: ${new Date(statusResponse1.data.data.payment.created_at).toLocaleString()}`);

        // Step 5: Get user membership (should still be free)
        console.log('\n📋 Step 5: Check User Membership (Should be free)');
        const membershipResponse1 = await axios.get(`${BASE_URL}/packages/user/current`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Current Membership:');
        console.log(`   🏷️ Type: ${membershipResponse1.data.data?.membership_type || 'free'}`);
        console.log(`   📅 Expires: ${membershipResponse1.data.data?.membership_expires || 'Never'}`);

        // Step 6: Simulate manual payment verification (admin only)
        console.log('\n📋 Step 6: Simulate Payment Verification');
        console.log('ℹ️ In real scenario, this would be done by MBBank script automatically');
        console.log('🔄 For testing, we\'ll manually verify the payment...');

        try {
            const verifyResponse = await axios.post(`${BASE_URL}/payments/${paymentId}/verify`, {
                // Simulating successful verification
                verified: true,
                transaction_id: 'MOCK_TXN_' + Date.now()
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            console.log('✅ Payment verified successfully');
            console.log(`   📊 New Status: ${verifyResponse.data.payment.status}`);
        } catch (error) {
            console.log('⚠️ Manual verification endpoint not accessible (expected)');
            console.log('   This would normally be handled by the MBBank verification script');
        }

        // Step 7: Check final status
        console.log('\n📋 Step 7: Final Status Check');
        const statusResponse2 = await axios.get(`${BASE_URL}/payments/${paymentId}/status`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Final Payment Status:');
        console.log(`   📊 Status: ${statusResponse2.data.data.payment.status}`);
        console.log(`   🔄 Can refund: ${statusResponse2.data.data.can_refund}`);

        // Step 8: Get payment history
        console.log('\n📋 Step 8: Get Payment History');
        const historyResponse = await axios.get(`${BASE_URL}/payments/user/history`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Payment History:');
        const payments = historyResponse.data.data?.payments || historyResponse.data.data || [];
        if (Array.isArray(payments)) {
            payments.forEach(payment => {
                console.log(`   💳 ${payment.id}: ${parseFloat(payment.amount).toLocaleString()}đ - ${payment.status} (${new Date(payment.created_at).toLocaleDateString()})`);
            });
        } else {
            console.log('   No payment history available');
        }

        console.log('\n🎉 Payment Flow Test Completed Successfully!');
        console.log('\n📝 Summary:');
        console.log('   ✅ User authentication');
        console.log('   ✅ Package retrieval');
        console.log('   ✅ Payment creation with VietQR');
        console.log('   ✅ Payment status tracking');
        console.log('   ✅ Payment history');
        console.log('\n🔄 Next: Implement MBBank verification script for automatic payment confirmation');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data?.data?.errors) {
            console.error('📋 Validation Errors:', error.response.data.data.errors);
        }
        if (error.response?.data?.details) {
            console.error('📋 Details:', error.response.data.details);
        }
    }
}

// Run the test
testPaymentFlow();

export { testPaymentFlow };
