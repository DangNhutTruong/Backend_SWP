#!/usr/bin/env python3
"""
Real MBBank Transaction Checker using MBBank API
This script automatically logs into MBBank and checks for real transactions
"""

import requests
import time
import json
import logging
import hashlib
import uuid
from datetime import datetime, timedelta
import os
from typing import List, Dict, Optional
import re
from dotenv import load_dotenv

# Load environment variables from .env.mbbank file
load_dotenv('.env.mbbank')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mbbank_real_checker.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MBBankRealChecker:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000/api')
        
        # 🛡️ An toàn: Giới hạn tần suất kiểm tra (2-5 phút)
        check_interval = int(os.getenv('CHECK_INTERVAL', '180'))  # 3 minutes default
        if check_interval < 120:  # Minimum 2 minutes để tránh bị khóa
            logger.warning(f"⚠️ CHECK_INTERVAL too low ({check_interval}s), setting to 120s minimum for safety")
            check_interval = 120
        elif check_interval > 600:  # Maximum 10 minutes
            logger.warning(f"⚠️ CHECK_INTERVAL too high ({check_interval}s), setting to 600s maximum")
            check_interval = 600
        self.check_interval = check_interval
        
        # ⭐⭐⭐⭐⭐ Dùng .env và giấu kỹ mật khẩu
        self.mbbank_username = os.getenv('MBBANK_USERNAME')
        self.mbbank_password = os.getenv('MBBANK_PASSWORD')
        self.account_number = os.getenv('MBBANK_ACCOUNT_NUMBER', '0334937028')
        
        if not self.mbbank_username or not self.mbbank_password:
            raise ValueError("❌ MBBank credentials not provided. Set MBBANK_USERNAME and MBBANK_PASSWORD in .env.mbbank file")
        
        # Log masked credentials for security (no emoji for Windows compatibility)
        masked_username = self.mbbank_username[:3] + "*" * (len(self.mbbank_username) - 3)
        logger.info(f"[CREDENTIALS] Loaded credentials for user: {masked_username}")
        
        # MBBank API endpoints
        self.base_url = "https://online.mbbank.com.vn"
        self.login_url = f"{self.base_url}/api/retail_web/internetbanking/doLogin"
        self.balance_url = f"{self.base_url}/api/retail-web-internetbankingms/getCasaAccountBalance"
        self.history_url = f"{self.base_url}/api/retail-web-accountms/getAccountDetail"
        
        # 🛡️ Session management với token reuse
        self.session = requests.Session()
        self.device_id = str(uuid.uuid4())
        self.session_id = None
        self.token = None
        self.token_expires_at = None
        self.session_file = 'mbbank_session.json'
        
        # ⭐⭐⭐⭐ Lưu giao dịch đã xử lý tránh duplicate
        self.processed_transactions_file = 'processed_transactions.json'
        self.processed_transactions = self.load_processed_transactions()
        
        # ⭐⭐⭐ Theo dõi lỗi, login thất bại với rate limiting
        self.login_failures = 0
        self.max_login_failures = 3
        self.last_login_attempt = None
        self.login_cooldown = 1800  # 30 minutes cooldown để tránh bị khóa
        self.session_duration = 3600  # Session valid for 1 hour
        
        # 🛡️ Headers giả lập MBBank mobile app chính thức
        self.headers = {
            'User-Agent': 'MBBank/7.1.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 Mobile/MBBank',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Content-Type': 'application/json',
            'Origin': 'https://online.mbbank.com.vn',
            'Referer': 'https://online.mbbank.com.vn/',
            'X-Request-Id': str(uuid.uuid4()),
            'deviceId': self.device_id,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        # Load existing session if available
        self.load_session()
        
    def login_to_mbbank(self) -> bool:
        """
        🛡️ Login an toàn với session reuse và rate limiting
        """
        try:
            # 🛡️ Kiểm tra session hiện tại trước khi login
            if self.is_session_valid():
                logger.info("✅ Using existing valid session, no need to login")
                return True
            
            # Check if cooldown is active
            if self.is_login_cooldown_active():
                return False
            
            logger.info(f"🔄 Logging into MBBank safely... (Failures: {self.login_failures}/{self.max_login_failures})")
            self.last_login_attempt = time.time()
            
            # 🛡️ Add delay before login attempt để tránh spam
            time.sleep(2)
            
            # Prepare login payload
            login_payload = {
                "userId": self.mbbank_username,
                "password": self.mbbank_password,
                "captcha": "",
                "ibAuthen2faString": "",
                "sessionId": "",
                "clientType": "WEB",
                "cType": "WEB",
                "lang": "vi"
            }
            
            response = self.session.post(
                self.login_url,
                json=login_payload,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('result') and result['result'].get('ok'):
                    self.session_id = result.get('sessionId')
                    self.token = result.get('token') or result.get('result', {}).get('token')
                    
                    # 🛡️ Set session expiry time (1 hour from now)
                    self.token_expires_at = datetime.now().timestamp() + self.session_duration
                    
                    # Update headers with session info
                    if self.token:
                        self.headers['Authorization'] = f'Bearer {self.token}'
                    if self.session_id:
                        self.headers['sessionId'] = self.session_id
                    
                    # 🛡️ Save session để reuse
                    self.save_session()
                    
                    # Reset failure count on successful login
                    self.login_failures = 0
                    logger.info("✅ Successfully logged into MBBank with session saved")
                    return True
                else:
                    self.login_failures += 1
                    error_msg = result.get('message', 'Unknown login error')
                    logger.error(f"❌ MBBank login failed ({self.login_failures}/{self.max_login_failures}): {error_msg}")
                    
                    if self.login_failures >= self.max_login_failures:
                        logger.error(f"🚫 Maximum login failures reached. Cooldown for {self.login_cooldown/60:.1f} minutes to prevent account lock")
                    
                    return False
            else:
                self.login_failures += 1
                logger.error(f"❌ MBBank login request failed ({self.login_failures}/{self.max_login_failures}): {response.status_code}")
                return False
                
        except Exception as e:
            self.login_failures += 1
            logger.error(f"❌ Error during MBBank login ({self.login_failures}/{self.max_login_failures}): {e}")
            return False
    
    def get_account_balance(self) -> Optional[Dict]:
        """
        Get account balance from MBBank
        """
        try:
            logger.info("🔄 Getting account balance...")
            
            balance_payload = {
                "accountNo": self.account_number
            }
            
            response = self.session.post(
                self.balance_url,
                json=balance_payload,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Account balance retrieved: {result.get('acctBalance', 'N/A')}")
                return result
            else:
                logger.error(f"❌ Failed to get balance: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error getting balance: {e}")
            return None
    
    def get_transaction_history(self, from_date: str = None, to_date: str = None) -> List[Dict]:
        """
        🛡️ Get transaction history using saved session (an toàn)
        """
        try:
            # 🛡️ Ensure we have valid session before making request
            if not self.is_session_valid():
                logger.warning("⚠️ Session invalid, need to login first")
                return []
            
            logger.info("🔄 Getting transaction history with saved session...")
            
            # Default to last 7 days if no dates provided
            if not from_date:
                from_date = (datetime.now() - timedelta(days=7)).strftime('%d/%m/%Y')
            if not to_date:
                to_date = datetime.now().strftime('%d/%m/%Y')
            
            history_payload = {
                "accountNo": self.account_number,
                "fromDate": from_date,
                "toDate": to_date,
                "historyNumber": "30",  # Get last 30 transactions
                "historyType": "DATE_RANGE"
            }
            
            # 🛡️ Add small delay to prevent rapid requests
            time.sleep(1)
            
            response = self.session.post(
                self.history_url,
                json=history_payload,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                transactions = result.get('transactionHistoryList', [])
                logger.info(f"✅ Retrieved {len(transactions)} transactions from {from_date} to {to_date}")
                return transactions
            elif response.status_code == 401:
                logger.warning("⚠️ Session expired (401), will login on next cycle")
                # Invalidate current session
                self.token = None
                self.session_id = None
                if os.path.exists(self.session_file):
                    os.remove(self.session_file)
                return []
            else:
                logger.error(f"❌ Failed to get transaction history: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error getting transaction history: {e}")
            return []
    
    def find_payment_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """
        Filter transactions that match payment patterns
        """
        payment_transactions = []
        
        for txn in transactions:
            description = txn.get('description', '').upper()
            amount = float(txn.get('creditAmount', 0))
            
            # Look for UPGRADE pattern in description
            if re.search(r'UPGRADE(FREE|PREMIUM|PRO)', description) and amount > 0:
                payment_transactions.append({
                    'id': txn.get('refNo', str(uuid.uuid4())),
                    'description': description,
                    'amount': amount,
                    'credit_amount': amount,
                    'transaction_date': txn.get('transactionDate', ''),
                    'account_number': self.account_number,
                    'transaction_type': 'CREDIT',
                    'reference_number': txn.get('refNo', ''),
                    'raw_transaction': txn
                })
        
        logger.info(f"🔍 Found {len(payment_transactions)} payment transactions")
        return payment_transactions
    
    def verify_payment_with_backend(self, transaction: Dict) -> bool:
        """
        Verify payment with backend API
        """
        try:
            payload = {
                "tx_content": transaction["description"],
                "amount": transaction["credit_amount"],
                "transaction_id": transaction["id"],
                "transaction_date": transaction["transaction_date"],
                "bank_account": transaction.get("account_number"),
                "reference_number": transaction.get("reference_number")
            }
            
            logger.info(f"🔄 Verifying payment: {transaction['description']}")
            
            response = requests.post(
                f"{self.backend_url}/payments/verify/external",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info(f"✅ Payment verified successfully: {transaction['description']}")
                    return True
                else:
                    logger.warning(f"⚠️ Payment verification failed: {result.get('message')}")
                    return False
            else:
                logger.error(f"❌ Backend verification failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error during verification: {e}")
            return False        
    def load_session(self):
        """
        🛡️ Load saved session để tránh login liên tục
        """
        try:
            if os.path.exists(self.session_file):
                with open(self.session_file, 'r') as f:
                    session_data = json.load(f)
                    
                    # Check if session is still valid
                    expires_at = session_data.get('expires_at')
                    if expires_at and datetime.now().timestamp() < expires_at:
                        self.session_id = session_data.get('session_id')
                        self.token = session_data.get('token')
                        self.token_expires_at = expires_at
                        
                        # Update headers with saved session
                        if self.token:
                            self.headers['Authorization'] = f'Bearer {self.token}'
                        if self.session_id:
                            self.headers['sessionId'] = self.session_id
                            
                        logger.info(f"✅ Loaded valid session (expires in {(expires_at - datetime.now().timestamp())/60:.1f} minutes)")
                        return True
                    else:
                        logger.info("⚠️ Saved session expired, will need to login")
                        os.remove(self.session_file)
            
            return False
        except Exception as e:
            logger.error(f"❌ Error loading session: {e}")
            return False
    
    def save_session(self):
        """
        🛡️ Save session để reuse sau này
        """
        try:
            if self.token and self.session_id:
                session_data = {
                    'session_id': self.session_id,
                    'token': self.token,
                    'expires_at': self.token_expires_at,
                    'saved_at': datetime.now().isoformat(),
                    'device_id': self.device_id
                }
                
                with open(self.session_file, 'w') as f:
                    json.dump(session_data, f, indent=2)
                    
                logger.info("💾 Session saved successfully")
        except Exception as e:
            logger.error(f"❌ Error saving session: {e}")
    
    def is_session_valid(self) -> bool:
        """
        🛡️ Check if current session is still valid
        """
        if not self.token or not self.session_id:
            return False
            
        if self.token_expires_at:
            return datetime.now().timestamp() < self.token_expires_at
            
        return True
        
    def load_processed_transactions(self):
        """
        ⭐⭐⭐⭐ Load processed transactions from file to avoid duplicates
        """
        try:
            if os.path.exists(self.processed_transactions_file):
                with open(self.processed_transactions_file, 'r') as f:
                    data = json.load(f)
                    transactions = set(data.get('transactions', []))
                    logger.info(f"[FILE] Loaded {len(transactions)} previously processed transactions")
                    return transactions
            else:
                logger.info("[FILE] No previous transaction file found, starting fresh")
                return set()
        except Exception as e:
            logger.error(f"[ERROR] Error loading processed transactions: {e}")
            return set()
    
    def save_processed_transactions(self):
        """
        ⭐⭐⭐⭐ Save processed transactions to file
        """
        try:
            data = {
                'transactions': list(self.processed_transactions),
                'last_updated': datetime.now().isoformat(),
                'total_processed': len(self.processed_transactions)
            }
            with open(self.processed_transactions_file, 'w') as f:
                json.dump(data, f, indent=2)
            logger.debug(f"💾 Saved {len(self.processed_transactions)} processed transactions")
        except Exception as e:
            logger.error(f"❌ Error saving processed transactions: {e}")
    
    def is_login_cooldown_active(self) -> bool:
        """
        ⭐⭐⭐ Check if login cooldown is active due to multiple failures
        """
        if self.login_failures >= self.max_login_failures and self.last_login_attempt:
            time_since_last_attempt = time.time() - self.last_login_attempt
            if time_since_last_attempt < self.login_cooldown:
                remaining_cooldown = self.login_cooldown - time_since_last_attempt
                logger.warning(f"🚫 Login cooldown active. {remaining_cooldown:.0f} seconds remaining")
                return True
            else:
                # Reset failures after cooldown
                logger.info("✅ Login cooldown expired, resetting failure count")
                self.login_failures = 0
        return False
    
    def run_checker(self):
        """
        🛡️ Main loop an toàn với session reuse và proper rate limiting
        """
        logger.info("🚀 Starting MBBank Real Transaction Checker (Safe Mode)")
        logger.info(f"🛡️ Safety features enabled:")
        logger.info(f"   ⏱️ Check interval: {self.check_interval} seconds ({self.check_interval/60:.1f} minutes)")
        logger.info(f"   🔐 Session reuse: enabled (duration: {self.session_duration/60:.0f} minutes)")
        logger.info(f"   📱 Mobile User-Agent: enabled")
        logger.info(f"   🚫 Login cooldown: {self.login_cooldown/60:.0f} minutes after {self.max_login_failures} failures")
        logger.info(f"   📁 Processed transactions file: {self.processed_transactions_file}")
        
        cycle_count = 0
        consecutive_failures = 0
        max_consecutive_failures = 5
        
        while True:
            try:
                cycle_count += 1
                logger.info(f"🔄 Starting check cycle #{cycle_count}")
                
                # 🛡️ Check login cooldown before attempting anything
                if self.is_login_cooldown_active():
                    logger.info("💤 Waiting during login cooldown...")
                    time.sleep(60)  # Check cooldown every minute
                    continue
                
                # 🛡️ Login only if session is invalid (session reuse)
                if not self.is_session_valid():
                    logger.info("🔑 Session invalid, attempting login...")
                    if not self.login_to_mbbank():
                        consecutive_failures += 1
                        
                        if consecutive_failures >= max_consecutive_failures:
                            logger.error(f"❌ Too many consecutive failures ({consecutive_failures}). Taking extended break...")
                            time.sleep(self.login_cooldown)
                            consecutive_failures = 0
                        else:
                            logger.error("❌ Failed to login, retrying in 5 minutes...")
                            time.sleep(300)
                        continue
                else:
                    logger.info("✅ Using existing valid session")
                
                # Reset consecutive failures on successful login/session
                consecutive_failures = 0
                
                # 🛡️ Get transaction history using session
                transactions = self.get_transaction_history()
                
                if transactions:
                    # Find payment transactions
                    payment_transactions = self.find_payment_transactions(transactions)
                    
                    # ⭐⭐⭐⭐ Process new transactions (avoiding duplicates)
                    new_transactions = 0
                    for txn in payment_transactions:
                        txn_id = txn['id']
                        
                        if txn_id not in self.processed_transactions:
                            new_transactions += 1
                            logger.info(f"🆕 Processing new transaction #{new_transactions}: {txn['description']}")
                            
                            if self.verify_payment_with_backend(txn):
                                self.processed_transactions.add(txn_id)
                                self.save_processed_transactions()  # Save immediately after processing
                                logger.info(f"✅ Transaction processed successfully: {txn_id}")
                            else:
                                logger.warning(f"⚠️ Failed to verify transaction: {txn_id}")
                        else:
                            logger.debug(f"⏭️ Skipping already processed transaction: {txn_id}")
                    
                    if new_transactions == 0:
                        logger.info("ℹ️ No new payment transactions found")
                    else:
                        logger.info(f"✅ Processed {new_transactions} new transactions")
                elif transactions == []:
                    logger.info("ℹ️ No transactions retrieved (may be session issue)")
                    # Don't count this as failure, just continue
                
                # 🛡️ Rate limiting - wait before next check (2-5 minutes safe)
                logger.info(f"💤 Cycle #{cycle_count} complete. Waiting {self.check_interval} seconds before next check...")
                logger.info(f"📊 Session status: {'Valid' if self.is_session_valid() else 'Invalid'}")
                logger.info(f"📊 Total processed transactions: {len(self.processed_transactions)}")
                
                time.sleep(self.check_interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Checker stopped by user")
                self.save_processed_transactions()  # Save before exit
                break
            except Exception as e:
                consecutive_failures += 1
                logger.error(f"❌ Unexpected error in cycle #{cycle_count}: {e}")
                
                if consecutive_failures >= max_consecutive_failures:
                    logger.error(f"❌ Too many consecutive errors ({consecutive_failures}). Taking extended break...")
                    time.sleep(1800)  # 30 minutes break
                    consecutive_failures = 0
                else:
                    logger.info("💤 Waiting 5 minutes before retry...")
                    time.sleep(300)

if __name__ == "__main__":
    try:
        checker = MBBankRealChecker()
        checker.run_checker()
    except Exception as e:
        logger.error(f"❌ Failed to start checker: {e}")
