#!/usr/bin/env python3
"""
Test script for MBBank Real Checker
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment
load_dotenv('.env.mbbank')

def test_environment():
    """Test if environment variables are properly set"""
    print("🔍 Testing environment configuration...")
    
    required_vars = ['MBBANK_USERNAME', 'MBBANK_PASSWORD', 'MBBANK_ACCOUNT_NUMBER']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ Environment variables are set")
    return True

def test_backend_connection():
    """Test connection to backend API"""
    print("🔍 Testing backend connection...")
    
    backend_url = os.getenv('BACKEND_URL', 'http://localhost:5000/api')
    
    try:
        # Test basic connectivity
        response = requests.get(f"{backend_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is reachable")
            return True
        else:
            print(f"⚠️ Backend returned status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure the server is running.")
        return False
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return False

def test_mbbank_credentials():
    """Test MBBank credentials (dry run)"""
    print("🔍 Testing MBBank credentials...")
    
    username = os.getenv('MBBANK_USERNAME')
    password = os.getenv('MBBANK_PASSWORD')
    
    if not username or not password:
        print("❌ MBBank credentials not found")
        return False
    
    # Don't actually test login here to avoid unnecessary requests
    print(f"✅ MBBank credentials configured for user: {username[:3]}***")
    return True

def main():
    print("🚀 MBBank Real Checker - Test Suite")
    print("=" * 50)
    
    tests = [
        ("Environment", test_environment),
        ("Backend Connection", test_backend_connection),
        ("MBBank Credentials", test_mbbank_credentials)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}:")
        if test_func():
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! You can now run the MBBank checker.")
        print("💡 Run: python mbbank_real_checker.py")
    else:
        print("❌ Some tests failed. Please fix the issues before running the checker.")
        sys.exit(1)

if __name__ == "__main__":
    main()
