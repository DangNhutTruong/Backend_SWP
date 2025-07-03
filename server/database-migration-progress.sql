-- Migration script để tạo bảng daily_checkins
-- Chạy script này trên Railway MySQL để tạo bảng tracking tiến trình

USE railway;

-- Tạo bảng daily_checkins nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS daily_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    checkin_date DATE NOT NULL,
    target_cigarettes INT NOT NULL DEFAULT 0,
    actual_cigarettes INT NOT NULL DEFAULT 0,
    mood_rating INT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
    craving_level INT NULL CHECK (craving_level >= 1 AND craving_level <= 10),
    achievements JSON NULL,
    challenges JSON NULL,
    notes TEXT NULL,
    is_success_day BOOLEAN NOT NULL DEFAULT TRUE,
    money_saved DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, checkin_date),
    INDEX idx_user_id (user_id),
    INDEX idx_checkin_date (checkin_date)
);

-- Thêm sample data để test (optional)
INSERT IGNORE INTO daily_checkins (
    user_id, 
    checkin_date, 
    target_cigarettes, 
    actual_cigarettes, 
    mood_rating, 
    craving_level, 
    achievements, 
    challenges, 
    notes, 
    is_success_day, 
    money_saved
) VALUES 
-- Chỉ thêm nếu có user với id = 1
(1, '2024-01-10', 10, 8, 4, 6, '["Giảm được 2 điếu"]', '["Stress công việc"]', 'Ngày đầu khá khó khăn nhưng đã cố gắng', TRUE, 15.00),
(1, '2024-01-11', 8, 6, 4, 5, '["Giảm được 2 điếu nữa"]', '["Thói quen sau ăn"]', 'Tiếp tục giảm dần', TRUE, 12.00),
(1, '2024-01-12', 6, 4, 5, 4, '["Đã giảm được 50%"]', '["Áp lực bạn bè"]', 'Cảm thấy tự tin hơn', TRUE, 18.00);

SELECT 'Migration completed successfully!' as message;
