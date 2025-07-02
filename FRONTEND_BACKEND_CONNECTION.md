# 🔗 HƯỚNG DẪN KẾT NỐI FRONTEND - BACKEND

## 🚀 Khởi động nhanh

### Cách 1: Sử dụng script tự động

```bash
# Chạy file bat để khởi động cả frontend và backend
start-full-app.bat
```

### Cách 2: Khởi động thủ công

#### Backend (Terminal 1):

```bash
cd server
node server.js
```

#### Frontend (Terminal 2):

```bash
cd client
npm run dev
```

## 📱 Truy cập ứng dụng

- **🌐 Frontend**: http://localhost:5173
- **📡 Backend**: http://localhost:5000
- **🔗 Demo kết nối**: http://localhost:5173/backend-demo
- **📊 Backend Health**: http://localhost:5000/health

## 🛠️ Cấu trúc kết nối

### 1. API Service (`client/src/services/apiService.js`)

- Quản lý tất cả API calls đến backend
- Xử lý authentication với JWT tokens
- Error handling và response processing

### 2. Auth Context (`client/src/context/AuthContext_NEW.jsx`)

- Quản lý state đăng nhập/đăng xuất
- Lưu trữ user information
- JWT token management

### 3. Custom Hook (`client/src/hooks/useAuth.js`)

- Hook để sử dụng AuthContext
- Type-safe context access

### 4. Demo Component (`client/src/components/BackendConnectionDemo.jsx`)

- Test và demo các API endpoints
- Real-time connection status
- Interactive testing interface

## 📋 Danh sách API Endpoints

### 🔐 Authentication

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập

### 👤 User Management

- `GET /api/users/profile` - Lấy thông tin profile
- `PUT /api/users/profile` - Cập nhật profile

### 📦 Packages

- `GET /api/packages` - Danh sách gói dịch vụ
- `GET /api/packages/:id` - Chi tiết gói dịch vụ

### 🏆 Achievements

- `GET /api/achievements` - Danh sách thành tựu
- `GET /api/achievements/user` - Thành tựu của user
- `POST /api/achievements/unlock` - Mở khóa thành tựu

### 📋 Quit Plans

- `GET /api/quit-plans` - Danh sách kế hoạch
- `POST /api/quit-plans` - Tạo kế hoạch mới
- `PUT /api/quit-plans/:id` - Cập nhật kế hoạch
- `DELETE /api/quit-plans/:id` - Xóa kế hoạch

### 📊 Progress Tracking

- `GET /api/progress` - Lấy tiến độ user
- `POST /api/progress` - Ghi lại tiến độ hàng ngày
- `PUT /api/progress/:id` - Cập nhật tiến độ

### 👨‍⚕️ Coaches

- `GET /api/coaches` - Danh sách huấn luyện viên
- `GET /api/coaches/:id` - Chi tiết huấn luyện viên

### 📅 Appointments

- `GET /api/appointments` - Lịch hẹn của user
- `POST /api/appointments` - Đặt lịch hẹn mới
- `PUT /api/appointments/:id` - Cập nhật lịch hẹn
- `DELETE /api/appointments/:id` - Hủy lịch hẹn

### 💳 Payments

- `GET /api/payments` - Lịch sử thanh toán
- `POST /api/payments` - Tạo thanh toán mới
- `GET /api/payments/:id` - Chi tiết thanh toán
- `PUT /api/payments/:id` - Cập nhật trạng thái thanh toán

### 🔔 Notifications

- `GET /api/notifications` - Danh sách thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `GET /api/notifications/unread-count` - Số thông báo chưa đọc

### ⚙️ Settings

- `GET /api/settings` - Cài đặt user
- `PUT /api/settings` - Cập nhật cài đặt
- `POST /api/settings/reset` - Reset cài đặt

## 🧪 Test kết nối

### 1. Truy cập Demo Page

Vào http://localhost:5173/backend-demo để test các API

### 2. Test thủ công với curl

```bash
# Health check
curl http://localhost:5000/health

# Test đăng ký
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","full_name":"Test User","role":"smoker"}'

# Test đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test với PowerShell

```powershell
# Chạy script test tự động
.\server\test-api.ps1
```

## 🔧 Troubleshooting

### Backend không khởi động được

1. Kiểm tra MySQL đang chạy
2. Kiểm tra file `.env` trong thư mục `server`
3. Chạy `npm install` trong thư mục `server`

### Frontend không kết nối được backend

1. Kiểm tra backend đang chạy trên port 5000
2. Kiểm tra CORS settings
3. Mở Developer Tools để xem lỗi console

### Lỗi Authentication

1. Xóa localStorage trong browser
2. Đăng ký tài khoản mới
3. Kiểm tra JWT token trong localStorage

## 📝 Ghi chú quan trọng

1. **Database**: Backend sử dụng MySQL database `smokingcessationsupportplatform`
2. **Authentication**: Sử dụng JWT tokens được lưu trong localStorage
3. **CORS**: Đã cấu hình cho phép localhost:5173
4. **Error Handling**: Tất cả API calls đều có error handling
5. **Loading States**: UI hiển thị loading states khi gọi API

## 🎯 Tính năng chính đã hoàn thành

✅ Kết nối backend MySQL thật
✅ Authentication với JWT
✅ API service layer hoàn chỉnh  
✅ React Context cho state management
✅ Error handling và loading states
✅ Demo interface để test
✅ CORS configuration
✅ Responsive UI components

**Backend và Frontend đã được kết nối hoàn chỉnh và sẵn sàng sử dụng!** 🎉
