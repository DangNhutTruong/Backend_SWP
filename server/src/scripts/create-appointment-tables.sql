/**
 * SQL script to create appointment-related tables
 */

-- Create coach_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS coach_availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create appointment table if it doesn't exist
-- CREATE TABLE IF NOT EXISTS appointment (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   coach_id INT NOT NULL,
--   user_id INT NOT NULL,
--   appointment_time DATETIME NOT NULL,
--   duration_minutes INT NOT NULL DEFAULT 30,
--   status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL,
  smoker_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_feedback (coach_id, smoker_id),
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (smoker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for improved query performance (compatible with older MySQL versions)
-- Using conditional index creation to avoid duplicate key errors

-- For appointments table
SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'appointments' AND index_name = 'idx_appointments_coach_id');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE appointments ADD INDEX idx_appointments_coach_id (coach_id)', 'SELECT "Index idx_appointments_coach_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'appointments' AND index_name = 'idx_appointments_user_id');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE appointments ADD INDEX idx_appointments_user_id (user_id)', 'SELECT "Index idx_appointments_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'appointments' AND index_name = 'idx_appointments_status');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE appointments ADD INDEX idx_appointments_status (status)', 'SELECT "Index idx_appointments_status already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'appointments' AND index_name = 'idx_appointments_date_time');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE appointments ADD INDEX idx_appointments_date_time (date, time)', 'SELECT "Index idx_appointments_date_time already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For coach_availability table
SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'coach_availability' AND index_name = 'idx_coach_availability');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE coach_availability ADD INDEX idx_coach_availability (coach_id, day_of_week)', 'SELECT "Index idx_coach_availability already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- For feedback table
SET @IndexExists = (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'feedback' AND index_name = 'idx_feedback_coach');
SET @sql = IF(@IndexExists = 0, 'ALTER TABLE feedback ADD INDEX idx_feedback_coach (coach_id)', 'SELECT "Index idx_feedback_coach already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
