# Hướng Dẫn Test API POST /api/packages/purchase với Postman (Phiên bản cập nhật)

## Bước 1: Chuẩn bị

1. **Khởi động server**
   ```powershell
   cd d:\SWP-DEMO01\CodeGitHub\Project-SWP391\server
   npm run dev
   ```

2. **Tạo JWT Token hợp lệ**

   Để tránh lỗi xác thực, hãy tạo một token mới bằng script:
   ```powershell
   cd d:\SWP-DEMO01\CodeGitHub\Project-SWP391\server
   npm run generate-token
   ```

   Nếu muốn sử dụng email cụ thể, thêm biến môi trường:
   ```powershell
   $env:TEST_USER_EMAIL="your-email@example.com"; npm run generate-token
   ```

   Script sẽ tạo token và hiển thị cách sử dụng trong Postman.

## Bước 2: Cài đặt Postman

Nếu chưa có Postman:
1. Tải về từ [postman.com/downloads](https://www.postman.com/downloads/)
2. Cài đặt và khởi chạy ứng dụng

## Bước 3: Tạo Request trong Postman

1. Mở Postman và nhấn nút **New** > **HTTP Request**

2. Thiết lập thông tin request:
   - Method: **POST**
   - URL: **http://localhost:5000/api/packages/purchase**

## Bước 4: Thiết lập Headers

1. Chọn tab **Headers**
2. Thêm hai header:
   ```
   Content-Type: application/json
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
   (Thay YOUR_JWT_TOKEN bằng token đã tạo ở Bước 1)

## Bước 5: Thiết lập Body

1. Chọn tab **Body**
2. Chọn **raw**
3. Chọn **JSON** từ dropdown
4. Nhập body request:

   ```json
   {
     "packageId": 2,
     "paymentMethod": "momo"
   }
   ```

## Bước 6: Gửi Request và Kiểm tra Kết quả

1. Nhấn nút **Send**
2. Phản hồi sẽ hiển thị ở phần dưới

   **Phản hồi thành công** (status 200):
   ```json
   {
     "success": true,
     "message": "Package purchased successfully",
     "data": {
       "membershipId": 123,
       "paymentId": 456,
       "packageId": 2,
       "packageName": "Premium",
       "startDate": "2025-07-02T10:30:00Z",
       "endDate": "2025-08-02T10:30:00Z",
       "status": "active",
       "price": 99000,
       "paymentMethod": "momo"
     }
   }
   ```

## Xử lý Lỗi Thường Gặp

### Lỗi 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "Bind parameters must not contain undefined",
  "data": null
}
```

**Giải pháp**:
1. Tạo token mới với script `generate-token`
2. Đảm bảo sao chép đúng token và định dạng header là `Bearer <token>`
3. Kiểm tra JWT_SECRET trong file .env khớp với secret dùng để tạo token

### Lỗi 400 Bad Request
```json
{
  "success": false,
  "message": "Package ID is required",
  "data": null
}
```

**Giải pháp**: Kiểm tra và đảm bảo body request chứa đủ các trường cần thiết.

## Test Các Trường Hợp Khác

### 1. Mua gói Free với phương thức "free"
```json
{
  "packageId": 1,
  "paymentMethod": "free"
}
```

### 2. Cố gắng mua gói Free với phương thức không phải "free"
```json
{
  "packageId": 1,
  "paymentMethod": "momo"
}
```
Kết quả kỳ vọng: Status 400 Bad Request

### 3. Phương thức thanh toán không hợp lệ
```json
{
  "packageId": 2,
  "paymentMethod": "bitcoin"
}
```
Kết quả kỳ vọng: Status 400 Bad Request

## Kiểm Tra Dữ Liệu Database

Sau khi mua gói thành công, kiểm tra các bảng:

```powershell
cd d:\SWP-DEMO01\CodeGitHub\Project-SWP391\server
npm run check-tables
```

Hoặc truy vấn trực tiếp bằng MySQL CLI:

```sql
SELECT * FROM user_memberships WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 1;
SELECT * FROM payment_transactions WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 1;
```

## Lưu ý

- Token JWT có thời hạn 1 giờ. Nếu hết hạn, tạo token mới.
- Đảm bảo server đang chạy khi test.
- Để debug, kiểm tra logs từ terminal nơi server đang chạy.
- Phương thức thanh toán hiện chỉ là mô phỏng, không thực hiện giao dịch thật.
