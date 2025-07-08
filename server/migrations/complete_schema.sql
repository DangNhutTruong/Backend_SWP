-- =============================================
-- NoSmoke Database Schema - Complete Migration
-- Railway MySQL Database Setup
-- =============================================

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    membership_type ENUM('free', 'premium', 'pro') DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Quit Smoking Plans table
CREATE TABLE IF NOT EXISTS quit_smoking_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smoker_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    initial_cigarettes_per_day INT NOT NULL,
    target_weeks INT DEFAULT 4,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (smoker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Progress Tracking table
CREATE TABLE IF NOT EXISTS progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    progress_date DATE NOT NULL,
    cigarettes_smoked INT DEFAULT 0,
    target_cigarettes INT DEFAULT 0,
    mood ENUM('very_bad', 'bad', 'neutral', 'good', 'very_good'),
    note TEXT,
    status ENUM('on_track', 'struggled', 'failed') DEFAULT 'on_track',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES quit_smoking_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_date (plan_id, progress_date)
);

-- Create Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Coaches table
CREATE TABLE IF NOT EXISTS coaches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    specialization VARCHAR(200),
    experience_years INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    availability JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    coach_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    meeting_link VARCHAR(255),
    notes TEXT,
    cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- Create Membership Packages table
CREATE TABLE IF NOT EXISTS membership_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_months INT NOT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default membership packages
INSERT IGNORE INTO membership_packages (name, price, duration_months, features) VALUES
('Free', 0.00, 12, '["Basic progress tracking", "Daily check-ins", "Limited features"]'),
('Premium', 99000.00, 1, '["Full progress tracking", "Coach consultations", "Advanced analytics", "Priority support"]'),
('Pro', 990000.00, 12, '["All Premium features", "Unlimited coach sessions", "Personal coach assignment", "Custom quit plans", "24/7 support"]');

-- Insert sample coaches
INSERT IGNORE INTO coaches (name, email, password, specialization, experience_years, rating, hourly_rate) VALUES
('Dr. Nguyễn Văn A', 'coach1@nosmoke.com', '$2a$10$example1', 'Chuyên gia cai thuốc lá', 5, 4.8, 300000.00),
('Dr. Trần Thị B', 'coach2@nosmoke.com', '$2a$10$example2', 'Tâm lý học', 8, 4.9, 350000.00),
('Dr. Lê Văn C', 'coach3@nosmoke.com', '$2a$10$example3', 'Y học gia đình', 3, 4.7, 250000.00);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_plans_smoker ON quit_smoking_plans(smoker_id);
CREATE INDEX IF NOT EXISTS idx_progress_plan ON progress(plan_id);
CREATE INDEX IF NOT EXISTS idx_progress_date ON progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_coach ON appointments(coach_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- =============================================
-- Migration completed successfully!
-- =============================================
