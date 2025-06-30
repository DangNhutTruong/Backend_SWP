-- Tạo database SmokingCessationSupportPlatform
CREATE DATABASE IF NOT EXISTS SmokingCessationSupportPlatform;

-- Sử dụng database này
USE SmokingCessationSupportPlatform;

-- Tạo bảng User (người dùng) - Updated to match Sequelize model
CREATE TABLE IF NOT EXISTS User (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Age INT NULL,
  Gender ENUM('Male', 'Female', 'Other') NULL,
  Phone VARCHAR(20) NULL,
  Address TEXT NULL,
  RoleID INT NOT NULL DEFAULT 3,
  RoleName VARCHAR(50) NOT NULL DEFAULT 'Smoker',
  Membership ENUM('free', 'basic', 'premium', 'pro') NOT NULL DEFAULT 'free',
  StartDate DATETIME NULL,
  DaysWithoutSmoking INT NOT NULL DEFAULT 0,
  CigarettesPerDay INT NULL,
  CostPerPack DECIMAL(10,2) NULL,
  CigarettesPerPack INT NULL DEFAULT 20,
  MoneySaved DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  LastLogin DATETIME NULL,
  LoginCount INT NOT NULL DEFAULT 0,
  IsActive BOOLEAN NOT NULL DEFAULT TRUE,
  EmailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  EmailVerificationToken VARCHAR(255) NULL,
  PasswordResetToken VARCHAR(255) NULL,
  PasswordResetExpires DATETIME NULL,
  AvatarUrl VARCHAR(255) NULL,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (Email),
  INDEX idx_role (RoleID),
  INDEX idx_membership (Membership)
);

-- Tạo bảng daily_checkins (check-in hàng ngày)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  smoking_status ENUM('smoke-free', 'reduced', 'relapsed') NOT NULL,
  cigarettes_smoked INT DEFAULT 0,
  mood ENUM('great', 'good', 'neutral', 'bad', 'awful') NOT NULL,
  craving_level INT NOT NULL,
  withdrawal_symptoms JSON DEFAULT NULL,
  alternative_activities JSON DEFAULT NULL,
  notes TEXT,
  self_rating INT,
  tomorrow_goal VARCHAR(255),
  stress_level INT,
  stress_factors JSON DEFAULT NULL,
  achievements JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(UserID) ON DELETE CASCADE,
  UNIQUE KEY idx_user_date (user_id, date)
);

-- Tạo bảng appointments (lịch hẹn)
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  coach_id VARCHAR(50),
  coach_name VARCHAR(100) NOT NULL,
  date DATETIME NOT NULL,
  appointment_type ENUM('consultation', 'follow_up', 'emergency') NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
  notes TEXT,
  meeting_link VARCHAR(255),
  duration INT DEFAULT 30,
  feedback JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(UserID) ON DELETE CASCADE,
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Tạo bảng coaches (huấn luyện viên)
CREATE TABLE IF NOT EXISTS coaches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  bio TEXT,
  profile_image VARCHAR(255),
  availability JSON DEFAULT NULL,
  rating FLOAT DEFAULT 0,
  review_count INT DEFAULT 0,
  status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tạo bảng membership_plans (các gói thành viên)
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  price FLOAT NOT NULL,
  duration INT NOT NULL COMMENT 'Duration in days',
  description TEXT,
  features JSON NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_type (type)
);

-- Thêm dữ liệu mẫu cho membership_plans
INSERT INTO membership_plans (name, type, price, duration, description, features, is_recommended)
VALUES 
('Free', 'free', 0, 0, 'Basic access to quit smoking tools', JSON_ARRAY('Basic progress tracking', 'Daily check-ins', 'Community support', 'Educational articles'), FALSE),
('Premium', 'premium', 9.99, 30, 'Enhanced support for your quit journey', JSON_ARRAY('All free features', 'Advanced progress analytics', 'Personalized quit plan', 'Group coaching sessions', 'Priority email support'), TRUE),
('Professional', 'pro', 19.99, 30, 'Maximum support with personalized coaching', JSON_ARRAY('All premium features', 'One-on-one coaching sessions', '24/7 priority support', 'Custom meal and exercise plans', 'Advanced health tracking'), FALSE);
