import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testMBBankVerification() {
    console.log('🚀 Testing MBBank Payment Verification...');

    // Test data - use the transaction content from our last test
    const testTransaction = {
        tx_content: "UPGRADEPREMIUM1791347121ZQ1S",  // Replace with actual tx_content from test
        amount: 99000.00,
        transaction_id: "MBBANK_TXN_" + Date.now(),
        transaction_date: new Date().toISOString(),
        bank_account: "1234567890"
    };

    try {
        console.log(`🔄 Verifying payment with tx_content: ${testTransaction.tx_content}`);

        const response = await axios.post(
            `${BASE_URL}/payments/verify/external`,
            testTransaction,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );

        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📄 Response Data:`, JSON.stringify(response.data, null, 2));

        if (response.status === 200) {
            const result = response.data;
            if (result.success) {
                console.log("✅ Payment verification successful!");
                console.log(`   💳 Payment ID: ${result.data.payment_id}`);
                console.log(`   📊 Status: ${result.data.status}`);
                // Membership data will be checked separately
            } else {
                console.log(`❌ Verification failed: ${result.message}`);
            }
        } else {
            console.log(`❌ HTTP Error: ${response.status}`);
        }

    } catch (error) {
        if (error.response) {
            console.log(`❌ HTTP Error: ${error.response.status}`);
            console.log(`   Response:`, error.response.data);
        } else {
            console.log(`❌ Network error: ${error.message}`);
        }
    }
}

// Test current membership after verification
async function testMembershipStatus() {
    console.log('\n🔍 Testing membership status after verification...');

    try {
        // Login as test user
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testpayment@example.com',
            password: 'TestPassword123!'
        });

        const token = loginResponse.data.data.token;

        // Get current membership
        const membershipResponse = await axios.get(`${BASE_URL}/packages/user/current`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Current Membership Status:');
        console.log(`   🏷️ Type: ${membershipResponse.data.data?.current_membership || 'free'}`);
        console.log(`   📅 Start: ${membershipResponse.data.data?.start_date || 'N/A'}`);
        console.log(`   📅 Expires: ${membershipResponse.data.data?.end_date || 'Never'}`);
        console.log(`   🔍 Expired: ${membershipResponse.data.data?.is_expired || false}`);

    } catch (error) {
        console.log(`❌ Error checking membership: ${error.response?.data || error.message}`);
    }
}

async function runTest() {
    await testMBBankVerification();
    await testMembershipStatus();
}

runTest();
