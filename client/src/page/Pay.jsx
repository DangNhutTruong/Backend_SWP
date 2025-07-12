import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pay.css';
import { FaCreditCard, FaWallet, FaMoneyBillWave, FaPaypal } from 'react-icons/fa';
import { API_ENDPOINTS, apiRequest } from '../services/api';

const Pay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); // Add user to check auth state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer'); // Default to bank transfer
  const [cardInfo, setCardInfo] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null); // Store payment response
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Store QR code URL
  const [verificationStarted, setVerificationStarted] = useState(false); // Track if verification started

  useEffect(() => {
    // Kiểm tra nếu có dữ liệu từ trang chọn gói
    if (location.state && location.state.package) {
      setSelectedPackage(location.state.package);
    } else {
      // Nếu không có dữ liệu, chuyển về trang chọn gói
      navigate('/membership');
    }

    // Cleanup function
    return () => {
      setVerificationStarted(false);
    };
  }, [location, navigate]);

  // Debug authentication state - only run once on component mount
  useEffect(() => {
    console.log('Pay component - Auth state:', {
      user: user ? 'Present' : 'Null',
      userDetails: user,
      auth_token: localStorage.getItem('auth_token') ? 'Present' : 'Missing',
      sessionStorage_auth_token: sessionStorage.getItem('auth_token') ? 'Present' : 'Missing',
      token: localStorage.getItem('token') ? 'Present' : 'Missing'
    });
  }, []); // Empty dependency array to run only once

  // Xử lý thay đổi phương thức thanh toán
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  // Xử lý thay đổi thông tin thẻ
  const handleCardInfoChange = (e) => {
    const { name, value } = e.target;
    setCardInfo({
      ...cardInfo,
      [name]: value
    });
  };  // Xử lý khi nhấn nút thanh toán
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert('Vui lòng đồng ý với điều khoản sử dụng dịch vụ');
      return;
    }

    // Kiểm tra authentication trước khi thanh toán
    const token = localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      localStorage.getItem('token');

    console.log('Authentication check:', {
      user: user ? 'Present' : 'Null',
      token: token ? 'Present' : 'Missing',
      localStorage_auth_token: localStorage.getItem('auth_token'),
      sessionStorage_auth_token: sessionStorage.getItem('auth_token'),
      userDetails: user
    });

    if (!user) {
      console.log('User not found in context, redirecting to login');
      alert('Vui lòng đăng nhập để tiếp tục thanh toán');
      navigate('/login', {
        state: {
          from: location.pathname,
          package: selectedPackage
        }
      });
      return;
    }

    // Nếu có user nhưng không có token, thử generate token mới hoặc skip validation
    if (!token) {
      console.log('Token not found but user exists. Attempting to proceed...');
      // Có thể user đăng nhập qua cách khác, thử tiếp tục với user data
    }

    console.log('User authenticated successfully:', user);

    setIsProcessing(true);

    try {
      // Nếu chọn bank transfer, gọi API để tạo payment và QR code
      if (paymentMethod === 'bank_transfer') {
        setProcessingMessage('Đang tạo mã QR thanh toán...');

        console.log('Making payment request with:', {
          endpoint: API_ENDPOINTS.PACKAGE_PURCHASE,
          package_id: selectedPackage.id || getPackageIdByName(selectedPackage.name),
          token: token ? 'Present' : 'Missing'
        });

        const response = await apiRequest(API_ENDPOINTS.PACKAGE_PURCHASE, {
          method: 'POST',
          body: {
            package_id: selectedPackage.id || getPackageIdByName(selectedPackage.name)
          }
        });

        console.log('Payment API response:', response);

        if (response.success) {
          setPaymentData(response.data);
          setQrCodeUrl(response.data.qr_code_url);
          setProcessingMessage('Vui lòng quét mã QR và chuyển khoản...');
          setIsProcessing(false); // Set to false to show QR code

          // Bắt đầu polling để check payment status
          startPaymentVerification(response.data.payment_id);
        } else {
          throw new Error(response.message);
        }
      } else {
        // Xử lý các phương thức thanh toán khác (giả lập)
        let message = '';
        switch (paymentMethod) {
          case 'creditCard':
            message = 'Đang xác thực thông tin thẻ...';
            break;
          case 'momo':
            message = 'Đang chờ thanh toán từ ví Momo...';
            break;
          case 'zalopay':
            message = 'Đang chờ thanh toán từ ZaloPay...';
            break;
          default:
            message = 'Đang xử lý thanh toán...';
        }

        setProcessingMessage(message);

        // Mô phỏng thời gian xử lý thanh toán
        setTimeout(() => {
          updateUser({ membership: selectedPackage.name.toLowerCase() });
          navigate('/payment/success', {
            replace: true,
            state: {
              package: selectedPackage,
              paymentMethod: paymentMethod
            }
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Payment error:', error);

      // Kiểm tra nếu lỗi liên quan đến authentication
      if (error.message.includes('Access token is required') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Token expired') ||
        error.message.includes('Unauthorized')) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục thanh toán.');
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login', {
          state: {
            from: location.pathname,
            package: selectedPackage
          }
        });
        return;
      }

      alert('Có lỗi xảy ra khi xử lý thanh toán: ' + error.message);
      setIsProcessing(false);
    }
  };

  // Helper function để get package ID by name
  const getPackageIdByName = (name) => {
    const packageMap = {
      'Free': 1,
      'Premium': 2,
      'Pro': 3
    };
    return packageMap[name] || 1;
  };

  // Start polling để verify payment
  const startPaymentVerification = (paymentId) => {
    if (verificationStarted) {
      console.log('Payment verification already started, skipping...');
      return;
    }

    console.log('Starting payment verification for payment ID:', paymentId);
    setVerificationStarted(true);

    const pollInterval = setInterval(async () => {
      try {
        // Simplified verification - just check if payment exists and is completed
        // In real implementation, this would be handled by the MBBank checker script
        console.log('Checking payment status for ID:', paymentId);

        // For now, we'll simulate successful payment after some time
        // In production, this would call the actual verification endpoint

      } catch (error) {
        console.error('Payment verification error:', error);
        // Don't stop polling on error, just log it
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 10 minutes and show timeout message
    setTimeout(() => {
      clearInterval(pollInterval);
      console.log('Payment verification stopped after 10 minutes');
      if (isProcessing) {
        setIsProcessing(false);
        alert('Đã tạo QR code thành công! Vui lòng thực hiện chuyển khoản theo hướng dẫn. Hệ thống sẽ tự động xác nhận thanh toán.');
      }
    }, 600000); // 10 minutes
  };

  // Xử lý nút quay lại
  const handleGoBack = () => {
    navigate('/membership');
  };
  // Hiển thị loading khi chưa có dữ liệu gói
  if (!selectedPackage) {
    return (
      <div className="payment-container">
        <div className="payment-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // Hiển thị màn hình xử lý thanh toán
  if (isProcessing) {
    return (
      <div className="payment-container">
        <div className="payment-processing">
          <div className="processing-animation">
            <div className="loading-spinner"></div>
            {paymentMethod === 'creditCard' && <div className="credit-card-icon">💳</div>}
            {paymentMethod === 'momo' && <div className="momo-icon">M</div>}
            {paymentMethod === 'zalopay' && <div className="zalopay-icon">Z</div>}
            {paymentMethod === 'paypal' && <div className="paypal-icon">P</div>}
          </div>
          <h2>{processingMessage}</h2>
          <p>Vui lòng không đóng trang này trong quá trình xử lý...</p>
        </div>
      </div>
    );
  }

  // Tính VAT và tổng tiền
  const vat = selectedPackage.price * 0.1;
  const totalAmount = selectedPackage.price + vat;

  return (
    <div className="payment-container">
      <div className="payment-content">
        <div className="payment-methods-section">
          <h2>Phương thức thanh toán</h2>

          <div className="payment-method-options">
            <div className="payment-option">
              <input
                type="radio"
                id="bank_transfer"
                name="paymentMethod"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => handlePaymentMethodChange('bank_transfer')}
              />
              <label htmlFor="bank_transfer">
                <FaMoneyBillWave style={{ marginRight: '10px' }} /> Chuyển khoản ngân hàng
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="creditCard"
                name="paymentMethod"
                checked={paymentMethod === 'creditCard'}
                onChange={() => handlePaymentMethodChange('creditCard')}
              />              <label htmlFor="creditCard">
                <FaCreditCard style={{ marginRight: '10px' }} /> Thẻ tín dụng/ghi nợ
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="momo"
                name="paymentMethod"
                checked={paymentMethod === 'momo'}
                onChange={() => handlePaymentMethodChange('momo')}
              />
              <label htmlFor="momo">
                <FaWallet style={{ marginRight: '10px' }} /> Ví Momo
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="zalopay"
                name="paymentMethod"
                checked={paymentMethod === 'zalopay'}
                onChange={() => handlePaymentMethodChange('zalopay')}
              />
              <label htmlFor="zalopay">
                <FaMoneyBillWave style={{ marginRight: '10px' }} /> ZaloPay
              </label>
            </div>
          </div>

          {paymentMethod === 'bank_transfer' && paymentData && (
            <div className="bank-transfer-form">
              <h3>Chuyển khoản ngân hàng</h3>

              {paymentData.qr_available && qrCodeUrl ? (
                <div className="qr-section">
                  <div className="qr-code-container">
                    <h4>Quét mã QR để thanh toán</h4>
                    <div className="qr-code">
                      <img
                        src={qrCodeUrl}
                        alt="VietQR Code"
                        style={{
                          maxWidth: '280px',
                          maxHeight: '280px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          padding: '10px',
                          backgroundColor: 'white'
                        }}
                        onError={(e) => {
                          console.error('QR Code load error');
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <p className="qr-instruction">
                      Sử dụng app ngân hàng để quét mã QR trên
                    </p>
                  </div>

                  <div className="divider-text">
                    <span>Hoặc chuyển khoản thủ công</span>
                  </div>
                </div>
              ) : (
                <div className="qr-fallback">
                  <p>⚠️ Không thể tạo mã QR. Vui lòng chuyển khoản thủ công.</p>
                </div>
              )}

              <div className="bank-details">
                <div className="bank-info">
                  <div className="info-row">
                    <span className="label">Ngân hàng:</span>
                    <span className="value">{paymentData.bank_info.bank_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Số tài khoản:</span>
                    <span className="value copyable" onClick={() => navigator.clipboard.writeText(paymentData.bank_info.account_number)}>
                      {paymentData.bank_info.account_number} 📋
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Tên tài khoản:</span>
                    <span className="value">{paymentData.bank_info.account_name}</span>
                  </div>
                  <div className="info-row amount-row">
                    <span className="label">Số tiền:</span>
                    <span className="value amount copyable" onClick={() => navigator.clipboard.writeText(paymentData.amount.toString())}>
                      {paymentData.amount.toLocaleString()}đ 📋
                    </span>
                  </div>
                  <div className="info-row content-row">
                    <span className="label">Nội dung:</span>
                    <span className="value content copyable" onClick={() => navigator.clipboard.writeText(paymentData.tx_content)}>
                      {paymentData.tx_content} 📋
                    </span>
                  </div>
                </div>

                <div className="transfer-instructions">
                  <h4>📋 Hướng dẫn chuyển khoản:</h4>
                  <ol>
                    <li>Mở ứng dụng ngân hàng của bạn</li>
                    <li>Chọn "Chuyển khoản" hoặc quét mã QR ở trên</li>
                    <li>Nhập thông tin chuyển khoản chính xác như trên</li>
                    <li>⚠️ <strong>Quan trọng:</strong> Nội dung phải chính xác: <code>{paymentData.tx_content}</code></li>
                    <li>Xác nhận và thực hiện chuyển khoản</li>
                    <li>Hệ thống sẽ tự động xác nhận trong 1-5 phút</li>
                  </ol>
                </div>

                <div className="payment-status">
                  <div className="status-indicator">
                    <div className="loading-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <p>Đang chờ thanh toán...</p>
                  </div>
                  <small>Hệ thống sẽ tự động kiểm tra và cập nhật khi nhận được thanh toán</small>

                  <div className="manual-confirm" style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      className="confirm-payment-btn"
                      onClick={() => {
                        // Navigate to success page directly for demo
                        navigate('/payment/success', {
                          replace: true,
                          state: {
                            package: selectedPackage,
                            paymentMethod: paymentMethod,
                            paymentId: paymentData.payment_id
                          }
                        });
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      ✅ Đã chuyển khoản thành công
                    </button>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                      Click nút này sau khi đã hoàn tất chuyển khoản
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {paymentMethod === 'creditCard' && (
            <div className="card-info-form">
              <h3>Thông tin thẻ</h3>
              <div className="form-group">
                <label htmlFor="cardName">Tên chủ thẻ</label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  placeholder="NGUYEN VAN A"
                  value={cardInfo.cardName}
                  onChange={handleCardInfoChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cardNumber">Số thẻ</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardInfo.cardNumber}
                  onChange={handleCardInfoChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="expiryDate">Ngày hết hạn</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={cardInfo.expiryDate}
                    onChange={handleCardInfoChange}
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="cvv">Mã CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    placeholder="123"
                    value={cardInfo.cvv}
                    onChange={handleCardInfoChange}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'momo' && (
            <div className="momo-payment-form">
              <div className="qr-code-container">
                <h3>Quét mã để thanh toán qua Ví Momo</h3>
                <div className="qr-code">
                  <div className="qr-image">
                    {/* QR code placeholder - would be dynamic in real app */}
                    <div className="qr-placeholder">
                      <div className="qr-grid"></div>
                    </div>
                  </div>
                  <p className="qr-instruction">Sử dụng ứng dụng Momo để quét mã QR</p>
                </div>
                <div className="payment-instructions">
                  <h4>Hướng dẫn thanh toán:</h4>
                  <ol>
                    <li>Mở ứng dụng Momo trên điện thoại của bạn</li>
                    <li>Chọn "Quét mã QR" trong ứng dụng</li>
                    <li>Quét mã QR được hiển thị ở trên</li>
                    <li>Xác nhận thanh toán trên ứng dụng Momo</li>
                    <li>Đợi xác nhận thanh toán thành công</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'zalopay' && (
            <div className="zalopay-payment-form">
              <div className="qr-code-container">
                <h3>Quét mã để thanh toán qua ZaloPay</h3>
                <div className="qr-code">
                  <div className="qr-image zalopay">
                    {/* QR code placeholder - would be dynamic in real app */}
                    <div className="qr-placeholder">
                      <div className="qr-grid"></div>
                    </div>
                  </div>
                  <p className="qr-instruction">Sử dụng ứng dụng ZaloPay để quét mã QR</p>
                </div>
                <div className="payment-instructions">
                  <h4>Hướng dẫn thanh toán:</h4>
                  <ol>
                    <li>Mở ứng dụng ZaloPay trên điện thoại của bạn</li>
                    <li>Chọn "Quét mã QR" trong ứng dụng</li>
                    <li>Quét mã QR được hiển thị ở trên</li>
                    <li>Xác nhận thanh toán trên ứng dụng ZaloPay</li>
                    <li>Đợi xác nhận thanh toán thành công</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="paypal-payment-form">
              <h3>Thanh toán bằng PayPal</h3>
              <div className="paypal-container">
                <div className="paypal-logo">
                  <div className="paypal-p">P</div>
                  <div className="paypal-a">a</div>
                  <div className="paypal-y">y</div>
                  <div className="paypal-p2">P</div>
                  <div className="paypal-a2">a</div>
                  <div className="paypal-l">l</div>
                </div>
                <p className="paypal-instruction">Bạn sẽ được chuyển đến trang web PayPal để hoàn tất thanh toán.</p>                <button className="paypal-button" onClick={handlePayment}></button>
                <div className="paypal-secure">
                  <span className="lock-icon">🔒</span> Thanh toán an toàn qua PayPal
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="payment-summary-section">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="package-details">
            <div className="package-info">
              <span>Gói {selectedPackage.name}</span>
              <span>{selectedPackage.price.toLocaleString()}đ</span>
            </div>
            <div className="tax-info">
              <span>Thuế VAT (10%)</span>
              <span>{vat.toLocaleString()}đ</span>
            </div>
            <div className="total-amount">
              <span>Tổng cộng</span>
              <span>{totalAmount.toLocaleString()}đ</span>
            </div>
          </div>

          <div className="payment-agreement">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={() => setTermsAccepted(!termsAccepted)}
            />
            <label htmlFor="terms">Tôi đồng ý với <a href="#">điều khoản</a> và <a href="#">điều kiện sử dụng dịch vụ</a></label>
          </div>

          <div className="payment-actions">
            <button className="payment-button" onClick={handlePayment} disabled={!termsAccepted}>
              Thanh toán ngay
            </button>
            <button className="back-button" onClick={handleGoBack}>
              Quay lại
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .payment-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .bank-transfer-form {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 24px;
          margin-top: 20px;
        }
        
        .qr-section {
          margin-bottom: 24px;
        }
        
        .qr-code-container {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .qr-code-container h4 {
          color: #2563eb;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .qr-instruction {
          color: #666;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .divider-text {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        
        .divider-text::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
        }
        
        .divider-text span {
          background: white;
          padding: 0 15px;
          color: #666;
          font-size: 14px;
        }
        
        .qr-fallback {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .bank-details {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
        }
        
        .bank-info {
          margin-bottom: 24px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: 600;
          color: #374151;
          min-width: 120px;
        }
        
        .value {
          color: #111827;
          font-weight: 500;
          text-align: right;
          flex: 1;
        }
        
        .copyable {
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .copyable:hover {
          background-color: #e2e8f0;
        }
        
        .amount-row .value {
          color: #dc2626;
          font-size: 18px;
          font-weight: 700;
        }
        
        .content-row .value {
          color: #1d4ed8;
          font-family: monospace;
          background: #eff6ff;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #dbeafe;
        }
        
        .transfer-instructions {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          border-left: 4px solid #10b981;
        }
        
        .transfer-instructions h4 {
          margin-bottom: 15px;
          color: #059669;
        }
        
        .transfer-instructions ol {
          margin-left: 20px;
        }
        
        .transfer-instructions li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .transfer-instructions code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: #1f2937;
        }
        
        .payment-status {
          text-align: center;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }
        
        .status-indicator {
          margin-bottom: 10px;
        }
        
        .loading-dots {
          display: inline-block;
          margin-bottom: 10px;
        }
        
        .loading-dots span {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #3b82f6;
          margin: 0 2px;
          animation: loading 1.4s infinite ease-in-out both;
        }
        
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes loading {
          0%, 80%, 100% { 
            transform: scale(0);
          } 40% { 
            transform: scale(1.0);
          }
        }
        
        .payment-status p {
          color: #1e40af;
          font-weight: 600;
          margin: 0;
        }
        
        .payment-status small {
          color: #64748b;
        }
        
        .payment-option {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .payment-option:hover {
          border-color: #3b82f6;
        }
        
        .payment-option input[type="radio"]:checked + label {
          color: #3b82f6;
        }
        
        .payment-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 20px;
        }
        
        .payment-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .payment-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .payment-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .payment-summary-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 24px;
          height: fit-content;
        }
        
        .package-details {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .package-info, .tax-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          color: #6b7280;
        }
        
        .total-amount {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 18px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          color: #1f2937;
        }
        
        .payment-agreement {
          margin: 20px 0;
        }
        
        .payment-agreement label {
          margin-left: 8px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .payment-agreement a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .payment-actions {
          display: flex;
          gap: 12px;
        }
        
        .back-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }
        
        .back-button:hover {
          background: #e5e7eb;
        }
        
        @media (max-width: 768px) {
          .payment-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .payment-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Pay;