#!/usr/bin/env python3
"""
MBBank Login Status Check
Kiểm tra xem có login được vào MBBank không với approach mới
"""

import requests
import json
import os
import time
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv('.env.mbbank')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MBBankStatusChecker:
    def __init__(self):
        # Load credentials
        self.username = os.getenv('MBBANK_USERNAME')
        self.password = os.getenv('MBBANK_PASSWORD')
        self.account_number = os.getenv('MBBANK_ACCOUNT_NUMBER')
        
        if not self.username or not self.password:
            raise ValueError("[ERROR] Credentials not found in .env.mbbank")
        
        logger.info(f"[INIT] Checking with user: {self.username[:3]}***")
        
        self.base_url = "https://online.mbbank.com.vn"
        self.session = requests.Session()
    
    def test_current_status(self):
        """Kiểm tra status hiện tại của MBBank API"""
        logger.info("="*60)
        logger.info("[STATUS] MBBank API Current Status Check")
        logger.info("="*60)
        
        # Test 1: Website accessibility
        logger.info("\n[TEST-1] Website Accessibility")
        try:
            response = self.session.get(self.base_url, timeout=10)
            logger.info(f"✅ Website accessible: {response.status_code}")
            if response.status_code != 200:
                logger.error("❌ Website not accessible")
                return False
        except Exception as e:
            logger.error(f"❌ Website error: {e}")
            return False
        
        # Test 2: Login endpoint availability
        logger.info("\n[TEST-2] Login Endpoint Check")
        login_endpoints = [
            "/api/retail_web/internetbanking/doLogin",
            "/api/retail-web-internetbankingms/doLogin", 
            "/api/retail_web/common/doLogin",
            "/login"
        ]
        
        available_endpoints = []
        for endpoint in login_endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = self.session.get(url, timeout=5)
                logger.info(f"[ENDPOINT] {endpoint}: {response.status_code}")
                
                if response.status_code in [200, 401, 405]:  # Available but needs auth
                    available_endpoints.append(endpoint)
            except Exception as e:
                logger.error(f"[ENDPOINT] {endpoint}: ERROR - {e}")
        
        logger.info(f"✅ Available endpoints: {len(available_endpoints)}")
        
        # Test 3: Simple login attempt (to see current error)
        logger.info("\n[TEST-3] Simple Login Test")
        if available_endpoints:
            best_endpoint = available_endpoints[0]
            result = self.test_simple_login(best_endpoint)
            return result
        else:
            logger.error("❌ No available login endpoints")
            return False
    
    def test_simple_login(self, endpoint):
        """Test login với endpoint đơn giản nhất"""
        url = f"{self.base_url}{endpoint}"
        
        # Headers đơn giản
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Data đơn giản
        login_data = {
            "userId": self.username,
            "password": self.password
        }
        
        try:
            logger.info(f"[LOGIN] Attempting login to: {endpoint}")
            response = self.session.post(url, json=login_data, timeout=10)
            
            logger.info(f"[LOGIN] Response status: {response.status_code}")
            logger.info(f"[LOGIN] Response headers: {dict(response.headers)}")
            
            # Try to parse response
            try:
                result = response.json()
                logger.info(f"[LOGIN] JSON Response: {json.dumps(result, indent=2)}")
                
                # Analyze response
                if result.get('result', {}).get('ok'):
                    logger.info("🎉 LOGIN SUCCESS!")
                    return True
                else:
                    error_msg = result.get('result', {}).get('message', 'Unknown error')
                    error_code = result.get('result', {}).get('responseCode', 'No code')
                    logger.error(f"❌ LOGIN FAILED: {error_msg} (Code: {error_code})")
                    
                    # Analyze specific errors
                    if "GW649" in str(error_code) or "Encrypt" in error_msg:
                        logger.warning("🔐 ENCRYPTION ERROR: API requires dynamic key encryption")
                        return "encryption_required"
                    elif "captcha" in error_msg.lower():
                        logger.warning("🔤 CAPTCHA REQUIRED: Need to solve captcha first")
                        return "captcha_required"
                    elif "credential" in error_msg.lower():
                        logger.warning("🔑 CREDENTIALS ERROR: Check username/password")
                        return "credentials_error"
                    else:
                        logger.warning(f"❓ UNKNOWN ERROR: {error_msg}")
                        return "unknown_error"
                        
            except ValueError:
                # Not JSON response
                logger.info(f"[LOGIN] HTML Response: {response.text[:200]}...")
                if "login" in response.text.lower():
                    logger.warning("📄 Got login page - might need browser simulation")
                    return "browser_required"
                else:
                    logger.error("❌ Unexpected response format")
                    return False
                    
        except Exception as e:
            logger.error(f"[LOGIN] Exception: {e}")
            return False
    
    def show_recommendations(self, result):
        """Hiển thị khuyến nghị dựa trên kết quả test"""
        logger.info("\n" + "="*60)
        logger.info("[RECOMMENDATIONS] Based on test results")
        logger.info("="*60)
        
        if result == True:
            logger.info("""
🎉 SUCCESS: MBBank API login working!
✅ Can proceed with automation implementation
🚀 Next steps:
   1. Implement transaction history fetching
   2. Add payment matching logic
   3. Integrate with payment system
            """)
            
        elif result == "encryption_required":
            logger.info("""
🔐 ENCRYPTION REQUIRED: API uses dynamic key encryption
❌ Direct API automation not feasible
🔄 Alternatives:
   1. ✅ Current Enhanced Manual System (RECOMMENDED)
   2. 🤖 Browser automation with Selenium
   3. 🔬 Reverse engineer encryption (complex)
            """)
            
        elif result == "captcha_required":
            logger.info("""
🔤 CAPTCHA REQUIRED: Need to solve captcha first
⚠️ Automation challenging but possible
🔄 Solutions:
   1. 🤖 Browser automation with captcha solving
   2. ✅ Enhanced Manual System (easier)
   3. 🧠 AI captcha solving integration
            """)
            
        elif result == "browser_required":
            logger.info("""
📄 BROWSER SIMULATION NEEDED: API returns HTML login page
🤖 Need to simulate real browser behavior
🔄 Solutions:
   1. 🖥️ Selenium WebDriver automation
   2. 🎭 Playwright browser automation
   3. ✅ Enhanced Manual System (more reliable)
            """)
            
        else:
            logger.info("""
❓ UNCLEAR RESULT: Need more investigation
🔍 Diagnostic steps:
   1. Check credentials in .env.mbbank
   2. Verify MBBank account is active
   3. Try manual login on website
   4. ✅ Use Enhanced Manual System (safest)
            """)
        
        logger.info("""
💡 CURRENT RECOMMENDATION:
   Continue with Enhanced Manual System - it's working great!
   
📊 Benefits of current system:
   ✅ 100% reliable (no API changes breaking it)
   ✅ Fast admin notifications
   ✅ Great user experience
   ✅ No ToS violations
   ✅ Production ready
        """)

def main():
    """Main check function"""
    try:
        checker = MBBankStatusChecker()
        result = checker.test_current_status()
        checker.show_recommendations(result)
        
        # Final status
        logger.info("\n" + "="*60)
        logger.info("[FINAL STATUS] MBBank Automation Feasibility")
        logger.info("="*60)
        
        if result == True:
            logger.info("🟢 FEASIBLE: API automation possible")
        elif result in ["encryption_required", "captcha_required", "browser_required"]:
            logger.info("🟡 CHALLENGING: Requires complex workarounds")
            logger.info("✅ RECOMMENDED: Continue with Enhanced Manual System")
        else:
            logger.info("🔴 NOT FEASIBLE: API automation blocked")
            logger.info("✅ RECOMMENDED: Enhanced Manual System is best choice")
        
    except Exception as e:
        logger.error(f"[ERROR] Check failed: {e}")

if __name__ == "__main__":
    main()
