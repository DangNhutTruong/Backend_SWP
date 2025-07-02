import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EmailVerification.css';

export default function EmailVerification() {
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { verifyEmail, resendVerificationCode } = useAuth();

    // Extract email and token from URL/state first
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');
        const emailFromUrl = urlParams.get('email');
        
        // Set email from state (register redirect) or URL
        if (location.state?.email) {
            setEmail(location.state.email);
        } else if (emailFromUrl) {
            setEmail(emailFromUrl);
        }

        // Set verification code from URL if present
        if (tokenFromUrl) {
            setVerificationCode(tokenFromUrl);
        }
    }, [location]);

    // Auto-verify when we have both email and token from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (email && tokenFromUrl && !autoVerifyAttempted) {
            setAutoVerifyAttempted(true);
            handleAutoVerify(tokenFromUrl);
        }
    }, [email, location.search, autoVerifyAttempted]);

    // Auto-verify function
    const handleAutoVerify = async (token) => {
        if (!email) return;
        
        setIsLoading(true);
        setError('');

        try {
            console.log(`🔐 Auto-verifying email ${email} với token: ${token}`);
            const result = await verifyEmail(email, token);
            
            if (result.success) {
                console.log('✅ Auto-verify thành công');
                alert('Email đã được xác thực thành công! Chào mừng bạn đến với NoSmoke!');
                navigate('/', { 
                    state: { message: 'Email đã được xác thực thành công!' }
                });
            } else {
                console.error('❌ Auto-verify thất bại:', result.error);
                setError(result.error || 'Xác thực thất bại. Vui lòng nhập mã thủ công.');
            }
        } catch (error) {
            console.error('🔐 Auto verify error:', error);
            setError('Có lỗi xảy ra khi xác thực email. Vui lòng nhập mã thủ công.');
        } finally {
            setIsLoading(false);
        }
    };

    // Redirect to register if no email provided
    useEffect(() => {
        if (!email && !location.state?.email) {
            const urlParams = new URLSearchParams(location.search);
            const emailFromUrl = urlParams.get('email');
            
            if (!emailFromUrl) {
                navigate('/register');
            }
        }
    }, [email, location.state, location.search, navigate]);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Vui lòng cung cấp địa chỉ email');
            return;
        }

        if (verificationCode.length !== 6) {
            setError('Mã xác nhận phải có 6 chữ số');
            return;
        }

        setIsLoading(true);
        console.log(`🔐 Đang xác thực email ${email} với mã: ${verificationCode}`);

        try {
            const result = await verifyEmail(email, verificationCode);
            console.log('🔐 Kết quả xác thực:', result);

            if (result.success) {
                console.log('✅ Xác thực email thành công');
                alert('Xác nhận email thành công! Chào mừng bạn đến với NoSmoke!');
                // Redirect to home page after successful verification
                navigate('/');
            } else {
                console.error('❌ Xác thực thất bại:', result.error);
                setError(result.error || 'Mã xác nhận không đúng. Vui lòng kiểm tra và thử lại.');
            }
        } catch (err) {
            console.error('🔐 Lỗi xác thực:', err);
            setError(`Có lỗi xảy ra: ${err.message || 'Không xác định được lỗi'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0 || !email) return;

        setError('');
        setIsLoading(true);

        try {
            console.log(`📧 Đang gửi lại mã xác thực cho email: ${email}`);
            const result = await resendVerificationCode(email);

            if (result.success) {
                console.log('✅ Gửi lại mã thành công');
                alert('Mã xác nhận mới đã được gửi đến email của bạn');
                setResendCooldown(60); // 60 seconds cooldown
                setVerificationCode(''); // Clear current code
            } else {
                console.error('❌ Gửi lại mã thất bại:', result.error);
                setError(result.error || 'Không thể gửi lại mã xác nhận');
            }
        } catch (err) {
            console.error('📧 Lỗi gửi lại mã:', err);
            setError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    }; const handleCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setVerificationCode(value);
            console.log(`📟 Mã xác thực đã nhập: ${value}`);
        }
    };

    return (
        <div className="email-verification-page">
            <div className="verification-container">
                <div className="verification-card">
                    <div className="verification-header">
                        <div className="email-icon">
                            📧
                        </div>
                        <h1>Xác nhận Email</h1>
                        <p>Chúng tôi đã gửi mã xác nhận 6 chữ số đến</p>
                        <p className="email-address">{email}</p>
                    </div>

                    <form onSubmit={handleVerify} className="verification-form">
                        {error && <div className="error-message">{error}</div>}

                        {/* Debug info in development */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="debug-info" style={{
                                background: '#f0f8ff',
                                border: '1px solid #87ceeb',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#4682b4' }}>🔧 Debug Info (Development Mode)</h4>
                                <p><strong>Email:</strong> {email}</p>
                                <p><strong>Current Code:</strong> {verificationCode}</p>
                                <p><strong>URL Params:</strong> {location.search}</p>
                                {location.state && (
                                    <p><strong>Location State:</strong> {JSON.stringify(location.state)}</p>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập địa chỉ email của bạn"
                                className="verification-input"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="verificationCode">Mã xác nhận</label>
                            <input
                                type="text"
                                id="verificationCode"
                                value={verificationCode}
                                onChange={handleCodeChange}
                                placeholder="Nhập 6 chữ số"
                                maxLength="6"
                                className="verification-input"
                                disabled={isLoading}
                                required
                                autoComplete="one-time-code"
                            />
                            <div className="input-hint">
                                Nhập mã 6 chữ số từ email của bạn
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="verify-btn"
                            disabled={isLoading || verificationCode.length !== 6}
                        >
                            {isLoading ? 'Đang xác nhận...' : 'Xác nhận'}
                        </button>

                        <div className="resend-section">
                            <p>Không nhận được email?</p>
                            <button
                                type="button"
                                className="resend-btn"
                                onClick={handleResendCode}
                                disabled={isLoading || resendCooldown > 0}
                            >
                                {resendCooldown > 0
                                    ? `Gửi lại sau ${resendCooldown}s`
                                    : 'Gửi lại mã'
                                }
                            </button>
                        </div>

                        <div className="verification-tips">
                            <h4>💡 Mẹo:</h4>
                            <ul>
                                <li>Kiểm tra thư mục spam/junk mail</li>
                                <li>Mã có hiệu lực trong 10 phút</li>
                                <li>Đảm bảo địa chỉ email chính xác</li>
                            </ul>
                        </div>

                        <div className="back-to-register">
                            <button
                                type="button"
                                className="back-btn"
                                onClick={() => navigate('/register')}
                            >
                                ← Quay lại đăng ký
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
