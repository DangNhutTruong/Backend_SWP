/**
 * SQL script to update blog_post table schema
 * Run this to modify existing table structure to support larger images
 */

-- Update thumbnail_url column to LONGTEXT to support base64 images
ALTER TABLE blog_post 
MODIFY COLUMN thumbnail_url LONGTEXT DEFAULT NULL;
