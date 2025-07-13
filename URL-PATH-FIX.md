# Sửa lỗi đường dẫn API không chính xác

## Vấn đề đã xác định

Khi gửi request từ Postman đến endpoint `/api/appointments-update/147/status`, nhận được lỗi 404 Not Found với thông báo:

```
Route POST /api/appointments-update/147/status not found
```

## Nguyên nhân

**Đường dẫn API không chính xác:**

1. URL đang sử dụng: `/api/appointments-update/147/status` ❌
   - Có `s` ở cuối `appointments`
   - Sử dụng dấu gạch ngang (`-`)

2. URL đúng theo cấu hình server: `/api/appointment-update/147/status` ✅
   - Không có `s` ở `appointment`
   - Vẫn sử dụng dấu gạch ngang (`-`)

## Cách sửa lỗi

### 1. Sửa URL trong request Postman

Thay đổi URL từ:
```
http://localhost:5000/api/appointments-update/147/status
```

Thành:
```
http://localhost:5000/api/appointment-update/147/status
```

### 2. Kiểm tra và sửa trong code frontend

Xem file `coachApiIntegration.js`, đảm bảo đường dẫn API là chính xác:

```javascript
// Từ
const fullUrl = `${apiBaseUrl}/api/appointments-update/${appointmentId}/status`;

// Thành
const fullUrl = `${apiBaseUrl}/api/appointment-update/${appointmentId}/status`;
```

### 3. Kiểm tra cấu hình route trong server

Route đã được cấu hình đúng trong `app.js`:
```javascript
app.use('/api/appointment-update', createStatusRoutes());
```

## Lưu ý

- Khi làm việc với RESTful API, đường dẫn phải hoàn toàn chính xác, kể cả số ít/số nhiều và dấu gạch nối.
- Kiểm tra đường dẫn URL trong console log của frontend khi gặp lỗi 404.

## Kiểm tra sau khi sửa

1. Gửi lại request với đường dẫn đúng
2. Nếu vẫn gặp lỗi, kiểm tra logs server để biết thêm chi tiết
3. Đảm bảo server đã khởi động lại sau khi có thay đổi

## Lưu ý về RESTful API

Quy ước REST thường sử dụng tên tài nguyên ở dạng **số nhiều** (appointments), nhưng trong trường hợp này server đã cấu hình dùng `appointment-update` (số ít). Đây là điểm cần lưu ý.
