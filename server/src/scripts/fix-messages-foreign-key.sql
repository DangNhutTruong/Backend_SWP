-- Script SQL để sửa ràng buộc khóa ngoại cho bảng messages

-- Xóa ràng buộc khóa ngoại hiện tại
ALTER TABLE messages
DROP FOREIGN KEY messages_ibfk_1;

-- Thêm ràng buộc khóa ngoại mới liên kết với bảng appointments
ALTER TABLE messages
ADD CONSTRAINT messages_appointment_fk
FOREIGN KEY (appointment_id)
REFERENCES appointments(id)
ON DELETE CASCADE;
