-- Migration script để thêm các field Authentication mới vào bảng users
-- Chạy script này trên Railway MySQL

USE `viaduct-conjunct-production-db`;

-- Kiểm tra cấu trúc bảng hiện tại
DESCRIBE users;

-- Thêm các field mới cho Authentication APIs
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER password,
ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN password_reset_token VARCHAR(255) NULL AFTER email_verification_token,
ADD COLUMN password_reset_expires DATETIME NULL AFTER password_reset_token,
ADD COLUMN refresh_token TEXT NULL AFTER password_reset_expires;

-- Verify changes
DESCRIBE users;

-- Optional: Set existing users as email verified (for backward compatibility)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

SELECT 'Migration completed successfully!' as result;
