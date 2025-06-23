-- SQL script to insert sample data for testing
USE SmokingCessationDB;

-- Đảm bảo đã có Role
INSERT IGNORE INTO Role (RoleID, RoleName, Description)
VALUES 
(1, 'Admin', 'Administrator with full access'),
(2, 'Coach', 'Smoking cessation coach'),
(3, 'Smoker', 'Regular user trying to quit');

-- Thêm một số người dùng (nếu chưa có)
INSERT IGNORE INTO User (Name, Email, Password, Age, Gender, Phone, RoleID, Membership, IsActive, RegisterDate)
VALUES 
('Admin User', 'admin@nosmoke.com', '$2a$10$FQarVptgmKbKJu5Z8oh7teIQ2wMIaYO1.B9JTmaYt1YrDaXk7Njmu', 35, 'Male', '0901234567', 1, 'premium', 1, NOW()),
('Coach Example', 'coach@nosmoke.com', '$2a$10$FQarVptgmKbKJu5Z8oh7teIQ2wMIaYO1.B9JTmaYt1YrDaXk7Njmu', 42, 'Female', '0909876543', 2, 'premium', 1, NOW()),
('Test User', 'user@nosmoke.com', '$2a$10$FQarVptgmKbKJu5Z8oh7teIQ2wMIaYO1.B9JTmaYt1YrDaXk7Njmu', 28, 'Male', '0912345678', 3, 'free', 1, NOW());
-- Lưu ý: Mật khẩu mẫu là '12345' đã được hash

-- Thêm kế hoạch cai thuốc mẫu
INSERT INTO QuitSmokingPlan (UserID, Title, Reason, StartDate, ExpectedQuitDate, Description, Status, SuccessRate)
VALUES 
(3, 'Kế hoạch cai thuốc 30 ngày', 'Vì sức khỏe và gia đình', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'Kế hoạch từng bước giảm số điếu thuốc hút mỗi ngày trong 30 ngày', 'In Progress', 0),
(3, 'Kế hoạch ngừng đột ngột', 'Bác sĩ khuyên nghị', DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'Dừng hút thuốc hoàn toàn từ ngày đầu tiên', 'In Progress', 50);

-- Thêm các giai đoạn kế hoạch
INSERT INTO PlanStage (PlanID, StageName, StartDate, EndDate, Description)
VALUES 
(1, 'Chuẩn bị', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'Giảm 25% số điếu thuốc hút mỗi ngày'),
(1, 'Giảm thiểu', DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY), 'Giảm 50% số điếu thuốc hút mỗi ngày'),
(1, 'Ngừng hẳn', DATE_ADD(CURRENT_DATE, INTERVAL 22 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'Dừng hút thuốc hoàn toàn');

-- Thêm dữ liệu theo dõi tiến trình
INSERT INTO ProgressTracking (PlanID, TrackingDate, Status, Note, CravingLevel)
VALUES 
(1, CURRENT_DATE, 'Good', 'Ngày đầu tiên thực hiện kế hoạch, giảm được 3 điếu thuốc', 7),
(1, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 'Neutral', 'Cảm giác thèm thuốc khá mạnh nhưng có thể kiểm soát', 8),
(2, CURRENT_DATE, 'Struggling', 'Cảm thấy khó khăn khi ngừng đột ngột', 9);

-- Thêm booking và appointment
INSERT INTO Booking (UserID, CoachUserID, BookingDate, Status)
VALUES 
(3, 2, NOW(), 'Approved');

INSERT INTO Appointment (BookingID, AppointmentDate, DurationMinutes, Location, Notes, Status)
VALUES 
(1, DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 60, 'Online Meeting', 'Buổi tư vấn đầu tiên về kế hoạch cai thuốc', 'Scheduled');
