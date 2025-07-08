# NoSmoke - PowerShell Commands

## 🚀 Quick Start (PowerShell)

### 1. Cài đặt Dependencies
```powershell
.\install-all.ps1
```

### 2. Chạy Development Environment
```powershell
.\run-dev.ps1
```

### 3. Chạy Production Environment
```powershell
.\run-prod.ps1
```

## 📋 Manual Commands

### Development (Từng lệnh riêng)
```powershell
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm run dev
```

### Production
```powershell
# Build frontend
cd client
npm run build

# Start backend
cd ../server
npm start
```

## 🔗 URLs
- **Frontend**: http://localhost:5175
- **Backend**: http://localhost:5000
- **API Health**: http://localhost:5000/health

## ⚠️ Lưu ý PowerShell
- PowerShell **KHÔNG** hỗ trợ `&&` operator như Bash
- Sử dụng `;` để chạy nhiều lệnh
- Hoặc sử dụng các script `.ps1` đã tạo sẵn

## 🛠️ Troubleshooting

### Port đang được sử dụng
```powershell
# Kiểm tra process đang dùng port 5000
netstat -ano | findstr :5000

# Kill process theo PID
taskkill /PID <PID> /F

# Hoặc kill tất cả node process
taskkill /F /IM node.exe
```

### Execution Policy (nếu không chạy được .ps1)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
