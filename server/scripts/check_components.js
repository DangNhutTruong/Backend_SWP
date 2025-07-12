/**
 * Quick Component Test - Kiểm tra nhanh các component
 */

const fs = require('fs');
const path = require('path');

class ComponentTester {
  constructor() {
    this.results = [];
  }

  log(message, status = 'info') {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    console.log(`${icons[status]} ${message}`);
    this.results.push({ message, status });
  }

  checkFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log(`${description} exists`, 'success');
      return true;
    } else {
      this.log(`${description} missing: ${filePath}`, 'error');
      return false;
    }
  }

  checkComponent(componentPath, componentName) {
    if (this.checkFileExists(componentPath, `${componentName} component`)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for key features
      const features = [
        { name: 'useState hook', pattern: /useState\s*\(/ },
        { name: 'useEffect hook', pattern: /useEffect\s*\(/ },
        { name: 'API calls', pattern: /fetch\s*\(|axios\s*\(/ },
        { name: 'Error handling', pattern: /catch\s*\(|\.catch/ },
        { name: 'Loading states', pattern: /loading|pending|creating/ }
      ];

      features.forEach(feature => {
        if (feature.pattern.test(content)) {
          this.log(`  ${componentName}: ${feature.name} implemented`, 'success');
        } else {
          this.log(`  ${componentName}: ${feature.name} missing`, 'warning');
        }
      });

      return true;
    }
    return false;
  }

  checkBackendFiles() {
    this.log('\n🔧 Checking Backend Files...', 'info');
    
    const backendFiles = [
      {
        path: '../src/controllers/PackageController.js',
        name: 'Package Controller'
      },
      {
        path: '../src/routes/packages.js',
        name: 'Package Routes'
      },
      {
        path: '../payment_notifier.py',
        name: 'Payment Notifier'
      },
      {
        path: '../src/app.js',
        name: 'Main App'
      }
    ];

    backendFiles.forEach(file => {
      this.checkFileExists(file.path, file.name);
    });
  }

  checkFrontendComponents() {
    this.log('\n🎨 Checking Frontend Components...', 'info');
    
    const frontendPath = '../../client/src/components';
    const components = [
      'EnhancedPayment.jsx',
      'Pay.jsx',
      'LoginModal.jsx',
      'Header.jsx'
    ];

    components.forEach(component => {
      const componentPath = path.join(frontendPath, component);
      this.checkComponent(componentPath, component);
    });
  }

  checkConfig() {
    this.log('\n⚙️ Checking Configuration...', 'info');
    
    // Check package.json files
    this.checkFileExists('../package.json', 'Backend package.json');
    this.checkFileExists('../../client/package.json', 'Frontend package.json');
    
    // Check environment setup
    if (this.checkFileExists('../.env', 'Environment file')) {
      const envContent = fs.readFileSync('../.env', 'utf8');
      const requiredVars = ['PORT', 'JWT_SECRET', 'DB_HOST'];
      
      requiredVars.forEach(envVar => {
        if (envContent.includes(envVar)) {
          this.log(`  Environment variable ${envVar} configured`, 'success');
        } else {
          this.log(`  Environment variable ${envVar} missing`, 'warning');
        }
      });
    }
  }

  checkDatabase() {
    this.log('\n🗃️ Checking Database Setup...', 'info');
    
    // Check if database config exists
    this.checkFileExists('../src/config/database.js', 'Database config');
    
    // Check models
    const models = ['User.js', 'Package.js', 'Payment.js'];
    models.forEach(model => {
      this.checkFileExists(`../src/models/${model}`, `${model} model`);
    });
  }

  printTestGuide() {
    console.log('\n' + '='.repeat(60));
    console.log('📝 MANUAL TESTING GUIDE');
    console.log('='.repeat(60));
    
    console.log('\n1. 🚀 Start Servers:');
    console.log('   Backend:  cd server && npm start');
    console.log('   Frontend: cd client && npm run dev');
    
    console.log('\n2. 🌐 Open Browser:');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:5000');
    
    console.log('\n3. 🧪 Test Flow:');
    console.log('   ✓ Register/Login user');
    console.log('   ✓ Navigate to packages');
    console.log('   ✓ Select a package');
    console.log('   ✓ Test EnhancedPayment component');
    console.log('   ✓ Check QR code generation');
    console.log('   ✓ Test copy-to-clipboard');
    console.log('   ✓ Verify real-time notifications');
    console.log('   ✓ Test auto-status checking');
    
    console.log('\n4. 📧 Test Notifications:');
    console.log('   python payment_notifier.py --test');
    
    console.log('\n5. 🔍 Check Database:');
    console.log('   Verify payment records');
    console.log('   Check user membership status');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPONENT CHECK SUMMARY');
    console.log('='.repeat(60));
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All critical components are ready!');
      console.log('Your Enhanced Manual System is properly set up.');
    } else {
      console.log('\n⚠️  Some components are missing or incomplete.');
      console.log('Please fix the errors before testing.');
    }
  }

  run() {
    console.log('🔍 Enhanced Manual System - Component Check\n');
    
    this.checkBackendFiles();
    this.checkFrontendComponents();
    this.checkConfig();
    this.checkDatabase();
    
    this.printSummary();
    this.printTestGuide();
  }
}

// Run the component tester
if (require.main === module) {
  const tester = new ComponentTester();
  tester.run();
}

module.exports = ComponentTester;
