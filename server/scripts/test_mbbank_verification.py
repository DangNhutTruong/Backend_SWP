import requests
import sys
import os

# Add the scripts directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_mbbank_verification():
    """
    Test MBBank verification with a real payment
    """
    
    BASE_URL = 'http://localhost:5000/api'
    
    print("🚀 Testing MBBank Payment Verification...")
    
    # Test data - use the transaction content from our last test
    test_transaction = {
        "tx_content": "UPGRADEPREMIUM1791347121ZQ1S",  # Replace with actual tx_content from test
        "amount": 99000.00,
        "transaction_id": "MBBANK_TXN_" + str(int(__import__('time').time())),
        "transaction_date": __import__('datetime').datetime.now().isoformat(),
        "bank_account": "1234567890"
    }
    
    try:
        print(f"🔄 Verifying payment with tx_content: {test_transaction['tx_content']}")
        
        response = requests.post(
            f"{BASE_URL}/payments/verify/external",
            json=test_transaction,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Data: {response.json()}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Payment verification successful!")
                print(f"   💳 Payment ID: {result['data']['payment_id']}")
                print(f"   📊 Status: {result['data']['status']}")
                print(f"   🎯 Membership: {result['data']['membership']['type']}")
                print(f"   📅 Valid until: {result['data']['membership']['end_date']}")
            else:
                print(f"❌ Verification failed: {result.get('message')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_mbbank_verification()
