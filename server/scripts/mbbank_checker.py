# MBBank Transaction Checker
import requests
import time
import json
import logging
from datetime import datetime, timedelta
import os
from typing import List, Dict, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mbbank_checker.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MBBankChecker:
    def __init__(self):
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000/api')
        self.check_interval = int(os.getenv('CHECK_INTERVAL', '120'))  # 2 minutes
        self.mbbank_username = os.getenv('MBBANK_USERNAME')
        self.mbbank_password = os.getenv('MBBANK_PASSWORD')
        
        if not self.mbbank_username or not self.mbbank_password:
            raise ValueError("MBBank credentials not provided in environment variables")
        
        # Track processed transactions to avoid duplicates
        self.processed_transactions = set()
        
    def get_mbbank_transactions(self) -> List[Dict]:
        """
        Get recent transactions from MBBank
        This is a mock implementation - replace with actual MBBank API integration
        """
        try:
            logger.info("🔄 Fetching transactions from MBBank...")
            
            # TODO: Replace with actual MBBank API integration
            # For now, we'll simulate with mock data for testing
            mock_transactions = [
                {
                    "id": f"TXN_{int(time.time())}",
                    "description": "UPGRADEPREMIUM17893591BEO6FS",
                    "amount": 99000.00,
                    "credit_amount": 99000.00,
                    "transaction_date": datetime.now().isoformat(),
                    "account_number": "1234567890",
                    "transaction_type": "CREDIT"
                }
            ]
            
            logger.info(f"✅ Retrieved {len(mock_transactions)} transactions")
            return mock_transactions
            
        except Exception as e:
            logger.error(f"❌ Error fetching MBBank transactions: {e}")
            return []
    
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
                "bank_account": transaction.get("account_number", "1234567890")
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
                logger.error(f"❌ Backend verification failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Network error during verification: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error during verification: {e}")
            return False
    
    def process_transactions(self, transactions: List[Dict]) -> None:
        """
        Process and verify transactions
        """
        for transaction in transactions:
            try:
                tx_id = transaction["id"]
                
                # Skip if already processed
                if tx_id in self.processed_transactions:
                    continue
                
                # Check if this looks like a payment transaction
                description = transaction.get("description", "").upper()
                amount = transaction.get("credit_amount", 0)
                
                # Look for payment patterns
                if any(pattern in description for pattern in ["UPGRADEPREMIUM", "UPGRADEPRO", "UPGRADEFREE"]):
                    if amount > 0:  # Must be a credit transaction
                        logger.info(f"🎯 Found potential payment: {description} - {amount:,.0f}đ")
                        
                        # Verify with backend
                        if self.verify_payment_with_backend(transaction):
                            self.processed_transactions.add(tx_id)
                            logger.info(f"✅ Payment processed successfully: {tx_id}")
                        else:
                            logger.warning(f"⚠️ Payment verification failed: {tx_id}")
                    else:
                        logger.debug(f"🔍 Skipping debit transaction: {description}")
                else:
                    logger.debug(f"🔍 Skipping non-payment transaction: {description}")
                    
            except Exception as e:
                logger.error(f"❌ Error processing transaction {transaction.get('id', 'unknown')}: {e}")
    
    def run_once(self) -> None:
        """
        Run one check cycle
        """
        try:
            logger.info("🚀 Starting MBBank transaction check...")
            
            # Get recent transactions
            transactions = self.get_mbbank_transactions()
            
            if not transactions:
                logger.info("ℹ️ No transactions found")
                return
            
            # Process transactions
            self.process_transactions(transactions)
            
            logger.info("✅ Check cycle completed")
            
        except Exception as e:
            logger.error(f"❌ Error in check cycle: {e}")
    
    def run_continuously(self) -> None:
        """
        Run checker continuously
        """
        logger.info(f"🔄 Starting MBBank checker (interval: {self.check_interval}s)")
        logger.info(f"🔗 Backend URL: {self.backend_url}")
        
        while True:
            try:
                self.run_once()
                logger.info(f"⏰ Waiting {self.check_interval} seconds before next check...")
                time.sleep(self.check_interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 MBBank checker stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Unexpected error: {e}")
                logger.info(f"⏰ Waiting {self.check_interval} seconds before retry...")
                time.sleep(self.check_interval)

def main():
    """
    Main function
    """
    try:
        checker = MBBankChecker()
        
        # Check if we should run once or continuously
        if '--once' in os.sys.argv:
            checker.run_once()
        else:
            checker.run_continuously()
            
    except Exception as e:
        logger.error(f"❌ Failed to start MBBank checker: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
