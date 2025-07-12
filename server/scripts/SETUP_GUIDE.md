# 🔧 Hướng dẫn Setup MBBank Real Checker

## ⚠️ **QUAN TRỌNG**: Hiện tại script chưa thể login được vì:

1. **Chưa có credentials thật của bạn**
2. **MBBank API có thể cần thêm xác thực**
3. **Có thể cần captcha hoặc 2FA**

## 📋 **Các bước để setup:**

### Bước 1: Cài đặt Python
```bash
# Tải Python từ https://python.org
# Hoặc từ Microsoft Store
# Đảm bảo check "Add to PATH" khi cài

# Kiểm tra Python đã cài:
python --version
# hoặc
py --version
```

### Bước 2: Cài đặt dependencies
```bash
cd server\scripts
pip install requests python-dotenv beautifulsoup4
```

### Bước 3: Tạo file credentials
```bash
# Copy template
copy .env.mbbank.example .env.mbbank

# Sửa file .env.mbbank và thêm thông tin thật:
MBBANK_USERNAME=your_real_username
MBBANK_PASSWORD=your_real_password
MBBANK_ACCOUNT_NUMBER=0334937028
```

### Bước 4: Test kết nối
```bash
python test_mbbank_api.py
```

### Bước 5: Chạy checker thật
```bash
python mbbank_real_checker.py
```

## 🤔 **Các phương án thay thế nếu API không hoạt động:**

### Phương án 1: Web Scraping với Selenium
```python
# Sử dụng Selenium để mô phỏng trình duyệt
# Tự động đăng nhập và lấy transaction history
# Cần cài Chrome/Firefox driver
```

### Phương án 2: SMS/Email Notifications
```python
# Theo dõi SMS hoặc email notifications từ MBBank
# Parse nội dung để lấy thông tin giao dịch
```

### Phương án 3: Manual Webhook
```python
# Tạo endpoint để bạn manually report payment
# Khi nhận được tiền, bạn call API để confirm
```

### Phương án 4: QR Code Tracking
```python
# Track QR code generation và match với giao dịch
# Kết hợp với manual confirmation
```

## 🔒 **Security Notes:**

1. **KHÔNG BAO GIỜ** commit file `.env.mbbank` lên git
2. **SỬ DỤNG MẬT KHẨU MẠNH** cho tài khoản MBBank
3. **BẬT 2FA** nếu có thể (nhưng có thể làm script phức tạp hơn)
4. **MONITOR TÀI KHOẢN** thường xuyên để phát hiện truy cập bất thường
5. **CÂN NHẮC TẠO TÀI KHOẢN RIÊNG** cho mục đích này nếu có thể

## 🛠️ **Troubleshooting:**

### Lỗi "Python was not found"
```bash
# Cài Python từ python.org
# Hoặc sử dụng py thay vì python:
py test_mbbank_api.py
```

### Lỗi "MBBank login failed"
- Kiểm tra username/password đúng chưa
- MBBank có thể require captcha
- Có thể cần 2FA
- API endpoints có thể đã thay đổi

### Lỗi "Network error"
- Kiểm tra internet connection
- MBBank có thể block automated requests
- Thử với VPN nếu cần

## 🎯 **Recommended Approach:**

**Cho production sớm:**
1. Giữ manual confirmation như hiện tại
2. Log tất cả QR codes và amounts
3. Tạo admin dashboard để track payments

**Cho tương lai:**
1. Research MBBank API chi tiết hơn
2. Implement web scraping backup
3. Tích hợp với SMS/email notifications
4. Tạo webhook cho mobile app notifications

## 💡 **Alternative: Manual Tracking System**

Thay vì auto-login MBBank, bạn có thể:

1. **Tạo admin page** để manually confirm payments
2. **Log tất cả payment requests** với timestamps
3. **Match manually** khi check MBBank
4. **Tự động expire** payments sau 24h
5. **Send notifications** khi có payment mới

Điều này an toàn hơn và dễ implement hơn!

---

**⚡ TÓM LẠI:** Script hiện tại chỉ là template. Để hoạt động thật, cần:
1. Credentials thật của bạn
2. Research thêm về MBBank API
3. Hoặc chuyển sang phương án manual tracking
