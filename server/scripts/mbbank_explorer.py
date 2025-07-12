#!/usr/bin/env python3
"""
MBBank API Explorer - Test kết nối và tìm endpoints
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MBBankExplorer:
    def __init__(self):
        self.base_url = "https://online.mbbank.com.vn"
        
        # Session setup
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'max-age=0',
            'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1'
        })
    
    def test_main_page(self):
        """Test kết nối đến trang chính"""
        logger.info("[MAIN] Testing connection to main page...")
        
        try:
            response = self.session.get(self.base_url)
            logger.info(f"[MAIN] Status: {response.status_code}")
            logger.info(f"[MAIN] Content length: {len(response.text)}")
            logger.info(f"[MAIN] First 200 chars: {response.text[:200]}")
            
            # Check for various MBBank indicators
            mbbank_indicators = ["mbbank", "mb bank", "military", "quân đội", "ngân hàng quân đội"]
            found_indicator = False
            
            for indicator in mbbank_indicators:
                if indicator.lower() in response.text.lower():
                    logger.info(f"[MAIN] Found indicator: {indicator}")
                    found_indicator = True
                    break
            
            if found_indicator or response.status_code == 200:
                logger.info("[MAIN] SUCCESS - Connected to website")
                return True
            else:
                logger.warning("[MAIN] WARNING - Page content unclear")
                return False
                
        except Exception as e:
            logger.error(f"[MAIN] ERROR: {e}")
            return False
    
    def explore_api_endpoints(self):
        """Thử các API endpoints có thể"""
        logger.info("[API] Exploring possible API endpoints...")
        
        endpoints_to_test = [
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
        
        working_endpoints = []
        
        for endpoint in endpoints_to_test:
            url = f"{self.base_url}{endpoint}"
            try:
                response = self.session.get(url)
                logger.info(f"[API] {endpoint}: {response.status_code}")
                
                if response.status_code not in [404, 500]:
                    working_endpoints.append((endpoint, response.status_code))
                    
                    # Try to get response content
                    try:
                        if response.headers.get('content-type', '').startswith('application/json'):
                            content = response.json()
                            logger.info(f"[API] {endpoint} JSON: {json.dumps(content, indent=2)[:200]}...")
                        else:
                            logger.info(f"[API] {endpoint} Content: {response.text[:100]}...")
                    except:
                        pass
                        
            except Exception as e:
                logger.error(f"[API] {endpoint} ERROR: {e}")
            
            time.sleep(0.5)  # Be polite
        
        logger.info(f"[API] Working endpoints found: {working_endpoints}")
        return working_endpoints
    
    def test_login_page(self):
        """Test trang login"""
        logger.info("[LOGIN-PAGE] Testing login page...")
        
        login_page_urls = [
            f"{self.base_url}/login",
            f"{self.base_url}/internetbanking",
            f"{self.base_url}/retail",
            f"{self.base_url}/signin"
        ]
        
        for url in login_page_urls:
            try:
                response = self.session.get(url)
                logger.info(f"[LOGIN-PAGE] {url}: {response.status_code}")
                
                if response.status_code == 200:
                    # Look for login form or API endpoints in the page
                    if "login" in response.text.lower() or "signin" in response.text.lower():
                        logger.info(f"[LOGIN-PAGE] Found login page at: {url}")
                        
                        # Extract any API endpoints from the page
                        import re
                        api_matches = re.findall(r'["\']([^"\']*api[^"\']*)["\']', response.text)
                        if api_matches:
                            logger.info(f"[LOGIN-PAGE] Found API endpoints in page: {api_matches[:5]}")
                        
                        return True, url
                        
            except Exception as e:
                logger.error(f"[LOGIN-PAGE] {url} ERROR: {e}")
        
        return False, None
    
    def check_security_headers(self):
        """Kiểm tra security headers"""
        logger.info("[SECURITY] Checking security headers...")
        
        try:
            response = self.session.get(self.base_url)
            headers = response.headers
            
            security_headers = [
                'X-Frame-Options',
                'X-Content-Type-Options',
                'Strict-Transport-Security',
                'Content-Security-Policy',
                'X-XSS-Protection'
            ]
            
            for header in security_headers:
                if header in headers:
                    logger.info(f"[SECURITY] {header}: {headers[header]}")
                else:
                    logger.info(f"[SECURITY] {header}: NOT SET")
                    
        except Exception as e:
            logger.error(f"[SECURITY] ERROR: {e}")

def main():
    """Main explorer function"""
    logger.info("="*60)
    logger.info("[START] MBBank API Explorer")
    logger.info("="*60)
    
    explorer = MBBankExplorer()
    
    # Test 1: Main page connection
    logger.info("\n[TEST-1] Testing main page connection...")
    main_result = explorer.test_main_page()
    if main_result:
        logger.info("[TEST-1] PASSED")
    else:
        logger.warning("[TEST-1] WARNING - Continuing anyway...")
    
    # Test 2: Security headers
    logger.info("\n[TEST-2] Checking security headers...")
    explorer.check_security_headers()
    
    # Test 3: Login page
    logger.info("\n[TEST-3] Finding login page...")
    found_login, login_url = explorer.test_login_page()
    if found_login:
        logger.info(f"[TEST-3] PASSED - Login page: {login_url}")
    else:
        logger.warning("[TEST-3] WARNING - No obvious login page found")
    
    # Test 4: API endpoints (always run this)
    logger.info("\n[TEST-4] Exploring API endpoints...")
    working_endpoints = explorer.explore_api_endpoints()
    
    logger.info("\n[SUMMARY] Exploration complete!")
    logger.info(f"[SUMMARY] Working endpoints: {len(working_endpoints)}")
    for endpoint, status in working_endpoints:
        logger.info(f"[SUMMARY] - {endpoint}: {status}")
    logger.info("[SUMMARY] Next step: Test login methods on working endpoints")

if __name__ == "__main__":
    main()
