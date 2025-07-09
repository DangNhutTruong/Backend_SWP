-- Migration: Create daily_checkins table
-- Date: 2025-07-08

CREATE TABLE IF NOT EXISTS daily_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  checkin_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  mood_rating INT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5),
  craving_level INT NULL CHECK (craving_level >= 1 AND craving_level <= 5),
  cigarettes_avoided INT NULL DEFAULT 0 CHECK (cigarettes_avoided >= 0),
  money_saved DECIMAL(10,2) NULL DEFAULT 0.00,
  notes TEXT NULL,
  activities_done JSON NULL,
  triggers_faced JSON NULL,
  coping_strategies_used JSON NULL,
  is_smoke_free BOOLEAN NOT NULL DEFAULT TRUE,
  streak_count INT NOT NULL DEFAULT 0,
  health_improvements JSON NULL,
  motivation_level INT NULL CHECK (motivation_level >= 1 AND motivation_level <= 5),
  checkin_time TIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint to ensure one checkin per user per day
  UNIQUE KEY unique_user_daily_checkin (user_id, checkin_date),
  
  -- Indexes for better performance
  INDEX idx_user_date (user_id, checkin_date),
  INDEX idx_smoke_free (is_smoke_free),
  INDEX idx_streak_count (streak_count)
);

-- Add comments to the table
ALTER TABLE daily_checkins 
COMMENT = 'Daily check-in records for users tracking their quit smoking progress';

-- Add column comments
ALTER TABLE daily_checkins 
MODIFY COLUMN mood_rating INT NULL CHECK (mood_rating >= 1 AND mood_rating <= 5) 
COMMENT 'Mood rating from 1-5 (1: Very Bad, 2: Bad, 3: Neutral, 4: Good, 5: Excellent)',

MODIFY COLUMN craving_level INT NULL CHECK (craving_level >= 1 AND craving_level <= 5) 
COMMENT 'Craving level from 1-5 (1: No craving, 2: Mild, 3: Moderate, 4: Strong, 5: Very Strong)',

MODIFY COLUMN cigarettes_avoided INT NULL DEFAULT 0 CHECK (cigarettes_avoided >= 0)
COMMENT 'Number of cigarettes user avoided smoking today',

MODIFY COLUMN money_saved DECIMAL(10,2) NULL DEFAULT 0.00
COMMENT 'Money saved today by not smoking (in VND)',

MODIFY COLUMN notes TEXT NULL
COMMENT 'Personal notes about the day, challenges, victories, etc.',

MODIFY COLUMN activities_done JSON NULL
COMMENT 'List of alternative activities done instead of smoking',

MODIFY COLUMN triggers_faced JSON NULL
COMMENT 'List of smoking triggers encountered today',

MODIFY COLUMN coping_strategies_used JSON NULL
COMMENT 'List of coping strategies used to avoid smoking',

MODIFY COLUMN is_smoke_free BOOLEAN NOT NULL DEFAULT TRUE
COMMENT 'True if user stayed smoke-free today',

MODIFY COLUMN streak_count INT NOT NULL DEFAULT 0
COMMENT 'Current consecutive smoke-free days streak',

MODIFY COLUMN health_improvements JSON NULL
COMMENT 'Health improvements noticed today (breathing, taste, smell, etc.)',

MODIFY COLUMN motivation_level INT NULL CHECK (motivation_level >= 1 AND motivation_level <= 5)
COMMENT 'Motivation level to continue quitting (1-5)',

MODIFY COLUMN checkin_time TIME NULL
COMMENT 'Time when user checked in';
