# Hướng Dẫn Kiểm Tra API Mua/Nâng Cấp Gói Thành Viên

## Giới thiệu

Tài liệu này hướng dẫn cách kiểm tra API `POST /api/packages/purchase` cho chức năng mua hoặc nâng cấp gói thành viên trong dự án NoSmoke.

## Cấu trúc Database

API này sử dụng các bảng sau trong database:

1. `users` - Thông tin người dùng
2. `package` - Danh sách các gói thành viên
3. `user_memberships` - Lưu trữ gói thành viên đã mua của người dùng
4. `payment_transactions` - Lưu trữ các giao dịch thanh toán

## Chuẩn bị

1. Khởi động server:
   ```
   cd server
   npm run dev
   ```

2. Chuẩn bị token xác thực:
   - Đăng nhập vào hệ thống để lấy JWT token
   - Hoặc sử dụng API đăng nhập để lấy token

## Kiểm tra Database

Kiểm tra các bảng đã được tạo chưa:

```
npm run check-tables
```

## Kiểm tra API Mua Gói

### Sử dụng Script Test

1. Mở file `server/src/scripts/test-purchase-package.js`
2. Cập nhật TOKEN, packageId và paymentMethod theo nhu cầu
3. Chạy script:
   ```
   npm run test-purchase
   ```

### Sử dụng API Client (Postman, cURL, v.v.)

#### Yêu cầu (Request)

```
POST http://localhost:5000/api/packages/purchase
Headers:
  - Content-Type: application/json
  - Authorization: Bearer YOUR_TOKEN

Body:
{
  "packageId": 2,
  "paymentMethod": "momo"
}
```

#### Phương thức thanh toán hợp lệ:

- `"momo"`
- `"vnpay"`
- `"credit_card"`
- `"bank_transfer"`
- `"free"` (chỉ áp dụng cho gói miễn phí)

#### Phản hồi (Response)

```json
{
  "success": true,
  "message": "Package purchased successfully",
  "data": {
    "membershipId": 123,
    "paymentId": 456,
    "packageId": 2,
    "packageName": "Premium",
    "startDate": "2025-07-02T10:00:00.000Z",
    "endDate": "2025-08-02T10:00:00.000Z",
    "status": "active",
    "price": 99000,
    "paymentMethod": "momo"
  }
}
```

## Kiểm tra Kết Quả trong Database

Sau khi mua gói, kiểm tra dữ liệu đã được lưu vào database:

### Kiểm tra bảng user_memberships

```sql
SELECT * FROM user_memberships WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 1;
```

### Kiểm tra bảng payment_transactions

```sql
SELECT * FROM payment_transactions WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 1;
```

## Lưu ý

- Gói cũ (nếu có) sẽ tự động bị hủy khi mua gói mới
- Ngày kết thúc được tính dựa trên thời hạn của gói (tháng/năm)
- Gói miễn phí (Free) chỉ được sử dụng với phương thức thanh toán "free"
- API này cần xác thực JWT token hợp lệ
