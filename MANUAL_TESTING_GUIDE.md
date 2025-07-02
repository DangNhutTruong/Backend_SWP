# 🧪 Manual Testing Guide - NoSmoke Application

**Ngày tạo**: ${new Date().toLocaleDateString('vi-VN')}  
**Phiên bản**: 1.0  
**Mục đích**: Hướng dẫn test manual toàn bộ hệ thống từ backend đến frontend

---

## 🚀 **Bước 1: Khởi động Backend Server**

### 1.1 Preparation

```bash
# 1. Mở PowerShell/Command Prompt
# 2. Navigate to server directory
cd c:\Users\ADMIN\Documents\GitHub\Backend_SWP\server

# 3. Check .env file exists
# Nếu không có, tạo file .env với nội dung:
```

**File .env cần có:**

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 1.2 Start Server

```bash
# Option 1: Sử dụng script tự động
test-startup.bat

# Option 2: Manual start
npm install
npm start
```

### 1.3 Verify Server is Running

**Mở browser và kiểm tra:**

- `http://localhost:5000/health` - Should return JSON with status: "OK"
- `http://localhost:5000/api/test/health` - Comprehensive health check
- `http://localhost:5000/api/test/database` - Database connection test

**Expected Response:**

```json
{
  "status": "OK",
  "message": "NoSmoke API is running",
  "timestamp": "2025-01-02T...",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🌐 **Bước 2: Khởi động Frontend**

### 2.1 Open New Terminal

```bash
# Navigate to client directory
cd c:\Users\ADMIN\Documents\GitHub\Backend_SWP\client

# Install dependencies and start
npm install
npm run dev
```

### 2.2 Verify Frontend is Running

- **URL**: `http://localhost:5173`
- **Expected**: Home page loads với navigation header
- **Check**: Console không có errors

---

## 🧪 **Bước 3: End-to-End Testing**

### 3.1 Automated E2E Test

1. Vào `http://localhost:5173/e2e-test`
2. Click **"🚀 Run All Tests"**
3. Quan sát kết quả:
   - ✅ Backend Health Check
   - ✅ API Endpoints Access
   - ✅ User Registration
   - ✅ User Login
   - ✅ Protected API Access
   - ✅ Database Operations
   - ✅ User Logout

### 3.2 Manual User Flow Testing

#### **Flow 1: User Registration**

1. Vào `http://localhost:5173/register`
2. Fill form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: password123
   - **Confirm Password**: password123
3. Click **"Đăng ký"**
4. **Expected**: Success message, có thể redirect hoặc show verification notice

#### **Flow 2: User Login**

1. Vào `http://localhost:5173/login`
2. Fill form:
   - **Email**: test@example.com
   - **Password**: password123
3. Click **"Đăng nhập"**
4. **Expected**:
   - Success login
   - Redirect to home page
   - Header shows user info/logout button

#### **Flow 3: Protected Routes**

**Test sau khi login:**

1. `/profile` - User profile page ✅
2. `/progress` - Progress tracking ✅
3. `/membership` - Membership packages ✅
4. `/book-appointment` - Coach booking ✅
5. `/notification` - Notifications ✅
6. `/settings` - User settings ✅

**Test without login:**

1. Visit protected routes
2. **Expected**: Redirect to `/login`

#### **Flow 4: API Integration**

1. Vào `http://localhost:5173/connection-test`
2. Test các API calls:
   - Load packages
   - Load achievements
   - Load coaches
   - User profile operations

#### **Flow 5: Error Handling**

1. **Network Error**: Stop backend server, try to login
2. **Invalid Data**: Submit forms với invalid data
3. **Unauthorized**: Access protected APIs without login
4. **Expected**: Proper error messages, no crashes

---

## 🗄️ **Bước 4: Database Verification**

### 4.1 API-based Database Test

```bash
# Test database via API
curl http://localhost:5000/api/test/database

# Test specific endpoints
curl http://localhost:5000/api/packages
curl http://localhost:5000/api/achievements
curl http://localhost:5000/api/coaches
```

### 4.2 Direct Database Check (nếu có access)

```sql
-- Check if tables exist
SHOW TABLES;

-- Check user data
SELECT COUNT(*) FROM users;
SELECT * FROM users LIMIT 5;

-- Check reference data
SELECT COUNT(*) FROM packages;
SELECT COUNT(*) FROM achievements;
SELECT COUNT(*) FROM coaches;
```

### 4.3 Railway Database (nếu sử dụng)

1. Login to Railway dashboard
2. Go to your database service
3. Use Query tab hoặc connect via client
4. Run basic queries to verify data

---

## 🔐 **Bước 5: Authentication Flow Testing**

### 5.1 Registration Flow

```bash
# Test registration API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test123@example.com",
    "password": "password123",
    "fullName": "Test User",
    "confirmPassword": "password123"
  }'
```

### 5.2 Login Flow

```bash
# Test login API
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "password123"
  }'
```

### 5.3 Protected API Access

```bash
# Test protected endpoint (replace TOKEN với token từ login)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5000/api/auth/profile
```

---

## 📱 **Bước 6: Frontend UI/UX Testing**

### 6.1 Navigation Testing

- [ ] Header navigation links work
- [ ] Footer links work
- [ ] Breadcrumb navigation
- [ ] Back/forward browser buttons

### 6.2 Form Testing

- [ ] Registration form validation
- [ ] Login form validation
- [ ] Profile update form
- [ ] Appointment booking form
- [ ] Error message display
- [ ] Success message display

### 6.3 Responsive Design

- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Navigation collapse on mobile

### 6.4 Performance Testing

- [ ] Page load times < 3 seconds
- [ ] API response times < 2 seconds
- [ ] No memory leaks in console
- [ ] No JavaScript errors

---

## 🚨 **Troubleshooting Common Issues**

### Issue 1: Server Won't Start

**Symptoms**: `npm start` fails
**Solutions**:

```bash
# Check Node.js version
node --version  # Should be >= 16

# Clear node_modules
rm -rf node_modules
npm install

# Check .env file
cat .env  # Verify all required variables

# Check port availability
netstat -an | findstr :5000
```

### Issue 2: Database Connection Failed

**Symptoms**: Database test fails
**Solutions**:

```bash
# Check environment variables
echo $DATABASE_URL

# Test with simple connection
node -e "import('./src/config/database.js').then(db => db.testConnection())"

# Verify Railway connection (if using Railway)
# Check Railway dashboard for correct connection string
```

### Issue 3: Frontend Can't Connect to Backend

**Symptoms**: API calls return CORS errors
**Solutions**:

1. Verify backend is running on port 5000
2. Check CORS configuration in `server/src/app.js`
3. Verify `CLIENT_URL` in `.env`
4. Check `apiService.js` baseURL

### Issue 4: Authentication Issues

**Symptoms**: Login fails or protected routes don't work
**Solutions**:

1. Check JWT secret in `.env`
2. Verify token storage in localStorage
3. Check token format in API calls
4. Test with Postman/curl

---

## ✅ **Test Completion Checklist**

### Backend Tests

- [ ] Server starts successfully
- [ ] Health endpoint responds
- [ ] Database connection works
- [ ] All API routes accessible
- [ ] Authentication flow works
- [ ] CRUD operations work
- [ ] Error handling proper

### Frontend Tests

- [ ] Application loads
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] API integration works
- [ ] Error boundaries catch crashes
- [ ] Protected routes redirect properly
- [ ] User state persists

### Integration Tests

- [ ] End-to-end user flows work
- [ ] Data flows from frontend to backend
- [ ] Authentication state syncs
- [ ] Error handling across layers
- [ ] Performance acceptable
- [ ] No critical bugs

### Business Logic Tests

- [ ] User registration complete
- [ ] Profile management works
- [ ] Package selection works
- [ ] Coach booking works
- [ ] Progress tracking works
- [ ] Notification system works

---

## 📊 **Test Results Template**

**Test Date**: ******\_\_\_******  
**Tester**: ******\_\_\_******  
**Environment**: Development

### Backend Status

- [ ] ✅ Server startup: PASS/FAIL
- [ ] ✅ Database connection: PASS/FAIL
- [ ] ✅ API endpoints: \_\_\_/15 working
- [ ] ✅ Authentication: PASS/FAIL

### Frontend Status

- [ ] ✅ Application load: PASS/FAIL
- [ ] ✅ Navigation: PASS/FAIL
- [ ] ✅ Forms: PASS/FAIL
- [ ] ✅ API integration: PASS/FAIL

### Critical Issues Found

1. ***
2. ***
3. ***

### Overall Assessment

- [ ] 🟢 READY for production
- [ ] 🟡 NEEDS minor fixes
- [ ] 🔴 NEEDS major fixes

**Notes**:

---

---

---

---

## 🚀 **Quick Start Commands**

**Terminal 1 (Backend):**

```bash
cd server
test-startup.bat
```

**Terminal 2 (Frontend):**

```bash
cd client
npm run dev
```

**Browser Testing:**

- Backend Health: `http://localhost:5000/health`
- Frontend App: `http://localhost:5173`
- E2E Tests: `http://localhost:5173/e2e-test`
- Connection Test: `http://localhost:5173/connection-test`

---

_Happy Testing! 🎉_
