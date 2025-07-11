# 🔧 PowerShell Guide - NoSmoke App

## 📋 Available PowerShell Scripts

### 🚀 Development Mode

```powershell
.\run-dev.ps1
```

- Chạy cả backend (port 5000) và frontend (port 3000) đồng thời
- Tự động cài dependencies nếu chưa có
- Sử dụng concurrently để chạy parallel

### 🖥️ Backend Only

```powershell
.\start-backend.ps1
```

- Chỉ chạy backend server trên port 5000
- Hữu ích khi test API hoặc develop backend

### 📦 Install All Dependencies

```powershell
.\install-all.ps1
```

- Cài đặt tất cả dependencies cho root, server, và client
- Chạy script này trước khi bắt đầu development

### 🏭 Production Mode

```powershell
.\run-prod.ps1
```

- Build frontend và chạy server production
- Sử dụng khi deploy lên server

## ⚡ Quick Commands

### Manual Commands (Alternative)

```powershell
# Install dependencies
npm install
cd server; npm install; cd ..
cd client; npm install; cd ..

# Run development (với concurrently)
npm run dev

# Run backend only
cd server
npm run dev
cd ..

# Run frontend only
cd client
npm run dev
cd ..
```

## 🐛 Troubleshooting

### ❌ Error: Execution Policy

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Error: Concurrently not found

```powershell
npm install concurrently --save-dev
```

### ❌ Error: Dependencies missing

```powershell
.\install-all.ps1
```

### ❌ Error: Port already in use

```powershell
# Kiểm tra port đang sử dụng
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process bằng PID
taskkill /PID <PID> /F
```

## 📌 Important Notes

- **PowerShell vs CMD**: Scripts này chỉ hoạt động với PowerShell, không phải Command Prompt
- **Execution Policy**: Có thể cần set execution policy để chạy .ps1 files
- **Node.js Required**: Đảm bảo đã cài Node.js và npm
- **Environment Variables**: File .env phải có trong thư mục server

## 🔗 URLs After Start

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🆚 PowerShell vs Bash Differences

| Bash                 | PowerShell                  |
| -------------------- | --------------------------- |
| `&&`                 | `&&` (works in npm scripts) |
| `cd folder; command` | `cd folder && command`      |
| `$?`                 | `$LASTEXITCODE`             |
| `export VAR=value`   | `$env:VAR = "value"`        |
