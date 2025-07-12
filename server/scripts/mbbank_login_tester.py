#!/usr/bin/env python3
"""
MBBank Login Tester - Test login với các endpoints đã tìm thấy
"""

import requests
import json
import os
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv('.env.mbbank')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MBBankLoginTester:
    def __init__(self):
        # Load credentials
        self.username = os.getenv('MBBANK_USERNAME')
        self.password = os.getenv('MBBANK_PASSWORD')
        self.account_number = os.getenv('MBBANK_ACCOUNT_NUMBER')
        
        if not self.username or not self.password:
            raise ValueError("[ERROR] MBBank credentials not found in .env.mbbank")
        
        # Mask username for logging
        masked_username = self.username[:3] + "*" * (len(self.username) - 3)
        logger.info(f"[INIT] Testing with user: {masked_username}")
        
        self.base_url = "https://online.mbbank.com.vn"
        
        # Working endpoints found by explorer
        self.working_endpoints = [
            "/api",
            "/api/retail_web",
            "/api/retail-web", 
            "/api/retail_web/internetbanking",
            "/api/retail-web-internetbankingms",
            "/api/retail-web-accountms",
            "/api/retail_web/common",
            "/api/auth",
            "/login",
            "/api/login"
        ]
        
        # Session setup
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Content-Type': 'application/json; charset=UTF-8',
            'Origin': 'https://online.mbbank.com.vn',
            'Referer': 'https://online.mbbank.com.vn/',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
    
    def test_login_method_1(self, endpoint):
        """Test method 1: Standard login"""
        url = f"{self.base_url}{endpoint}/doLogin"
        
        login_data = {
            "userId": self.username,
            "password": self.password,
            "captcha": "",
            "ibAuthen2faString": "",
            "sessionId": "",
            "clientIdWeb": str(uuid.uuid4()),
            "go": "",
            "lang": "vi"
        }
        
        try:
            response = self.session.post(url, json=login_data)
            logger.info(f"[LOGIN-1] {endpoint}/doLogin: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[LOGIN-1] Response: {json.dumps(result, indent=2)[:300]}...")
                    return True, result
                except:
                    logger.info(f"[LOGIN-1] Non-JSON response: {response.text[:200]}...")
                    return False, None
            else:
                logger.info(f"[LOGIN-1] Error {response.status_code}: {response.text[:100]}...")
                return False, None
                
        except Exception as e:
            logger.error(f"[LOGIN-1] Exception: {e}")
            return False, None
    
    def test_login_method_2(self, endpoint):
        """Test method 2: Auth endpoint"""
        url = f"{self.base_url}{endpoint}/authenticate"
        
        auth_data = {
            "username": self.username,
            "password": self.password,
            "deviceId": str(uuid.uuid4()),
            "appVersion": "1.0.0"
        }
        
        try:
            response = self.session.post(url, json=auth_data)
            logger.info(f"[LOGIN-2] {endpoint}/authenticate: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[LOGIN-2] Response: {json.dumps(result, indent=2)[:300]}...")
                    return True, result
                except:
                    logger.info(f"[LOGIN-2] Non-JSON response: {response.text[:200]}...")
                    return False, None
            else:
                logger.info(f"[LOGIN-2] Error {response.status_code}: {response.text[:100]}...")
                return False, None
                
        except Exception as e:
            logger.error(f"[LOGIN-2] Exception: {e}")
            return False, None
    
    def test_login_method_3(self, endpoint):
        """Test method 3: Simple login"""
        url = f"{self.base_url}{endpoint}"
        
        simple_data = {
            "user": self.username,
            "pass": self.password
        }
        
        try:
            response = self.session.post(url, json=simple_data)
            logger.info(f"[LOGIN-3] {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[LOGIN-3] Response: {json.dumps(result, indent=2)[:300]}...")
                    return True, result
                except:
                    logger.info(f"[LOGIN-3] Non-JSON response: {response.text[:200]}...")
                    return False, None
            else:
                logger.info(f"[LOGIN-3] Error {response.status_code}: {response.text[:100]}...")
                return False, None
                
        except Exception as e:
            logger.error(f"[LOGIN-3] Exception: {e}")
            return False, None
    
    def test_all_endpoints(self):
        """Test login trên tất cả endpoints"""
        logger.info("[TESTING] Starting comprehensive login testing...")
        
        successful_logins = []
        
        for endpoint in self.working_endpoints:
            logger.info(f"\n[ENDPOINT] Testing: {endpoint}")
            
            # Test method 1
            success1, result1 = self.test_login_method_1(endpoint)
            if success1:
                successful_logins.append((endpoint, "method1", result1))
            
            time.sleep(1)  # Be polite
            
            # Test method 2  
            success2, result2 = self.test_login_method_2(endpoint)
            if success2:
                successful_logins.append((endpoint, "method2", result2))
            
            time.sleep(1)  # Be polite
            
            # Test method 3
            success3, result3 = self.test_login_method_3(endpoint)
            if success3:
                successful_logins.append((endpoint, "method3", result3))
            
            time.sleep(2)  # Longer pause between endpoints
        
        return successful_logins
    
    def analyze_responses(self, successful_logins):
        """Phân tích các response thành công"""
        logger.info(f"\n[ANALYSIS] Found {len(successful_logins)} successful responses")
        
        for endpoint, method, result in successful_logins:
            logger.info(f"[SUCCESS] {endpoint} via {method}")
            
            # Look for common success indicators
            if isinstance(result, dict):
                if 'sessionId' in result:
                    logger.info(f"  - Found sessionId: {result['sessionId']}")
                if 'token' in result:
                    logger.info(f"  - Found token: {result['token'][:20]}...")
                if 'result' in result:
                    logger.info(f"  - Result field: {result['result']}")
                if 'message' in result:
                    logger.info(f"  - Message: {result['message']}")

def main():
    """Main test function"""
    logger.info("="*60)
    logger.info("[START] MBBank Login Comprehensive Test")
    logger.info("="*60)
    
    try:
        tester = MBBankLoginTester()
        
        # Test all endpoints and methods
        successful_logins = tester.test_all_endpoints()
        
        # Analyze results
        tester.analyze_responses(successful_logins)
        
        if successful_logins:
            logger.info(f"\n[COMPLETE] Found {len(successful_logins)} working login methods!")
            logger.info("[NEXT] Ready to implement transaction checker")
        else:
            logger.warning("\n[COMPLETE] No successful logins found")
            logger.info("[NEXT] May need to investigate browser automation or different approach")
        
    except Exception as e:
        logger.error(f"[ERROR] Test failed: {e}")

if __name__ == "__main__":
    main()
