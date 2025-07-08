-- Migration: Add OTP fields for email verification
-- Date: 2025-01-08

-- Add OTP columns to users table
ALTER TABLE users 
ADD COLUMN email_verification_otp VARCHAR(6) DEFAULT NULL,
ADD COLUMN email_verification_otp_expires DATETIME DEFAULT NULL;

-- Update existing users to have NULL values for new fields
UPDATE users SET 
  email_verification_otp = NULL,
  email_verification_otp_expires = NULL 
WHERE email_verification_otp IS NULL;
