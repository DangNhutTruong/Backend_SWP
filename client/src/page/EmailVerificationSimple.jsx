import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EmailVerification() {
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const { verifyEmail, resendVerificationCode } = useAuth();

    useEffect(() => {
        // Get token from URL query params
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
            setVerificationCode(tokenFromUrl);
        }

        // Get email from location state or URL params
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            const emailFromUrl = urlParams.get('email');
            if (emailFromUrl) {
                setEmail(emailFromUrl);
            }
        }
    }, [location]);

    useEffect(() => {
        // Countdown timer for resend button
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
        setSuccess('');

        if (!email) {
            setError('Email không được để trống');
            return;
        }

        if (!verificationCode) {
            setError('Mã xác thực không được để trống');
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyEmail(email, verificationCode);
            
            if (result.success) {
                setSuccess('Email đã được xác thực thành công!');
                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            } else {
                setError(result.error || 'Xác thực thất bại');
            }
        } catch (err) {
            setError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');

        if (!email) {
            setError('Email không được để trống');
            return;
        }

        setIsLoading(true);

        try {
            const result = await resendVerificationCode(email);
            
            if (result.success) {
                setSuccess('Mã xác thực đã được gửi lại!');
                setResendCooldown(60);
            } else {
                setError(result.error || 'Gửi lại mã thất bại');
            }
        } catch (err) {
            setError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            maxWidth: '500px', 
            margin: '50px auto', 
            padding: '30px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            backgroundColor: '#fff'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#333', marginBottom: '10px' }}>
                    📧 Xác thực Email
                </h2>
                <p style={{ color: '#666' }}>
                    Nhập mã xác thực đã được gửi về email của bạn
                </p>
            </div>

            <form onSubmit={handleVerify} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
                        Email:
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#333' }}>
                        Mã xác thực:
                    </label>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Nhập mã xác thực"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        required
                    />
                </div>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '4px',
                        color: '#c33',
                        marginBottom: '15px'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#efe',
                        border: '1px solid #cfc',
                        borderRadius: '4px',
                        color: '#363',
                        marginBottom: '15px'
                    }}>
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: isLoading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    {isLoading ? 'Đang xác thực...' : 'Xác thực Email'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ color: '#666', marginBottom: '10px' }}>
                    Không nhận được mã?
                </p>
                <button
                    onClick={handleResend}
                    disabled={isLoading || resendCooldown > 0}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: resendCooldown > 0 ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    {resendCooldown > 0 
                        ? `Gửi lại sau ${resendCooldown}s` 
                        : isLoading 
                            ? 'Đang gửi...' 
                            : 'Gửi lại mã'
                    }
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <p style={{ color: '#666' }}>
                    Đã có tài khoản?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            textDecoration: 'underline',
                            cursor: 'pointer'
                        }}
                    >
                        Đăng nhập ngay
                    </button>
                </p>
            </div>
        </div>
    );
}
