#!/usr/bin/env python3
"""
Enhanced Payment Notification System
Smart notifications cho manual payment confirmation
"""

import smtplib
import json
import os
import sys
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv('.env.mbbank')
load_dotenv('.env.email')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PaymentNotifier:
    def __init__(self):
        # Email configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_user = os.getenv('EMAIL_USER')
        self.email_password = os.getenv('EMAIL_PASSWORD')
        self.admin_email = os.getenv('ADMIN_EMAIL')
        
        # Payment tracking
        self.pending_payments = {}
        self.payments_file = 'pending_payments.json'
        self.load_pending_payments()
    
    def load_pending_payments(self):
        """Load pending payments from file"""
        try:
            if os.path.exists(self.payments_file):
                with open(self.payments_file, 'r', encoding='utf-8') as f:
                    self.pending_payments = json.load(f)
                logger.info(f"[NOTIFIER] Loaded {len(self.pending_payments)} pending payments")
        except Exception as e:
            logger.error(f"[NOTIFIER] Error loading payments: {e}")
            self.pending_payments = {}
    
    def save_pending_payments(self):
        """Save pending payments to file"""
        try:
            with open(self.payments_file, 'w', encoding='utf-8') as f:
                json.dump(self.pending_payments, f, indent=2, ensure_ascii=False)
            logger.info(f"[NOTIFIER] Saved {len(self.pending_payments)} pending payments")
        except Exception as e:
            logger.error(f"[NOTIFIER] Error saving payments: {e}")
    
    def add_pending_payment(self, payment_id, amount, package_name, user_email, qr_content):
        """Add new pending payment"""
        payment_data = {
            'payment_id': payment_id,
            'amount': amount,
            'package_name': package_name,
            'user_email': user_email,
            'qr_content': qr_content,
            'created_at': datetime.now().isoformat(),
            'status': 'pending',
            'notifications_sent': 0
        }
        
        self.pending_payments[payment_id] = payment_data
        self.save_pending_payments()
        
        # Send immediate notification
        self.send_payment_notification(payment_data)
        
        logger.info(f"[NOTIFIER] Added pending payment: {payment_id}")
        return payment_data
    
    def send_payment_notification(self, payment_data):
        """Send email notification about new payment"""
        try:
            # Create email content
            subject = f"🔔 New Payment Pending - {payment_data['package_name']}"
            
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }}
                    .header {{ background: #4CAF50; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; }}
                    .amount {{ font-size: 24px; font-weight: bold; color: #4CAF50; }}
                    .qr-info {{ background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                    .button {{ display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
                    .warning {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>💳 Payment Notification</h2>
                        <p>New payment request received</p>
                    </div>
                    
                    <h3>Payment Details:</h3>
                    <ul>
                        <li><strong>Payment ID:</strong> {payment_data['payment_id']}</li>
                        <li><strong>Package:</strong> {payment_data['package_name']}</li>
                        <li><strong>Amount:</strong> <span class="amount">{payment_data['amount']:,} VND</span></li>
                        <li><strong>User Email:</strong> {payment_data['user_email']}</li>
                        <li><strong>Created:</strong> {payment_data['created_at']}</li>
                    </ul>
                    
                    <div class="qr-info">
                        <h4>🏦 Bank Transfer Details:</h4>
                        <p><strong>QR Content:</strong> {payment_data['qr_content']}</p>
                        <p><em>User should transfer with exactly this content for auto-matching</em></p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Action Required:</strong>
                        <p>Please check your MBBank account for incoming transfer with the above content and confirm payment in admin panel.</p>
                    </div>
                    
                    <a href="http://localhost:3000/admin/payments" class="button">
                        🔍 Check Admin Panel
                    </a>
                    
                    <hr>
                    <p><small>This is an automated notification from Quit Smoking App Payment System</small></p>
                </div>
            </body>
            </html>
            """
            
            # Send email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_user
            msg['To'] = self.admin_email
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            if self.email_user and self.email_password and self.admin_email:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.email_user, self.email_password)
                    server.send_message(msg)
                
                payment_data['notifications_sent'] += 1
                logger.info(f"[NOTIFIER] Email sent for payment {payment_data['payment_id']}")
            else:
                logger.warning("[NOTIFIER] Email credentials not configured")
                
        except Exception as e:
            logger.error(f"[NOTIFIER] Error sending email: {e}")
    
    def send_reminder_notifications(self):
        """Send reminder notifications for old pending payments"""
        current_time = datetime.now()
        
        for payment_id, payment_data in self.pending_payments.items():
            if payment_data['status'] != 'pending':
                continue
            
            created_time = datetime.fromisoformat(payment_data['created_at'])
            time_diff = (current_time - created_time).total_seconds() / 60  # minutes
            
            # Send reminder after 10 minutes, then every 30 minutes
            if (time_diff > 10 and payment_data['notifications_sent'] == 1) or \
               (time_diff > 40 and payment_data['notifications_sent'] == 2) or \
               (time_diff > 100 and payment_data['notifications_sent'] == 3):
                
                self.send_reminder_email(payment_data, time_diff)
    
    def send_reminder_email(self, payment_data, minutes_old):
        """Send reminder email for pending payment"""
        try:
            subject = f"⏰ Payment Reminder - {payment_data['payment_id']} ({int(minutes_old)} min old)"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; margin: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ff9800; border-radius: 8px; padding: 20px;">
                    <div style="background: #ff9800; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;">
                        <h2>⏰ Payment Reminder</h2>
                        <p>Payment has been pending for {int(minutes_old)} minutes</p>
                    </div>
                    
                    <h3>Pending Payment:</h3>
                    <ul>
                        <li><strong>Payment ID:</strong> {payment_data['payment_id']}</li>
                        <li><strong>Amount:</strong> {payment_data['amount']:,} VND</li>
                        <li><strong>Package:</strong> {payment_data['package_name']}</li>
                        <li><strong>User:</strong> {payment_data['user_email']}</li>
                    </ul>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <strong>🔍 Please check:</strong>
                        <p>MBBank account for transfer with content: <strong>{payment_data['qr_content']}</strong></p>
                    </div>
                    
                    <a href="http://localhost:3000/admin/payments" style="display: inline-block; background: #ff9800; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                        Check Admin Panel
                    </a>
                </div>
            </body>
            </html>
            """
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_user
            msg['To'] = self.admin_email
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            if self.email_user and self.email_password and self.admin_email:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.email_user, self.email_password)
                    server.send_message(msg)
                
                payment_data['notifications_sent'] += 1
                self.save_pending_payments()
                logger.info(f"[NOTIFIER] Reminder sent for payment {payment_data['payment_id']}")
            
        except Exception as e:
            logger.error(f"[NOTIFIER] Error sending reminder: {e}")
    
    def confirm_payment(self, payment_id):
        """Mark payment as confirmed"""
        if payment_id in self.pending_payments:
            self.pending_payments[payment_id]['status'] = 'confirmed'
            self.pending_payments[payment_id]['confirmed_at'] = datetime.now().isoformat()
            self.save_pending_payments()
            
            # Send confirmation email to user
            self.send_confirmation_email(self.pending_payments[payment_id])
            
            logger.info(f"[NOTIFIER] Payment confirmed: {payment_id}")
            return True
        return False
    
    def send_confirmation_email(self, payment_data):
        """Send payment confirmation email to user"""
        try:
            subject = f"✅ Payment Confirmed - {payment_data['package_name']}"
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; margin: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px;">
                    <div style="background: #4CAF50; color: white; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;">
                        <h2>✅ Payment Successful!</h2>
                        <p>Your payment has been confirmed</p>
                    </div>
                    
                    <h3>Transaction Details:</h3>
                    <ul>
                        <li><strong>Payment ID:</strong> {payment_data['payment_id']}</li>
                        <li><strong>Package:</strong> {payment_data['package_name']}</li>
                        <li><strong>Amount:</strong> {payment_data['amount']:,} VND</li>
                        <li><strong>Confirmed:</strong> {payment_data.get('confirmed_at', 'Just now')}</li>
                    </ul>
                    
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <strong>🎉 Thank you!</strong>
                        <p>Your membership has been activated. You can now access premium features.</p>
                    </div>
                    
                    <a href="http://localhost:3000/dashboard" style="display: inline-block; background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                        Access Dashboard
                    </a>
                </div>
            </body>
            </html>
            """
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_user
            msg['To'] = payment_data['user_email']
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            if self.email_user and self.email_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.email_user, self.email_password)
                    server.send_message(msg)
                
                logger.info(f"[NOTIFIER] Confirmation email sent to {payment_data['user_email']}")
            
        except Exception as e:
            logger.error(f"[NOTIFIER] Error sending confirmation email: {e}")

# Test function
def test_notifier():
    """Test the notification system"""
    notifier = PaymentNotifier()
    
    # Test payment
    test_payment = notifier.add_pending_payment(
        payment_id="TEST123",
        amount=100000,
        package_name="Premium Monthly",
        user_email="user@test.com",
        qr_content="QSA PREMIUM TEST123"
    )
    
    print(f"Test payment created: {test_payment}")
    
    # Test confirmation
    notifier.confirm_payment("TEST123")
    print("Test payment confirmed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Payment Notification System')
    parser.add_argument('--add-payment', type=str, help='Add new payment (JSON string)')
    parser.add_argument('--confirm-payment', type=str, help='Confirm payment by ID')
    parser.add_argument('--send-reminders', action='store_true', help='Send reminder notifications')
    parser.add_argument('--test', action='store_true', help='Run test')
    
    args = parser.parse_args()
    notifier = PaymentNotifier()
    
    if args.add_payment:
        try:
            payment_data = json.loads(args.add_payment)
            result = notifier.add_pending_payment(
                payment_id=payment_data['payment_id'],
                amount=payment_data['amount'],
                package_name=payment_data['package_name'],
                user_email=payment_data['user_email'],
                qr_content=payment_data['qr_content']
            )
            print(f"✅ Payment notification sent: {result['payment_id']}")
        except Exception as e:
            print(f"❌ Error adding payment: {e}")
            sys.exit(1)
    
    elif args.confirm_payment:
        if notifier.confirm_payment(args.confirm_payment):
            print(f"✅ Payment confirmed: {args.confirm_payment}")
        else:
            print(f"❌ Payment not found: {args.confirm_payment}")
            sys.exit(1)
    
    elif args.send_reminders:
        notifier.send_reminder_notifications()
        print("✅ Reminder notifications sent")
    
    elif args.test:
        test_notifier()
    
    else:
        parser.print_help()
