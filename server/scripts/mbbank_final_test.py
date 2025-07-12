#!/usr/bin/env python3
"""
MBBank Final Tester - Test với thông tin thực tế
Dựa trên kết quả từ exploration
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
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mbbank_final_test.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MBBankFinalTester:
    def __init__(self):
        # Load credentials
        self.username = os.getenv('MBBANK_USERNAME')
        self.password = os.getenv('MBBANK_PASSWORD')
        self.account_number = os.getenv('MBBANK_ACCOUNT_NUMBER')
        
        if not self.username or not self.password:
            raise ValueError("[ERROR] Credentials not found")
        
        logger.info(f"[INIT] Testing with user: {self.username[:3]}***")
        
        self.base_url = "https://online.mbbank.com.vn"
        
        # Setup session with realistic headers
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MBBank/2.8.1 CFNetwork/1496.0.7 Darwin/23.5.0',
            'Accept': '*/*',
            'Accept-Language': 'vi-VN,vi;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Request-Id': str(uuid.uuid4()),
            'App-Version': '2.8.1',
            'Connection': 'keep-alive'
        })
    
    def test_realistic_login(self):
        """Test với method thực tế của MBBank mobile app"""
        logger.info("[REALISTIC] Testing with mobile app method...")
        
        # Step 1: Get device ID
        device_id = str(uuid.uuid4()).upper()
        logger.info(f"[REALISTIC] Using device ID: {device_id[:8]}...")
        
        # Step 2: Try login endpoint used by mobile app
        login_url = f"{self.base_url}/api/retail_web/internetbanking/doLogin"
        
        # Use form data instead of JSON (mobile apps often use this)
        login_data = {
            'userId': self.username,
            'password': self.password,
            'captcha': '',
            'ibAuthen2faString': '',
            'sessionId': '',
            'clientIdWeb': device_id,
            'go': '',
            'deviceIdCommon': device_id,
            'challenge': ''
        }
        
        # Update headers for this request
        self.session.headers.update({
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': self.base_url,
            'Referer': f'{self.base_url}/',
        })
        
        try:
            logger.info("[REALISTIC] Sending login request...")
            response = self.session.post(login_url, data=login_data)
            
            logger.info(f"[REALISTIC] Status: {response.status_code}")
            logger.info(f"[REALISTIC] Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[REALISTIC] JSON Response: {json.dumps(result, indent=2)}")
                    
                    # Check for success indicators
                    if result.get('result', {}).get('ok'):
                        logger.info("[SUCCESS] Login successful!")
                        return True, result
                    else:
                        error_msg = result.get('result', {}).get('message', 'Unknown error')
                        logger.error(f"[FAILED] Login failed: {error_msg}")
                        return False, result
                        
                except ValueError:
                    # Not JSON, might be HTML
                    logger.info(f"[REALISTIC] HTML Response: {response.text[:500]}...")
                    return False, response.text
            else:
                logger.error(f"[REALISTIC] HTTP Error: {response.status_code}")
                logger.error(f"[REALISTIC] Response: {response.text[:300]}...")
                return False, None
                
        except Exception as e:
            logger.error(f"[REALISTIC] Exception: {e}")
            return False, None
    
    def test_account_info(self, session_data):
        """Test lấy thông tin tài khoản sau khi login"""
        logger.info("[ACCOUNT] Testing account info retrieval...")
        
        if not session_data:
            logger.error("[ACCOUNT] No session data available")
            return False, None
        
        # Extract session info
        session_id = session_data.get('sessionId', '')
        if not session_id:
            logger.error("[ACCOUNT] No session ID found")
            return False, None
        
        logger.info(f"[ACCOUNT] Using session ID: {session_id[:10]}...")
        
        # Try to get account balance
        balance_url = f"{self.base_url}/api/retail-web-internetbankingms/getCasaAccountBalance"
        
        balance_data = {
            'sessionId': session_id,
            'refNo': str(int(time.time() * 1000)),
            'deviceIdCommon': str(uuid.uuid4()).upper()
        }
        
        try:
            response = self.session.post(balance_url, data=balance_data)
            logger.info(f"[ACCOUNT] Balance request status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[ACCOUNT] Balance response: {json.dumps(result, indent=2)}")
                    return True, result
                except ValueError:
                    logger.info(f"[ACCOUNT] Non-JSON response: {response.text[:300]}...")
                    return False, response.text
            else:
                logger.error(f"[ACCOUNT] Error: {response.status_code}")
                return False, None
                
        except Exception as e:
            logger.error(f"[ACCOUNT] Exception: {e}")
            return False, None
    
    def test_transaction_history(self, session_data):
        """Test lấy lịch sử giao dịch"""
        logger.info("[HISTORY] Testing transaction history...")
        
        if not session_data:
            logger.error("[HISTORY] No session data available")
            return False, None
        
        session_id = session_data.get('sessionId', '')
        if not session_id:
            logger.error("[HISTORY] No session ID found")
            return False, None
        
        history_url = f"{self.base_url}/api/retail-web-accountms/getAccountDetail"
        
        # Date range: last 7 days
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        history_data = {
            'sessionId': session_id,
            'accountNo': self.account_number,
            'fromDate': start_date.strftime('%d/%m/%Y'),
            'toDate': end_date.strftime('%d/%m/%Y'),
            'historyNumber': '50',
            'historyType': 'DATE_RANGE',
            'refNo': str(int(time.time() * 1000))
        }
        
        try:
            response = self.session.post(history_url, data=history_data)
            logger.info(f"[HISTORY] Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    logger.info(f"[HISTORY] Response: {json.dumps(result, indent=2)}")
                    
                    # Check for transactions
                    transactions = result.get('transactionHistoryList', [])
                    if transactions:
                        logger.info(f"[SUCCESS] Found {len(transactions)} transactions!")
                        
                        # Show first few transactions
                        for i, txn in enumerate(transactions[:3]):
                            logger.info(f"[TXN-{i+1}] Amount: {txn.get('creditAmount', txn.get('debitAmount', 'N/A'))}")
                            logger.info(f"[TXN-{i+1}] Description: {txn.get('description', 'N/A')}")
                            logger.info(f"[TXN-{i+1}] Date: {txn.get('transactionDate', 'N/A')}")
                        
                        return True, transactions
                    else:
                        logger.info("[HISTORY] No transactions in response")
                        return True, []
                        
                except ValueError:
                    logger.info(f"[HISTORY] Non-JSON response: {response.text[:300]}...")
                    return False, response.text
            else:
                logger.error(f"[HISTORY] Error: {response.status_code}")
                logger.error(f"[HISTORY] Response: {response.text[:300]}...")
                return False, None
                
        except Exception as e:
            logger.error(f"[HISTORY] Exception: {e}")
            return False, None

def main():
    """Main test function"""
    logger.info("="*60)
    logger.info("[START] MBBank Final Realistic Test")
    logger.info("="*60)
    
    try:
        tester = MBBankFinalTester()
        
        # Test 1: Realistic login
        logger.info("\n[TEST-1] Testing realistic login...")
        login_success, login_data = tester.test_realistic_login()
        
        if not login_success:
            logger.error("[TEST-1] FAILED - Cannot proceed without login")
            return
        
        logger.info("[TEST-1] PASSED - Login successful!")
        
        # Test 2: Account info
        logger.info("\n[TEST-2] Testing account info...")
        account_success, account_data = tester.test_account_info(login_data)
        
        if account_success:
            logger.info("[TEST-2] PASSED - Account info retrieved")
        else:
            logger.warning("[TEST-2] WARNING - Account info failed")
        
        # Test 3: Transaction history  
        logger.info("\n[TEST-3] Testing transaction history...")
        history_success, transactions = tester.test_transaction_history(login_data)
        
        if history_success:
            logger.info(f"[TEST-3] PASSED - Found {len(transactions) if transactions else 0} transactions")
        else:
            logger.warning("[TEST-3] WARNING - Transaction history failed")
        
        # Summary
        logger.info("\n[COMPLETE] Testing complete!")
        if login_success:
            logger.info("[SUCCESS] Ready for automation implementation!")
        else:
            logger.error("[FAILED] Need to investigate further")
        
    except Exception as e:
        logger.error(f"[ERROR] Test failed: {e}")

if __name__ == "__main__":
    main()
