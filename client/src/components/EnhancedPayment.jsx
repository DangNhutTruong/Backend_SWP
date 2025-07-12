import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './EnhancedPayment.css';

const EnhancedPayment = ({ packageData, onPaymentSuccess }) => {
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('creating'); // creating, pending, checking, completed, failed
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [showInstructions, setShowInstructions] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    createPayment();
  }, []);

  useEffect(() => {
    let timer;
    if (paymentStatus === 'pending' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            checkPaymentStatus();
            return 300; // Reset countdown
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStatus, countdown]);

  const createPayment = async () => {
    try {
      setPaymentStatus('creating');
      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ package_id: packageData.id })
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentData(result.data);
        setPaymentStatus('pending');
        addNotification('🔔 Payment created! Notification sent to admin.', 'success');
        addNotification('📧 Check your email for payment details.', 'info');
      } else {
        setPaymentStatus('failed');
        addNotification('❌ Failed to create payment: ' + result.message, 'error');
      }
    } catch (error) {
      setPaymentStatus('failed');
      addNotification('❌ Network error: ' + error.message, 'error');
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData) return;

    try {
      setPaymentStatus('checking');
      const response = await fetch(`/api/payments/${paymentData.payment_id}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (result.success && result.data.status === 'completed') {
        setPaymentStatus('completed');
        addNotification('🎉 Payment confirmed! Membership activated.', 'success');
        setTimeout(() => onPaymentSuccess(result.data), 2000);
      } else {
        setPaymentStatus('pending');
        addNotification('⏳ Payment still pending. Admin will confirm manually.', 'warning');
      }
    } catch (error) {
      setPaymentStatus('pending');
      addNotification('⚠️ Could not check payment status. Please wait...', 'warning');
    }
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 latest
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addNotification('📋 Copied to clipboard!', 'success');
  };

  if (paymentStatus === 'creating') {
    return (
      <div className="enhanced-payment">
        <div className="payment-loader">
          <div className="spinner"></div>
          <h3>Creating payment...</h3>
          <p>Setting up your premium membership payment</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="enhanced-payment">
        <div className="payment-error">
          <h3>❌ Payment Creation Failed</h3>
          <p>Please try again or contact support</p>
          <button onClick={createPayment} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="enhanced-payment">
        <div className="payment-success">
          <h3>🎉 Payment Successful!</h3>
          <p>Your {packageData.name} membership has been activated</p>
          <div className="success-details">
            <p><strong>Payment ID:</strong> {paymentData.payment_id}</p>
            <p><strong>Amount:</strong> {paymentData.amount.toLocaleString()}đ</p>
            <p><strong>Package:</strong> {packageData.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-payment">
      {/* Notifications Panel */}
      <div className="notifications-panel">
        <h4>🔔 Real-time Updates</h4>
        {notifications.map(notif => (
          <div key={notif.id} className={`notification ${notif.type}`}>
            <span className="notification-message">{notif.message}</span>
            <span className="notification-time">
              {notif.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {/* Payment Status */}
      <div className="payment-status">
        <div className="status-header">
          <h3>💳 Payment Status</h3>
          <div className={`status-badge ${paymentStatus}`}>
            {paymentStatus === 'pending' && '⏳ Pending Confirmation'}
            {paymentStatus === 'checking' && '🔍 Checking Status...'}
          </div>
        </div>

        {paymentStatus === 'pending' && (
          <div className="auto-check-info">
            <p>🤖 Auto-checking in: <strong>{formatTime(countdown)}</strong></p>
            <button onClick={checkPaymentStatus} className="check-now-btn">
              Check Now
            </button>
          </div>
        )}
      </div>

      {/* QR Code Section */}
      {paymentData && (
        <div className="qr-section">
          <div className="qr-header">
            <h3>📱 Quick Payment</h3>
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="toggle-instructions"
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </button>
          </div>

          {paymentData.qr_code_url && (
            <div className="qr-display">
              <img src={paymentData.qr_code_url} alt="Payment QR Code" />
              <p>Scan with your banking app</p>
            </div>
          )}

          {showInstructions && (
            <div className="payment-instructions">
              <h4>📋 Payment Instructions</h4>
              <div className="instruction-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>Open your MBBank app or scan QR code above</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Transfer exactly: <strong>{paymentData.amount.toLocaleString()}đ</strong></p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="transfer-content">
                    <p>Use this content (click to copy):</p>
                    <div 
                      className="copyable-content"
                      onClick={() => copyToClipboard(paymentData.tx_content)}
                    >
                      {paymentData.tx_content}
                    </div>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>Wait for automatic confirmation (1-10 minutes)</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="bank-details">
            <h4>🏦 Bank Transfer Details</h4>
            <div className="bank-info">
              <div className="info-row">
                <span>Bank:</span>
                <span>MB Bank (Military Bank)</span>
              </div>
              <div className="info-row">
                <span>Account Number:</span>
                <span 
                  className="copyable"
                  onClick={() => copyToClipboard(paymentData.bank_info.account_number)}
                >
                  {paymentData.bank_info.account_number}
                </span>
              </div>
              <div className="info-row">
                <span>Account Name:</span>
                <span>{paymentData.bank_info.account_name}</span>
              </div>
              <div className="info-row">
                <span>Amount:</span>
                <span className="amount">{paymentData.amount.toLocaleString()}đ</span>
              </div>
              <div className="info-row">
                <span>Content:</span>
                <span 
                  className="copyable content"
                  onClick={() => copyToClipboard(paymentData.tx_content)}
                >
                  {paymentData.tx_content}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Features Info */}
      <div className="smart-features">
        <h4>🧠 Smart Payment Features</h4>
        <div className="features-list">
          <div className="feature">
            <span className="feature-icon">📧</span>
            <span>Instant admin notification sent</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <span>Auto-status checking every 5 minutes</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⏰</span>
            <span>Reminder notifications for pending payments</span>
          </div>
          <div className="feature">
            <span className="feature-icon">✅</span>
            <span>Instant membership activation on confirmation</span>
          </div>
        </div>
      </div>

      {/* Support Info */}
      <div className="support-info">
        <h4>💬 Need Help?</h4>
        <p>
          If payment isn't confirmed within 30 minutes, please contact support 
          with your payment ID: <strong>{paymentData?.payment_id}</strong>
        </p>
      </div>
    </div>
  );
};

export default EnhancedPayment;
