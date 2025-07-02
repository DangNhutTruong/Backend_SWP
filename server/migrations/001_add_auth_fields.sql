-- Add new columns to users table for authentication features
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Update existing users to have email_verified = FALSE by default
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;
