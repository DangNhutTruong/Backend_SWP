-- SQL script to create messages table for coach messaging system

-- Create the messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    sender_type ENUM('user', 'coach') NOT NULL,
    text TEXT NOT NULL,
    read_by_coach BOOLEAN DEFAULT FALSE,
    read_by_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE
);

-- Add basic indexes (bỏ qua lỗi nếu index đã tồn tại)
-- MySQL 8.0+ hỗ trợ IF NOT EXISTS, nhưng các phiên bản cũ hơn không hỗ trợ
-- Chúng ta có thể thêm các khối TRY-CATCH trong Node.js để xử lý lỗi

-- Index cho appointment_id
ALTER TABLE messages ADD INDEX idx_messages_appointment_id (appointment_id);

-- Index cho read status và sender
ALTER TABLE messages ADD INDEX idx_messages_read_sender (sender_type, read_by_coach, read_by_user);

-- Sample message data for testing (uncomment to use)
-- INSERT INTO messages (appointment_id, sender_type, text, read_by_coach, read_by_user) VALUES
-- (1, 'user', 'Hello coach, I have a question about my upcoming appointment.', FALSE, TRUE),
-- (1, 'coach', 'Hi there! How can I help you?', TRUE, FALSE),
-- (1, 'user', 'I need to reschedule for next week if possible.', FALSE, TRUE),
-- (2, 'coach', 'Welcome to your coaching session! Let me know if you have any questions.', TRUE, FALSE),
-- (2, 'user', 'Thank you! I''m looking forward to our session.', FALSE, TRUE);
