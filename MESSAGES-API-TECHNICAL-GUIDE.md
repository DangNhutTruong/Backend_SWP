# Tài liệu kỹ thuật API Messages

Tài liệu này mô tả chi tiết về cách thức hoạt động và triển khai của API tin nhắn giữa coach và user trong hệ thống.

## Cấu trúc database

### Bảng `messages`

```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
  sender_id INT NOT NULL,
  sender_type ENUM('user', 'coach') NOT NULL,
  text TEXT NOT NULL,
  read_by_user BOOLEAN DEFAULT FALSE,
  read_by_coach BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
```

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| id | INT | Khóa chính, tự động tăng |
| appointment_id | INT | ID của cuộc hẹn, khóa ngoại tham chiếu đến `appointments.id` |
| sender_id | INT | ID của người gửi (user_id hoặc coach_id) |
| sender_type | ENUM | Loại người gửi: 'user' hoặc 'coach' |
| text | TEXT | Nội dung tin nhắn |
| read_by_user | BOOLEAN | Đánh dấu tin nhắn đã được user đọc |
| read_by_coach | BOOLEAN | Đánh dấu tin nhắn đã được coach đọc |
| created_at | TIMESTAMP | Thời điểm tin nhắn được tạo |

### Bảng `appointments`

Bảng `appointments` chứa thông tin về các cuộc hẹn giữa coach và user. Mỗi tin nhắn phải thuộc về một cuộc hẹn cụ thể.

## Các API Endpoints

### 1. Lấy danh sách tin nhắn

```
GET /api/appointments/:appointmentId/messages
```

**Logic xử lý:**
1. Kiểm tra xem người dùng hiện tại (user hoặc coach) có quyền truy cập cuộc hẹn không
2. Lấy tất cả tin nhắn của cuộc hẹn đó, sắp xếp theo thời gian tạo
3. Trả về danh sách tin nhắn

**Ví dụ Response:**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": 1,
      "appointment_id": 22,
      "sender_id": 5,
      "sender_type": "user",
      "text": "Xin chào coach, tôi có một số câu hỏi về buổi hẹn sắp tới.",
      "read_by_user": true,
      "read_by_coach": false,
      "created_at": "2023-07-08T14:30:00.000Z"
    },
    {
      "id": 2,
      "appointment_id": 22,
      "sender_id": 3,
      "sender_type": "coach",
      "text": "Chào bạn, tôi sẵn sàng trả lời các câu hỏi của bạn.",
      "read_by_user": false,
      "read_by_coach": true,
      "created_at": "2023-07-08T14:32:00.000Z"
    }
  ],
  "timestamp": "2023-07-09T04:15:30.123Z"
}
```

### 2. Gửi tin nhắn mới

```
POST /api/appointments/:appointmentId/messages
```

**Body Request:**
```json
{
  "text": "Nội dung tin nhắn"
}
```

**Logic xử lý:**
1. Kiểm tra xem người dùng hiện tại (user hoặc coach) có quyền truy cập cuộc hẹn không
2. Xác định loại người gửi (user hoặc coach) và ID tương ứng
3. Tạo tin nhắn mới trong database
4. Trả về thông tin tin nhắn vừa tạo

**Ví dụ Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 3,
    "appointment_id": 22,
    "sender_id": 5,
    "sender_type": "user",
    "text": "Tôi muốn xác nhận lại thời gian buổi hẹn.",
    "read_by_user": true,
    "read_by_coach": false,
    "created_at": "2023-07-09T04:15:30.123Z"
  },
  "timestamp": "2023-07-09T04:15:30.123Z"
}
```

### 3. Đánh dấu tin nhắn đã đọc

```
POST /api/appointments/:appointmentId/messages/read
```

**Logic xử lý:**
1. Kiểm tra xem người dùng hiện tại (user hoặc coach) có quyền truy cập cuộc hẹn không
2. Xác định loại người dùng (user hoặc coach)
3. Cập nhật trạng thái đã đọc cho tất cả tin nhắn của cuộc hẹn:
   - Nếu là user: đánh dấu `read_by_user = true`
   - Nếu là coach: đánh dấu `read_by_coach = true`
4. Trả về số lượng tin nhắn đã được cập nhật

**Ví dụ Response:**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": {
    "updatedCount": 2
  },
  "timestamp": "2023-07-09T04:20:30.123Z"
}
```

## Flow hoạt động

1. **Xác thực và phân quyền:**
   - Mỗi request phải kèm theo JWT token để xác thực người dùng
   - Hệ thống kiểm tra xem người dùng có phải là user hoặc coach của cuộc hẹn không
   - Nếu không có quyền, trả về lỗi 403 Forbidden

2. **Gửi và nhận tin nhắn:**
   - User và coach chỉ có thể gửi/nhận tin nhắn trong các cuộc hẹn của họ
   - Mỗi tin nhắn lưu trữ thông tin người gửi và trạng thái đã đọc
   - Tin nhắn được sắp xếp theo thời gian tạo

3. **Đánh dấu đã đọc:**
   - Khi user/coach xem tin nhắn, hệ thống cập nhật trạng thái đã đọc
   - Hệ thống theo dõi riêng biệt trạng thái đã đọc của user và coach

## Xử lý lỗi

1. **Xác thực (401 Unauthorized):**
   - Token không hợp lệ hoặc hết hạn
   - Người dùng chưa đăng nhập

2. **Phân quyền (403 Forbidden):**
   - Người dùng không phải là user hoặc coach của cuộc hẹn

3. **Không tìm thấy (404 Not Found):**
   - Cuộc hẹn không tồn tại
   - Tin nhắn không tồn tại

4. **Lỗi database (500 Internal Server Error):**
   - Lỗi kết nối database
   - Lỗi truy vấn SQL
   - Lỗi ràng buộc khóa ngoại

## Triển khai

### Model (Message.js)

File `Message.js` định nghĩa các phương thức để tương tác với bảng `messages`:

- `findByAppointmentId(appointmentId)`: Lấy tất cả tin nhắn của một cuộc hẹn
- `create(appointmentId, senderId, senderType, text)`: Tạo tin nhắn mới
- `markAsReadByUser(appointmentId)`: Đánh dấu tin nhắn đã được user đọc
- `markAsReadByCoach(appointmentId)`: Đánh dấu tin nhắn đã được coach đọc
- `countUnreadByUser(userId)`: Đếm số tin nhắn chưa đọc của user
- `countUnreadByCoach(coachId)`: Đếm số tin nhắn chưa đọc của coach

### Controller (messageController.js)

File `messageController.js` xử lý các request API:

- `getMessages`: Xử lý request GET để lấy tin nhắn
- `createMessage`: Xử lý request POST để tạo tin nhắn mới
- `markAsRead`: Xử lý request POST để đánh dấu tin nhắn đã đọc

### Middleware (auth.js)

File `auth.js` xử lý xác thực và phân quyền:

- Xác thực token JWT
- Kiểm tra quyền truy cập cuộc hẹn

## Tối ưu hóa và mở rộng

### 1. Phân trang (Pagination)

Khi số lượng tin nhắn trong một cuộc hẹn tăng lên, nên triển khai phân trang:

```
GET /api/appointments/:appointmentId/messages?page=1&limit=20
```

### 2. Real-time Messaging

Để hỗ trợ tin nhắn real-time, nên tích hợp Socket.IO:

```javascript
// Server-side
io.on('connection', (socket) => {
  socket.on('join-appointment', (appointmentId) => {
    socket.join(`appointment-${appointmentId}`);
  });
  
  socket.on('send-message', async (message) => {
    // Lưu tin nhắn vào database
    const savedMessage = await Message.create(...);
    
    // Gửi tin nhắn đến tất cả client trong phòng
    io.to(`appointment-${message.appointmentId}`).emit('new-message', savedMessage);
  });
});
```

### 3. Tính năng phong phú hơn

- **Đính kèm file**: Cho phép gửi và nhận file đính kèm
- **Thông báo**: Gửi thông báo khi có tin nhắn mới
- **Tin nhắn đã gửi/đã nhận/đã đọc**: Hiển thị trạng thái của tin nhắn

## Lưu ý quan trọng

1. **Bảng appointments vs appointment**: Đảm bảo tất cả truy vấn và ràng buộc khóa ngoại đều trỏ đến bảng `appointments` (có 's') thay vì `appointment` (không có 's')

2. **Xử lý đồng thời**: Cần xử lý trường hợp nhiều tin nhắn được gửi cùng lúc

3. **Bảo mật**: Đảm bảo chỉ user và coach của cuộc hẹn mới có thể truy cập tin nhắn

4. **Logging**: Ghi log tất cả các hoạt động để debug khi cần thiết
