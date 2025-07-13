# Hướng dẫn khắc phục lỗi và cài đặt API Tin nhắn

## Lỗi SQL đã gặp

Lỗi ban đầu:
```
SQL Error [1064] [42000]: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'IF NOT EXISTS idx_messages_read_sender ON messages (sender_type, read_by_coach, ' at line 2
```

Nguyên nhân: Cú pháp `CREATE INDEX IF NOT EXISTS` chỉ được hỗ trợ từ MySQL 8.0 trở lên, các phiên bản cũ hơn không hỗ trợ cú pháp này.

## Các thay đổi đã thực hiện để khắc phục

1. **Đã sửa file SQL**:
   - Thay thế `CREATE INDEX IF NOT EXISTS` bằng `ALTER TABLE ... ADD INDEX`
   - Cú pháp này hoạt động trên tất cả các phiên bản MySQL phổ biến

2. **Cập nhật script JavaScript**:
   - Đã thêm xử lý lỗi `ER_DUP_KEYNAME` (lỗi khi tạo index đã tồn tại)
   - Cải thiện việc thực thi script SQL

3. **Thêm script npm**:
   - Đã thêm script `create-messages-table` vào package.json

## Cách cài đặt API Tin nhắn

### Bước 1: Tạo bảng tin nhắn trong database

Chạy lệnh sau từ thư mục server:

```bash
npm run create-messages-table
```

Hoặc khởi động lại server (bảng sẽ được tạo tự động khi server khởi động).

### Bước 2: Kiểm tra API Tin nhắn

#### 1. Lấy tin nhắn của một cuộc hẹn

```bash
curl -X GET "http://localhost:5000/api/appointments/1/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Gửi tin nhắn mới

```bash
curl -X POST "http://localhost:5000/api/appointments/1/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from coach!", "sender": "coach"}'
```

#### 3. Đánh dấu tin nhắn đã đọc

```bash
curl -X POST "http://localhost:5000/api/appointments/1/messages/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 4. Lấy số tin nhắn chưa đọc

```bash
curl -X GET "http://localhost:5000/api/messages/unread-counts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 3: Tích hợp với Frontend

Các API đã được tích hợp sẵn với Frontend thông qua file:
- `src/utils/coachApiIntegration.js`

Các function trong file này sử dụng các API tin nhắn và có cơ chế fallback về localStorage khi API chưa khả dụng.

## Gỡ lỗi nâng cao

Nếu gặp thêm lỗi khi tạo bảng hoặc index:

1. Kiểm tra phiên bản MySQL:
   ```sql
   SELECT VERSION();
   ```

2. Truy cập trực tiếp vào MySQL và thực thi từng câu lệnh SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS messages (
       id INT PRIMARY KEY AUTO_INCREMENT,
       appointment_id INT NOT NULL,
       sender_type ENUM('user', 'coach') NOT NULL,
       text TEXT NOT NULL,
       read_by_coach BOOLEAN DEFAULT FALSE,
       read_by_user BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (appointment_id) REFERENCES appointment(id) ON DELETE CASCADE
   );

   ALTER TABLE messages ADD INDEX idx_messages_appointment_id (appointment_id);
   ALTER TABLE messages ADD INDEX idx_messages_read_sender (sender_type, read_by_coach, read_by_user);
   ```

3. Nếu gặp lỗi foreign key, kiểm tra xem bảng `appointment` đã tồn tại chưa:
   ```sql
   SHOW TABLES LIKE 'appointment';
   ```
