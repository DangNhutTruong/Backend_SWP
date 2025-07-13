# Hướng dẫn kiểm tra API đường dẫn mới `/api/appointments-update/:id/status`

Đã thực hiện cập nhật đường dẫn API từ số ít (appointment) sang số nhiều (appointments) để khớp với tên bảng trong database.

## Những thay đổi đã thực hiện

1. Tạo file route mới: `server/src/routes/appointmentsStatusRoutes.js` (thêm 's' vào tên file)
2. Cập nhật app.js để sử dụng route mới và đường dẫn mới `/api/appointments-update/:id/status` 
3. Cập nhật frontend để gọi đến đường dẫn mới
4. Cập nhật tài liệu CORS-PATCH-FIX-GUIDE.md

## Cách kiểm tra

### 1. Khởi động lại server

```powershell
# Chạy script khởi động lại server
powershell -ExecutionPolicy Bypass -File restart-server-with-new-api.ps1
```

### 2. Kiểm tra với Postman

- **URL**: http://localhost:5000/api/appointments-update/147/status
- **Method**: POST
- **Headers**:
  - Content-Type: application/json
  - Authorization: Bearer [your_token]
- **Body**:
  ```json
  {
    "status": "confirmed"
  }
  ```

### 3. Kiểm tra từ frontend

- Đăng nhập vào tài khoản coach
- Điều hướng đến trang CoachBookings
- Thử cập nhật trạng thái của một cuộc hẹn
- Mở DevTools (F12) để theo dõi network request

## Xử lý các vấn đề phổ biến

### Vấn đề: 404 Not Found

- **Nguyên nhân**: Đường dẫn API không chính xác hoặc server chưa được khởi động lại
- **Giải pháp**: Kiểm tra URL trong request và đảm bảo server đã khởi động lại với cấu hình mới

### Vấn đề: 401 Unauthorized

- **Nguyên nhân**: Token không hợp lệ hoặc đã hết hạn
- **Giải pháp**: Đăng nhập lại để lấy token mới

### Vấn đề: 400 Bad Request

- **Nguyên nhân**: Định dạng body không đúng hoặc giá trị status không hợp lệ
- **Giải pháp**: Đảm bảo status là một trong các giá trị: "pending", "confirmed", "completed", "cancelled"

## Lưu ý quan trọng

- Đường dẫn mới sử dụng tên số nhiều (`appointments-update`) để phản ánh đúng tên bảng `appointments` trong database
- RESTful API thường sử dụng tên tài nguyên ở dạng số nhiều, phù hợp với quy ước này
- Tất cả API liên quan đến appointments hiện nay đều sử dụng tên số nhiều để đảm bảo tính nhất quán
