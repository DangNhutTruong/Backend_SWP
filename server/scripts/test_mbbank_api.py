#!/usr/bin/env python3
"""
MBBank API Test - Kiểm tra khả năng kết nối với MBBank
"""

import requests
import json
import uuid
from datetime import datetime

class MBBankAPITest:
    def __init__(self):
        self.base_url = "https://online.mbbank.com.vn"
        self.session = requests.Session()
        self.device_id = str(uuid.uuid4())
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Content-Type': 'application/json',
            'Origin': 'https://online.mbbank.com.vn',
            'Referer': 'https://online.mbbank.com.vn/',
            'X-Request-Id': str(uuid.uuid4()),
            'deviceId': self.device_id
        }
    
    def test_basic_connectivity(self):
        """Test basic connection to MBBank website"""
        print("🔍 Testing basic connectivity to MBBank...")
        try:
            response = self.session.get(self.base_url, headers=self.headers, timeout=10)
            print(f"✅ MBBank website accessible: {response.status_code}")
            return True
        except Exception as e:
            print(f"❌ Cannot connect to MBBank: {e}")
            return False
    
    def test_login_endpoint(self):
        """Test login endpoint availability (without credentials)"""
        print("🔍 Testing login endpoint...")
        try:
            login_url = f"{self.base_url}/api/retail_web/internetbanking/doLogin"
            
            # Try with dummy data to see endpoint response
            dummy_payload = {
                "userId": "test",
                "password": "test",
                "captcha": "",
                "ibAuthen2faString": "",
                "sessionId": "",
                "clientType": "",
                "cType": "",
                "lang": "vi"
            }
            
            response = self.session.post(
                login_url,
                json=dummy_payload,
                headers=self.headers,
                timeout=10
            )
            
            print(f"📡 Login endpoint response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    print(f"📄 Response structure: {list(result.keys())}")
                    
                    # Check if it's expecting captcha or 2FA
                    if 'captcha' in str(result).lower():
                        print("⚠️ Endpoint may require captcha")
                    if '2fa' in str(result).lower():
                        print("⚠️ Endpoint may require 2FA")
                        
                    return True
                except:
                    print("⚠️ Non-JSON response received")
            else:
                print(f"⚠️ Unexpected status code: {response.status_code}")
                
            return False
            
        except Exception as e:
            print(f"❌ Login endpoint test failed: {e}")
            return False
    
    def get_current_endpoints(self):
        """Try to discover current API endpoints"""
        print("🔍 Attempting to discover API endpoints...")
        
        possible_endpoints = [
            "/api/retail_web/internetbanking/doLogin",
            "/api/retail-web-internetbankingms/doLogin", 
            "/retail_web/internetbanking/doLogin",
            "/api/v1/login",
            "/api/login"
        ]
        
        working_endpoints = []
        
        for endpoint in possible_endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = self.session.post(url, json={}, headers=self.headers, timeout=5)
                
                if response.status_code != 404:
                    working_endpoints.append(f"{endpoint} -> {response.status_code}")
                    print(f"✅ Found endpoint: {endpoint} (Status: {response.status_code})")
                
            except:
                continue
        
        if not working_endpoints:
            print("❌ No working endpoints found")
        
        return working_endpoints
    
    def check_requirements(self):
        """Check what authentication MBBank might require"""
        print("🔍 Checking authentication requirements...")
        
        # Try to access login page to see what's required
        try:
            login_page_url = f"{self.base_url}/info-cust/login"
            response = self.session.get(login_page_url, headers=self.headers, timeout=10)
            
            content = response.text.lower()
            
            requirements = []
            if 'captcha' in content:
                requirements.append("CAPTCHA verification")
            if '2fa' in content or 'otp' in content:
                requirements.append("2FA/OTP verification")
            if 'sms' in content:
                requirements.append("SMS verification")
            
            if requirements:
                print("⚠️ MBBank may require:")
                for req in requirements:
                    print(f"   - {req}")
            else:
                print("✅ No obvious additional requirements detected")
                
        except Exception as e:
            print(f"❌ Could not check requirements: {e}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 MBBank API Connectivity Test")
        print("=" * 50)
        
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Login Endpoint", self.test_login_endpoint),
            ("Endpoint Discovery", lambda: len(self.get_current_endpoints()) > 0),
            ("Requirements Check", lambda: (self.check_requirements(), True)[1])
        ]
        
        results = []
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}:")
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ Test failed: {e}")
                results.append((test_name, False))
        
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name}: {status}")
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! MBBank API seems accessible.")
            print("💡 You can now try adding your real credentials to .env.mbbank")
        else:
            print("⚠️ Some tests failed. MBBank API may have changed or require additional authentication.")
            print("💡 Consider alternative approaches like web scraping or manual verification.")

if __name__ == "__main__":
    tester = MBBankAPITest()
    tester.run_all_tests()
