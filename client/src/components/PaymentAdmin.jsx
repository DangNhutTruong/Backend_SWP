/**
 * Manual Payment Confirmation Dashboard
 * Alternative to automatic MBBank checking
 */

import React, { useState, useEffect } from 'react';
import './PaymentAdmin.css';

const PaymentAdmin = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [completedPayments, setCompletedPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPendingPayments();
        fetchCompletedPayments();
        
        // Auto refresh every 30 seconds
        const interval = setInterval(() => {
            fetchPendingPayments();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchPendingPayments = async () => {
        try {
            const response = await fetch('/api/admin/payments/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setPendingPayments(data.data);
            }
        } catch (error) {
            console.error('Error fetching pending payments:', error);
        }
    };

    const fetchCompletedPayments = async () => {
        try {
            const response = await fetch('/api/admin/payments/completed?limit=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setCompletedPayments(data.data);
            }
        } catch (error) {
            console.error('Error fetching completed payments:', error);
        }
    };

    const confirmPayment = async (paymentId, actualAmount = null) => {
        if (!confirm('Xác nhận đã nhận được thanh toán này?')) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/admin/payments/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    actual_amount: actualAmount,
                    confirmed_by: 'admin',
                    confirmation_method: 'manual'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('✅ Payment confirmed successfully!');
                fetchPendingPayments();
                fetchCompletedPayments();
            } else {
                alert('❌ Error: ' + data.message);
            }
        } catch (error) {
            alert('❌ Network error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const rejectPayment = async (paymentId, reason) => {
        if (!reason) reason = prompt('Lý do từ chối:');
        if (!reason) return;
        
        setLoading(true);
        try {
            const response = await fetch('/api/admin/payments/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    rejection_reason: reason
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('✅ Payment rejected!');
                fetchPendingPayments();
            } else {
                alert('❌ Error: ' + data.message);
            }
        } catch (error) {
            alert('❌ Network error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPendingPayments = pendingPayments.filter(payment => 
        payment.tx_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm)
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getPaymentAge = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMinutes = Math.floor((now - created) / (1000 * 60));
        
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} giờ trước`;
        return `${Math.floor(diffMinutes / 1440)} ngày trước`;
    };

    return (
        <div className="payment-admin">
            <div className="header">
                <h1>💳 Payment Admin Dashboard</h1>
                <div className="stats">
                    <div className="stat-card pending">
                        <h3>{pendingPayments.length}</h3>
                        <p>Pending Payments</p>
                    </div>
                    <div className="stat-card completed">
                        <h3>{completedPayments.length}</h3>
                        <p>Recent Completed</p>
                    </div>
                </div>
            </div>

            <div className="controls">
                <input
                    type="text"
                    placeholder="🔍 Search by content, email, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={fetchPendingPayments} className="refresh-btn">
                    🔄 Refresh
                </button>
            </div>

            <div className="payments-section">
                <h2>⏳ Pending Payments ({filteredPendingPayments.length})</h2>
                
                {filteredPendingPayments.length === 0 ? (
                    <div className="empty-state">
                        <h3>🎉 No pending payments!</h3>
                        <p>All payments have been processed.</p>
                    </div>
                ) : (
                    <div className="payments-grid">
                        {filteredPendingPayments.map(payment => (
                            <div key={payment.id} className="payment-card pending">
                                <div className="payment-header">
                                    <span className="payment-id">#{payment.id}</span>
                                    <span className="payment-age">{getPaymentAge(payment.created_at)}</span>
                                </div>
                                
                                <div className="payment-info">
                                    <div className="info-row">
                                        <strong>👤 User:</strong> {payment.user_email}
                                    </div>
                                    <div className="info-row">
                                        <strong>💰 Amount:</strong> 
                                        <span className="amount">{formatCurrency(payment.amount)}</span>
                                    </div>
                                    <div className="info-row">
                                        <strong>📦 Package:</strong> {payment.package_name}
                                    </div>
                                    <div className="info-row">
                                        <strong>🏷️ Content:</strong> 
                                        <code className="tx-content">{payment.tx_content}</code>
                                    </div>
                                    <div className="info-row">
                                        <strong>🕒 Created:</strong> {formatDateTime(payment.created_at)}
                                    </div>
                                </div>

                                <div className="qr-info">
                                    <h4>📱 Payment Instructions:</h4>
                                    <div className="bank-details">
                                        <div><strong>🏦 Bank:</strong> MB Bank</div>
                                        <div><strong>📋 Account:</strong> 0334937028</div>
                                        <div><strong>👤 Name:</strong> Dang Nhut Truong</div>
                                        <div><strong>💬 Content:</strong> <code>{payment.tx_content}</code></div>
                                    </div>
                                </div>

                                <div className="payment-actions">
                                    <button 
                                        onClick={() => confirmPayment(payment.id)}
                                        className="confirm-btn"
                                        disabled={loading}
                                    >
                                        ✅ Confirm Payment
                                    </button>
                                    <button 
                                        onClick={() => rejectPayment(payment.id)}
                                        className="reject-btn"
                                        disabled={loading}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="payments-section">
                <h2>✅ Recent Completed Payments ({completedPayments.length})</h2>
                
                <div className="completed-payments">
                    {completedPayments.map(payment => (
                        <div key={payment.id} className="payment-card completed">
                            <div className="payment-summary">
                                <span className="payment-id">#{payment.id}</span>
                                <span className="user-email">{payment.user_email}</span>
                                <span className="amount">{formatCurrency(payment.amount)}</span>
                                <span className="completed-time">{formatDateTime(payment.confirmed_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentAdmin;
