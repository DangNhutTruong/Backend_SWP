# HƯỚNG DẪN KHẮC PHỤC VÀ TEST LỖI MEMBERSHIP

Tài liệu này hướng dẫn cách khắc phục và test lỗi khi API mua gói thành công nhưng không cập nhật trạng thái `membership` trong bảng `users`.

## NGUYÊN NHÂN

Dựa vào hình ảnh bảng `users` và code hiện tại, có thể xảy ra một số nguyên nhân:

1. Cột `membership` trong bảng `users` có thể là kiểu ENUM với các giá trị không bao gồm "premium"
2. Có thể xảy ra lỗi SQL khi cập nhật nhiều cột cùng lúc
3. Có thể thiếu một số cột liên quan đến membership trong bảng `users`

## CÁCH KHẮC PHỤC

### Bước 1: Kiểm tra cấu trúc bảng users

```bash
# Chạy script kiểm tra cấu trúc bảng users và cột membership
npm run check-users-membership
```

### Bước 2: Sửa định nghĩa cột membership (nếu cần)

```bash
# Chạy script sửa định nghĩa cột membership
npm run fix-membership-column
```

Script này sẽ:
- Kiểm tra và thêm cột `membership` nếu chưa có
- Đảm bảo cột `membership` là kiểu ENUM('free', 'premium')
- Đảm bảo các cột liên quan như `membership_id` và `membership_updated_at` tồn tại
- Đồng bộ giá trị giữa `membership` và `membership_id`

### Bước 3: Test mua gói với script cập nhật

```bash
# Chạy script test mua gói Premium và kiểm tra kết quả
npm run test-direct-purchase
```

Script này sẽ:
1. Kiểm tra thông tin người dùng TRƯỚC khi mua
2. Gọi API mua gói Premium
3. Kiểm tra thông tin người dùng SAU khi mua
4. So sánh giá trị `membership` và `membership_id`
5. Tự động cập nhật nếu cần thiết

## TEST THÔNG QUA API POSTMAN

### 1. Login để lấy token

```
POST http://localhost:3001/api/auth/login
Body:
{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

### 2. Mua gói Premium

```
POST http://localhost:3001/api/packages/purchase
Headers: 
  Authorization: Bearer <token_from_login>
Body:
{
  "packageId": 2,
  "paymentMethod": "momo"
}
```

### 3. Kiểm tra trạng thái gói

```
GET http://localhost:3001/api/packages/user/current
Headers: 
  Authorization: Bearer <token_from_login>
```

### 4. Kiểm tra thông tin người dùng

```
GET http://localhost:3001/api/users/profile
Headers: 
  Authorization: Bearer <token_from_login>
```

## LƯU Ý

- Nếu vẫn gặp lỗi, kiểm tra log để xác định vấn đề cụ thể
- Truy vấn trực tiếp vào database để kiểm tra giá trị trong các bảng
- Đảm bảo các bảng `package`, `user_memberships`, và `users` đồng bộ với nhau
