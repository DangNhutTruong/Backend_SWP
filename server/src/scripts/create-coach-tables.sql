-- Script SQL để tạo các bảng liên quan đến Coach
-- Lưu ý: Sử dụng bảng users cho thông tin coach với role = 'coach'

-- Bảng lịch sẵn có của coach (khung giờ và ngày làm việc)
CREATE TABLE IF NOT EXISTS coach_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT 'Ngày trong tuần (1=Monday, 7=Sunday)',
    time_start TIME NOT NULL COMMENT 'Giờ bắt đầu làm việc',
    time_end TIME NOT NULL COMMENT 'Giờ kết thúc làm việc',
    available BOOLEAN DEFAULT TRUE COMMENT 'Trạng thái khung giờ có còn trống không',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_coach_time (user_id, day_of_week, time_start, time_end)
);

-- Bảng cuộc hẹn với coach
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coach_id INT NOT NULL COMMENT 'ID của user với role coach',
    user_id INT NOT NULL COMMENT 'ID của người dùng đặt lịch',
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL COMMENT 'Format: HH:MM',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    rating INT DEFAULT NULL CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cập nhật bảng users để thêm các trường thông tin cho coach
-- Lưu ý: Chỉ chạy nếu bạn cần thêm các trường này vào bảng users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
ADD COLUMN IF NOT EXISTS experience INT COMMENT 'Years of experience',
ADD COLUMN IF NOT EXISTS working_hours VARCHAR(50) DEFAULT '08:00-22:00' COMMENT 'Format: HH:MM-HH:MM';

-- Dữ liệu mẫu: Đảm bảo có một số người dùng có role = 'coach' trong bảng users
-- Nếu chưa có, hãy chạy lệnh INSERT hoặc UPDATE bên dưới:
/*
INSERT INTO users (username, email, password_hash, full_name, role, bio, specialization, experience) VALUES 
('coach_a', 'coach_a@example.com', '$2b$10$YOUR_HASH_HERE', 'Nguyễn Văn A', 'coach', 'Với 10 năm kinh nghiệm hỗ trợ người cai thuốc lá, tôi đã giúp hơn 500 người bỏ thuốc thành công.', 'Cai thuốc lá, tư vấn tâm lý', 10),
('coach_b', 'coach_b@example.com', '$2b$10$YOUR_HASH_HERE', 'Trần Thị B', 'coach', 'Chuyên gia tâm lý với chuyên môn về nghiện và cai nghiện. Tôi áp dụng phương pháp trị liệu nhận thức hành vi để giúp bệnh nhân vượt qua cơn thèm thuốc.', 'Tâm lý học, nghiện và cai nghiện', 8),
('coach_c', 'coach_c@example.com', '$2b$10$YOUR_HASH_HERE', 'Phạm Minh C', 'coach', 'Bác sĩ chuyên khoa phục hồi chức năng phổi cho người hút thuốc lâu năm. Tôi giúp bạn khôi phục lại sức khỏe sau khi bỏ thuốc.', 'Phục hồi chức năng phổi, thể dục trị liệu', 15);
*/

-- Dữ liệu mẫu cho lịch sẵn có của coach
INSERT INTO coach_availability (user_id, day_of_week, time_start, time_end, available) VALUES
-- Giả sử user_id = 1, 2, 3 là các coach
(1, 1, '08:00:00', '10:00:00', TRUE),
(1, 1, '14:00:00', '16:00:00', TRUE),
(1, 2, '08:00:00', '12:00:00', TRUE),
(1, 3, '13:00:00', '17:00:00', TRUE),
(1, 4, '08:00:00', '12:00:00', TRUE),
(1, 5, '14:00:00', '18:00:00', TRUE),
(2, 1, '09:00:00', '11:00:00', TRUE),
(2, 2, '14:00:00', '16:00:00', TRUE),
(2, 3, '09:00:00', '12:00:00', TRUE),
(2, 4, '14:00:00', '17:00:00', TRUE),
(2, 5, '10:00:00', '14:00:00', TRUE),
(2, 6, '09:00:00', '12:00:00', TRUE),
(3, 2, '08:00:00', '10:00:00', TRUE),
(3, 3, '14:00:00', '16:00:00', TRUE),
(3, 4, '08:00:00', '12:00:00', TRUE),
(3, 5, '13:00:00', '17:00:00', TRUE),
(3, 6, '09:00:00', '13:00:00', TRUE);

-- Dữ liệu mẫu cho các cuộc hẹn
INSERT INTO appointments (coach_id, user_id, date, time, status, notes) VALUES
(1, 4, '2025-07-10', '09:00', 'confirmed', 'Cuộc hẹn tư vấn đầu tiên'),
(2, 5, '2025-07-11', '10:00', 'pending', 'Cần thảo luận về kế hoạch cai thuốc'),
(3, 6, '2025-07-12', '14:00', 'confirmed', 'Đánh giá tiến độ sau 2 tuần');

-- Dữ liệu mẫu cho các cuộc hẹn đã hoàn thành với đánh giá
INSERT INTO appointments (coach_id, user_id, date, time, status, notes, rating, review_text) VALUES
(1, 7, '2025-06-15', '10:00', 'completed', 'Đã hoàn thành buổi tư vấn', 5, 'Coach A đã giúp tôi bỏ thuốc thành công sau 15 năm hút. Phương pháp của anh rất hiệu quả và dễ thực hiện.'),
(1, 8, '2025-06-20', '14:00', 'completed', 'Đã hoàn thành buổi tư vấn', 4, 'Tôi đã giảm được 90% lượng thuốc hút sau 2 tháng làm việc với coach. Rất hài lòng với kết quả.'),
(2, 7, '2025-06-25', '09:00', 'completed', 'Đã hoàn thành buổi tư vấn', 5, 'Coach B có phương pháp tâm lý rất hiệu quả, giúp tôi vượt qua cơn thèm thuốc một cách dễ dàng.'),
(3, 9, '2025-06-30', '15:00', 'completed', 'Đã hoàn thành buổi tư vấn', 5, 'Sau 3 tháng tập luyện với coach C, chức năng phổi của tôi đã cải thiện đáng kể. Cảm ơn coach rất nhiều!');
