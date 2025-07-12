/**
 * Enhanced Manual Payment System Testing Script
 * This script helps you test the complete payment flow
 */

const axios = require('axios');

// Configuration - Update these with your actual values
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  TEST_USER: {
    email: 'test@example.com',
    password: 'test123',
    username: 'testuser'
  },
  TEST_PACKAGE_ID: 1 // Update with actual package ID
};

class PaymentTester {
  constructor() {
    this.token = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async makeRequest(method, url, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${CONFIG.API_BASE_URL}${url}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }

  async testServerConnection() {
    this.log('🔗 Testing server connection...');
    const result = await this.makeRequest('GET', '/api/health');
    
    if (result.success) {
      this.log('Server is running and accessible', 'success');
      return true;
    } else {
      this.log(`Server connection failed: ${result.error}`, 'error');
      this.log('Make sure your backend server is running on port 5000', 'error');
      return false;
    }
  }

  async testUserAuth() {
    this.log('👤 Testing user authentication...');
    
    // Try to login
    const loginResult = await this.makeRequest('POST', '/api/auth/login', {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password
    });

    if (loginResult.success && loginResult.data.token) {
      this.token = loginResult.data.token;
      this.log('User authentication successful', 'success');
      return true;
    } else {
      this.log('Authentication failed. Testing with registration...', 'info');
      
      // Try to register if login fails
      const registerResult = await this.makeRequest('POST', '/api/auth/register', {
        username: CONFIG.TEST_USER.username,
        email: CONFIG.TEST_USER.email,
        password: CONFIG.TEST_USER.password
      });

      if (registerResult.success) {
        this.log('User registered successfully', 'success');
        // Try login again
        const secondLoginResult = await this.makeRequest('POST', '/api/auth/login', {
          email: CONFIG.TEST_USER.email,
          password: CONFIG.TEST_USER.password
        });

        if (secondLoginResult.success && secondLoginResult.data.token) {
          this.token = secondLoginResult.data.token;
          this.log('Login after registration successful', 'success');
          return true;
        }
      }
      
      this.log('Authentication completely failed', 'error');
      return false;
    }
  }

  async testPackageList() {
    this.log('📦 Testing package list retrieval...');
    const result = await this.makeRequest('GET', '/api/packages');
    
    if (result.success && Array.isArray(result.data)) {
      this.log(`Found ${result.data.length} packages available`, 'success');
      console.log('Available packages:', result.data.map(p => `${p.id}: ${p.name} - ${p.price}đ`));
      return result.data;
    } else {
      this.log('Failed to retrieve packages', 'error');
      return [];
    }
  }

  async testPaymentCreation(packageId) {
    this.log('💳 Testing Enhanced Payment creation...');
    const result = await this.makeRequest('POST', '/api/packages/purchase', {
      package_id: packageId
    });

    if (result.success && result.data) {
      this.log('Payment created successfully!', 'success');
      console.log('Payment Details:', {
        payment_id: result.data.payment_id,
        amount: result.data.amount,
        qr_code_url: result.data.qr_code_url ? 'Generated' : 'Not generated',
        bank_info: result.data.bank_info,
        tx_content: result.data.tx_content
      });
      return result.data;
    } else {
      this.log(`Payment creation failed: ${result.error}`, 'error');
      return null;
    }
  }

  async testNotificationSystem(paymentData) {
    this.log('📧 Testing notification system...');
    
    // Check if notification script exists
    const fs = require('fs');
    const notificationScript = '../payment_notifier.py';
    
    if (fs.existsSync(notificationScript)) {
      this.log('Notification script found', 'success');
      
      // Test notification sending
      try {
        const { execSync } = require('child_process');
        const command = `python ${notificationScript} --test --payment-id ${paymentData.payment_id}`;
        execSync(command, { cwd: '../scripts' });
        this.log('Test notification sent successfully', 'success');
      } catch (error) {
        this.log(`Notification test failed: ${error.message}`, 'error');
      }
    } else {
      this.log('Notification script not found', 'error');
    }
  }

  async testPaymentStatusCheck(paymentId) {
    this.log('🔍 Testing payment status check...');
    const result = await this.makeRequest('GET', `/api/payments/${paymentId}/status`);

    if (result.success) {
      this.log(`Payment status: ${result.data.status}`, 'success');
      return result.data;
    } else {
      this.log(`Status check failed: ${result.error}`, 'error');
      return null;
    }
  }

  async testAdminConfirmation(paymentId) {
    this.log('⚙️ Testing admin confirmation endpoint...');
    const result = await this.makeRequest('POST', `/api/admin/payments/${paymentId}/confirm`, {
      confirmed: true,
      admin_notes: 'Test confirmation from automated script'
    });

    if (result.success) {
      this.log('Admin confirmation successful', 'success');
      return true;
    } else {
      this.log(`Admin confirmation failed: ${result.error}`, 'error');
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Enhanced Manual Payment System Test\n');
    console.log('=' * 60);

    // Test 1: Server Connection
    if (!await this.testServerConnection()) {
      return this.printSummary();
    }

    // Test 2: User Authentication
    if (!await this.testUserAuth()) {
      return this.printSummary();
    }

    // Test 3: Package List
    const packages = await this.testPackageList();
    if (packages.length === 0) {
      return this.printSummary();
    }

    // Test 4: Payment Creation
    const testPackageId = packages[0]?.id || CONFIG.TEST_PACKAGE_ID;
    const paymentData = await this.testPaymentCreation(testPackageId);
    if (!paymentData) {
      return this.printSummary();
    }

    // Test 5: Notification System
    await this.testNotificationSystem(paymentData);

    // Test 6: Payment Status Check
    await this.testPaymentStatusCheck(paymentData.payment_id);

    // Test 7: Admin Confirmation (Optional)
    this.log('📝 To test admin confirmation, run:');
    console.log(`node test_enhanced_payment.js --confirm ${paymentData.payment_id}`);

    this.printSummary();
    this.printManualTestInstructions(paymentData);
  }

  printSummary() {
    console.log('\n' + '=' * 60);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 60);

    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const totalCount = this.testResults.length;

    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total Tests: ${totalCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All tests passed! Your Enhanced Manual System is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above and fix them.');
    }
  }

  printManualTestInstructions(paymentData) {
    console.log('\n' + '=' * 60);
    console.log('📱 MANUAL TESTING INSTRUCTIONS');
    console.log('=' * 60);
    
    console.log('\n1. 🌐 Open your frontend application');
    console.log('2. 💳 Navigate to payment/membership section');
    console.log('3. 🛒 Select a package and proceed to payment');
    console.log('4. 📱 You should see the EnhancedPayment component with:');
    console.log('   - QR code for bank transfer');
    console.log('   - Real-time notifications');
    console.log('   - Copy-to-clipboard functionality');
    console.log('   - Auto-status checking countdown');
    
    console.log('\n5. 🏦 Test Bank Transfer:');
    console.log(`   - Account: ${paymentData.bank_info?.account_number || '0919704545'}`);
    console.log(`   - Amount: ${paymentData.amount?.toLocaleString() || 'N/A'}đ`);
    console.log(`   - Content: ${paymentData.tx_content || 'N/A'}`);
    
    console.log('\n6. 📧 Check Admin Email for notifications');
    console.log('7. ⚙️  Test admin confirmation in backend');
    console.log('8. 🔄 Verify automatic status updates on frontend');
    
    console.log('\n🎯 Expected Behavior:');
    console.log('   - Instant admin notification');
    console.log('   - Real-time UI updates');
    console.log('   - Smooth user experience');
    console.log('   - Reliable manual confirmation workflow');
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const tester = new PaymentTester();

  if (args[0] === '--confirm' && args[1]) {
    // Test admin confirmation for specific payment
    const paymentId = args[1];
    console.log(`Testing admin confirmation for payment: ${paymentId}`);
    
    if (await tester.testServerConnection() && await tester.testUserAuth()) {
      await tester.testAdminConfirmation(paymentId);
    }
  } else {
    // Run full test suite
    await tester.runFullTest();
  }
}

// Export for use in other scripts
module.exports = PaymentTester;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
