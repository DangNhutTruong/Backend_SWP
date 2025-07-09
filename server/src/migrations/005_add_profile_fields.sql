-- Migration to add profile fields to users table
ALTER TABLE users 
ADD COLUMN name VARCHAR(100),
ADD COLUMN phone VARCHAR(15),
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender ENUM('male', 'female', 'other'),
ADD COLUMN address VARCHAR(255);
