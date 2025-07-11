-- =============================================
-- Membership & Payment System Migration
-- Thêm các bảng cho hệ thống gói thành viên
-- =============================================

-- Bảng lưu thông tin gói thành viên
CREATE TABLE IF NOT EXISTS membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'free', 'premium', 'pro'
    display_name VARCHAR(100) NOT NULL, -- 'Miễn phí', 'Premium', 'Pro'
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'VND',
    duration_days INT NOT NULL DEFAULT 30, -- Thời hạn gói (ngày)
    features JSON, -- Danh sách tính năng của gói
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng lưu thông tin subscription của user
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    membership_plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id)
);

-- Bảng lưu thông tin giao dịch thanh toán
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    payment_method ENUM('zalopay', 'paypal', 'vnpay', 'momo', 'bank_transfer') NOT NULL,
    payment_gateway_id VARCHAR(100), -- ID từ gateway thanh toán
    transaction_id VARCHAR(100) UNIQUE, -- Mã giao dịch
    status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    gateway_response JSON, -- Response từ gateway
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

-- Bảng lưu feature permissions cho từng gói
CREATE TABLE IF NOT EXISTS membership_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL, -- 'advanced_tracking', 'coach_support', 'premium_content'
    feature_display_name VARCHAR(150) NOT NULL,
    free_plan BOOLEAN DEFAULT FALSE,
    premium_plan BOOLEAN DEFAULT FALSE,
    pro_plan BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default membership plans
INSERT INTO membership_plans (name, display_name, price, duration_days, features) VALUES
('free', 'Miễn phí', 0.00, 365, JSON_OBJECT(
    'basic_tracking', true,
    'basic_plan', true,
    'community_access', false,
    'coach_support', false,
    'premium_content', false
)),
('premium', 'Premium', 99000.00, 30, JSON_OBJECT(
    'basic_tracking', true,
    'basic_plan', true,
    'community_access', true,
    'coach_support', true,
    'premium_content', false
)),
('pro', 'Pro', 999000.00, 30, JSON_OBJECT(
    'basic_tracking', true,
    'basic_plan', true,
    'community_access', true,
    'coach_support', true,
    'premium_content', true
));

-- Insert default features
INSERT INTO membership_features (feature_name, feature_display_name, free_plan, premium_plan, pro_plan) VALUES
('basic_tracking', 'Theo dõi cơ bản', TRUE, TRUE, TRUE),
('basic_plan', 'Lập kế hoạch cá nhân', TRUE, TRUE, TRUE),
('community_access', 'Truy cập cộng đồng', FALSE, TRUE, TRUE),
('coach_support', 'Hỗ trợ & tư vấn', FALSE, TRUE, TRUE),
('premium_content', 'Nội dung cao cấp', FALSE, FALSE, TRUE),
('advanced_analytics', 'Phân tích nâng cao', FALSE, TRUE, TRUE),
('export_data', 'Xuất dữ liệu', FALSE, FALSE, TRUE),
('priority_support', 'Hỗ trợ ưu tiên', FALSE, FALSE, TRUE);

-- Thêm index cho performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
