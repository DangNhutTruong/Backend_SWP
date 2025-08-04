-- Script SQL for creating coach assignment and session tables

-- Table for coach assignments
CREATE TABLE IF NOT EXISTS coach_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID of the user (client)',
    coach_id INT NOT NULL COMMENT 'ID of the coach',
    start_date DATE NOT NULL COMMENT 'When the assignment starts',
    next_session DATE COMMENT 'Date of the next scheduled session',
    sessions_completed INT DEFAULT 0 COMMENT 'Number of completed sessions',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_assignment (user_id, status) -- Ensure a user can only have one active assignment
);

-- Table for individual coaching sessions
CREATE TABLE IF NOT EXISTS coach_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT COMMENT 'Reference to the coach_assignment this session belongs to',
    coach_id INT NOT NULL,
    user_id INT NOT NULL,
    session_date DATE NOT NULL,
    duration INT COMMENT 'Duration in minutes',
    rating DECIMAL(2,1) DEFAULT NULL CHECK (rating BETWEEN 1 AND 5 OR rating IS NULL),
    notes TEXT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES coach_assignments(id) ON DELETE SET NULL,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some sample data for testing
-- Insert sample data only if tables are empty
INSERT INTO coach_assignments (user_id, coach_id, start_date, next_session, sessions_completed, status)
SELECT 2, 1, '2023-07-15', '2023-08-05', 2, 'active'
WHERE NOT EXISTS (SELECT 1 FROM coach_assignments LIMIT 1);

INSERT INTO coach_sessions (assignment_id, coach_id, user_id, session_date, duration, rating, notes, status)
SELECT 
    (SELECT id FROM coach_assignments WHERE user_id = 2 AND coach_id = 1 LIMIT 1),
    1, 2, '2023-07-20', 45, 4.5, 'Discussion about smoking cessation strategies in the first month', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM coach_sessions LIMIT 1);

INSERT INTO coach_sessions (assignment_id, coach_id, user_id, session_date, duration, rating, notes, status)
SELECT 
    (SELECT id FROM coach_assignments WHERE user_id = 2 AND coach_id = 1 LIMIT 1),
    1, 2, '2023-07-28', 30, 4.8, 'Follow-up session, progress review', 'completed'
WHERE EXISTS (SELECT 1 FROM coach_sessions LIMIT 1) AND (SELECT COUNT(*) FROM coach_sessions) = 1;
