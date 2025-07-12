# MBBank Real Transaction Checker

## Mô tả
Script Python này tự động đăng nhập vào MBBank và kiểm tra lịch sử giao dịch thực tế để xác nhận thanh toán, thay vì việc xác nhận thủ công.

## Cách hoạt động
1. **Đăng nhập MBBank**: Script sử dụng username/password để đăng nhập vào MBBank online
2. **Lấy lịch sử giao dịch**: Tự động lấy danh sách giao dịch gần đây
3. **Tìm giao dịch thanh toán**: Lọc các giao dịch có nội dung chứa pattern "UPGRADE..."
4. **Xác minh với backend**: Gửi thông tin giao dịch đến backend để cập nhật membership

## Cài đặt

### 1. Cài đặt Python dependencies
```bash
cd server/scripts
pip install -r requirements.txt
```

### 2. Cấu hình credentials
```bash
# Copy file cấu hình mẫu
cp .env.mbbank.example .env.mbbank

# Sửa file .env.mbbank và thêm thông tin đăng nhập MBBank
nano .env.mbbank
```

### 3. Cấu hình .env.mbbank
```bash
# Backend API Configuration
BACKEND_URL=http://localhost:5000/api
CHECK_INTERVAL=300

# MBBank Credentials (REQUIRED)
MBBANK_USERNAME=your_username_here
MBBANK_PASSWORD=your_password_here
MBBANK_ACCOUNT_NUMBER=0334937028
```

## Chạy script

### Windows
```powershell
cd server\scripts
.\run_mbbank_checker.ps1
```

### Linux/Mac
```bash
cd server/scripts
chmod +x run_mbbank_checker.sh
./run_mbbank_checker.sh
```

### Chạy trực tiếp
```bash
python mbbank_real_checker.py
```

## Tính năng

### ✅ Đã implement
- Đăng nhập tự động vào MBBank
- Lấy lịch sử giao dịch trong khoảng thời gian
- Tìm kiếm giao dịch thanh toán với pattern "UPGRADE..."
- Xác minh giao dịch với backend API
- Tránh xử lý trùng lặp giao dịch
- Logging chi tiết
- Auto-retry khi có lỗi

### 🔄 Đang phát triển
- Hỗ trợ 2FA (nếu tài khoản bật 2FA)
- Webhook notification khi có thanh toán mới
- Dashboard để monitor trạng thái

## Cấu hình nâng cao

### Thời gian kiểm tra
```bash
CHECK_INTERVAL=300  # 5 phút (mặc định)
```

### Logging
```bash
LOG_LEVEL=INFO
LOG_FILE=mbbank_real_checker.log
```

## Bảo mật

### ⚠️ Lưu ý quan trọng
- **KHÔNG COMMIT** file `.env.mbbank` lên git
- Sử dụng mật khẩu mạnh cho tài khoản MBBank
- Thường xuyên kiểm tra hoạt động đăng nhập tài khoản
- Cân nhắc tạo tài khoản riêng cho việc này nếu có thể

### Recommended Security
1. Tạo user riêng trên server để chạy script
2. Giới hạn quyền truy cập file `.env.mbbank`
3. Monitor log files thường xuyên
4. Backup và encrypt file cấu hình

## Troubleshooting

### Lỗi đăng nhập
```
❌ MBBank login failed: Invalid credentials
```
- Kiểm tra username/password trong `.env.mbbank`
- Thử đăng nhập manual trên web để chắc chắn credentials đúng
- Kiểm tra tài khoản có bị khóa không

### Lỗi kết nối
```
❌ Network error during verification
```
- Kiểm tra kết nối internet
- Kiểm tra backend server có chạy không (port 5000)
- Kiểm tra firewall settings

### Lỗi 2FA
```
❌ 2FA required
```
- Script hiện tại chưa hỗ trợ 2FA
- Tạm thời tắt 2FA hoặc chờ update

## API Endpoints sử dụng

### Backend Verification
```
POST /api/payments/verify/external
{
  "tx_content": "UPGRADEPREMIUM17893591BEO6FS",
  "amount": 99000,
  "transaction_id": "TXN_123456",
  "transaction_date": "2024-12-07T10:00:00",
  "bank_account": "0334937028",
  "reference_number": "REF123"
}
```

## Monitoring

### Log files
- `mbbank_real_checker.log`: Chi tiết hoạt động của script
- Console output: Real-time status

### Status indicators
- 🔄 Processing
- ✅ Success
- ❌ Error
- ⚠️ Warning
- 💤 Waiting

## Support

Nếu có vấn đề, hãy:
1. Kiểm tra log files
2. Thử chạy với LOG_LEVEL=DEBUG
3. Kiểm tra network connectivity
4. Verify MBBank credentials manually
