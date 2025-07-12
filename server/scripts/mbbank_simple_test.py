#!/usr/bin/env python3
"""
MBBank Transaction Checker - Simple Test Version
Windows compatible without emoji characters
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

# Configure logging without emojis for Windows compatibility
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mbbank_test.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MBBankSimpleTest:
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
        
        # Session setup with proper MBBank headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Content-Type': 'application/json; charset=UTF-8',
            'Origin': 'https://online.mbbank.com.vn',
            'Referer': 'https://online.mbbank.com.vn/',
            'X-Request-Id': str(time.time()),
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
        
        # API URLs
        self.base_url = "https://online.mbbank.com.vn"
        self.captcha_url = f"{self.base_url}/api/retail_web/common/getCaptcha"
        self.login_url = f"{self.base_url}/api/retail_web/internetbanking/doLogin"
        self.history_url = f"{self.base_url}/api/retail-web-accountms/getAccountDetail"
        
    def get_captcha(self):
        """Get captcha before login"""
        logger.info("[CAPTCHA] Getting captcha...")
        
        try:
            response = self.session.post(self.captcha_url, json={})
            logger.info(f"[CAPTCHA] Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"[CAPTCHA] Response: {json.dumps(result, indent=2)}")
                return result.get('imageString', ''), result.get('sessionId', '')
            else:
                logger.error(f"[CAPTCHA] Failed: {response.status_code}")
                logger.error(f"[CAPTCHA] Response: {response.text}")
                return '', ''
        except Exception as e:
            logger.error(f"[CAPTCHA] Error: {e}")
            return '', ''
    
    def test_login(self):
        """Test login functionality"""
        logger.info("[LOGIN] Testing MBBank login...")
        
        # Try direct login without captcha first
        import uuid
        device_id = str(uuid.uuid4())
        
        login_data = {
            "userId": self.username,
            "password": self.password,
            "captcha": "",
            "ibAuthen2faString": "",
            "sessionId": "",
            "clientIdWeb": device_id,
            "go": "",
            "lang": "vi"
        }
        
        logger.info(f"[LOGIN] Attempting direct login with device ID: {device_id[:8]}...")
        
        try:
            response = self.session.post(self.login_url, json=login_data)
            logger.info(f"[LOGIN] Response status: {response.status_code}")
            logger.info(f"[LOGIN] Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"[LOGIN] Response data: {json.dumps(result, indent=2)}")
                
                if result.get('result'):
                    if result['result'].get('ok'):
                        logger.info("[SUCCESS] Login successful!")
                        return True, result
                    else:
                        error_msg = result['result'].get('message', 'Unknown error')
                        logger.error(f"[FAILED] Login failed: {error_msg}")
                        return False, result
                else:
                    logger.error("[FAILED] No result in response")
                    return False, result
            elif response.status_code == 401:
                # Try with different approach
                logger.info("[LOGIN] 401 error, trying alternative approach...")
                return self.try_alternative_login()
            else:
                logger.error(f"[FAILED] HTTP error: {response.status_code}")
                logger.error(f"[FAILED] Response text: {response.text}")
                return False, None
                
        except Exception as e:
            logger.error(f"[ERROR] Exception during login: {e}")
            return False, None
    
    def try_alternative_login(self):
        """Try alternative login method"""
        import uuid
        logger.info("[ALT-LOGIN] Trying alternative login method...")
        
        # Try mobile app endpoint
        mobile_login_url = f"{self.base_url}/api/retail-transactionms/transactionms/authorize"
        
        mobile_data = {
            "userName": self.username,
            "passWord": self.password,
            "deviceId": str(uuid.uuid4()),
            "lang": "vi"
        }
        
        try:
            response = self.session.post(mobile_login_url, json=mobile_data)
            logger.info(f"[ALT-LOGIN] Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"[ALT-LOGIN] Response: {json.dumps(result, indent=2)}")
                return True, result
            else:
                logger.error(f"[ALT-LOGIN] Failed: {response.status_code}")
                logger.error(f"[ALT-LOGIN] Response: {response.text}")
                return False, None
                
        except Exception as e:
            logger.error(f"[ALT-LOGIN] Error: {e}")
            return False, None
    
    def test_transaction_history(self):
        """Test getting transaction history"""
        logger.info("[HISTORY] Testing transaction history...")
        
        # First login
        login_success, login_result = self.test_login()
        if not login_success:
            return False, "Login failed"
        
        # Extract session info from login
        session_id = None
        if login_result and login_result.get('sessionId'):
            session_id = login_result['sessionId']
            logger.info(f"[SESSION] Got session ID: {session_id}")
        
        # Get transaction history
        history_data = {
            "accountNo": self.account_number,
            "fromDate": "01/07/2025",  # Last 10 days
            "toDate": "12/07/2025",
            "historyNumber": "50",
            "historyType": "DATE_RANGE"
        }
        
        try:
            response = self.session.post(self.history_url, json=history_data)
            logger.info(f"[HISTORY] Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"[HISTORY] Raw response: {json.dumps(result, indent=2)}")
                
                if result.get('transactionHistoryList'):
                    transactions = result['transactionHistoryList']
                    logger.info(f"[SUCCESS] Found {len(transactions)} transactions")
                    
                    # Show recent transactions
                    for i, txn in enumerate(transactions[:5]):  # Show first 5
                        logger.info(f"[TXN-{i+1}] Amount: {txn.get('creditAmount', 'N/A')}")
                        logger.info(f"[TXN-{i+1}] Description: {txn.get('description', 'N/A')}")
                        logger.info(f"[TXN-{i+1}] Date: {txn.get('transactionDate', 'N/A')}")
                        logger.info("---")
                    
                    return True, transactions
                else:
                    logger.warning("[EMPTY] No transactions found")
                    return True, []
            else:
                logger.error(f"[FAILED] HTTP error: {response.status_code}")
                logger.error(f"[FAILED] Response: {response.text}")
                return False, None
                
        except Exception as e:
            logger.error(f"[ERROR] Exception during history fetch: {e}")
            return False, None

def main():
    """Main test function"""
    logger.info("="*50)
    logger.info("[START] MBBank Simple Test")
    logger.info("="*50)
    
    try:
        # Create tester
        tester = MBBankSimpleTest()
        
        # Test 1: Login
        logger.info("\n[TEST-1] Testing Login...")
        login_success, login_data = tester.test_login()
        
        if login_success:
            logger.info("[TEST-1] PASSED - Login successful")
        else:
            logger.error("[TEST-1] FAILED - Login failed")
            return
        
        # Wait a bit
        time.sleep(2)
        
        # Test 2: Transaction History
        logger.info("\n[TEST-2] Testing Transaction History...")
        history_success, transactions = tester.test_transaction_history()
        
        if history_success:
            logger.info(f"[TEST-2] PASSED - Got {len(transactions) if transactions else 0} transactions")
        else:
            logger.error("[TEST-2] FAILED - Could not get transaction history")
        
        logger.info("\n[COMPLETE] All tests completed")
        
    except Exception as e:
        logger.error(f"[ERROR] Test failed: {e}")

if __name__ == "__main__":
    main()
