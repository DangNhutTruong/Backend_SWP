# 🧪 CHECKLIST TEST TOÀN BỘ HỆ THỐNG

## 🔧 PRE-TEST SETUP

### 1. Khởi động Backend

```bash
cd server
node server.js
# Expect: "🎉 SERVER STARTED SUCCESSFULLY"
# Expect: "✅ MySQL Database connected successfully!"
```

### 2. Khởi động Frontend

```bash
cd client
npm run dev
# Expect: "Local: http://localhost:5173/"
```

## 📋 MAIN FUNCTIONALITY TESTS

### 🔐 Authentication System

- [ ] **Health Check**: `http://localhost:5000/health`

  - Expected: `{"status":"OK","message":"NoSmoke API is running"}`

- [ ] **User Registration**: `/register`

  - Test: Tạo tài khoản mới
  - Expected: Success message, không auto-login

- [ ] **User Login**: `/login`

  - Test: Đăng nhập với tài khoản vừa tạo
  - Expected: Redirect, user state updated, token in localStorage

- [ ] **User Logout**: Click logout button
  - Expected: Clear user state, clear localStorage, redirect to home

### 👤 User Management

- [ ] **User Profile**: `/profile` (after login)

  - Test: View profile information
  - Expected: Display user data from database

- [ ] **Update Profile**: Edit profile form
  - Test: Change user information
  - Expected: Data saved to database

### 📊 Core Features

- [ ] **Progress Page**: `/progress`

  - Test: View progress dashboard
  - Expected: Charts and progress data

- [ ] **Journey Stepper**: `/journey`

  - Test: Step-by-step quit smoking guide
  - Expected: Interactive stepper component

- [ ] **Membership Packages**: `/membership`
  - Test: View available packages
  - Expected: Package list from database

### 🏆 Achievement System

- [ ] **Achievements Page**: Test achievement display
  - Expected: Achievement list from backend

### 👨‍⚕️ Coach Features

- [ ] **Coach List**: Test coach directory

  - Expected: Coach profiles from database

- [ ] **Book Appointment**: Test appointment booking
  - Expected: Appointment saved to database

### 💳 Payment System

- [ ] **Payment Page**: `/pay`

  - Test: Payment form
  - Expected: Payment processing

- [ ] **Payment Success**: `/payment-success`
  - Test: Confirmation page
  - Expected: Payment confirmation

### 🔔 Notifications

- [ ] **Notification Page**: `/notifications`

  - Test: User notifications
  - Expected: Notification list from database

- [ ] **Mark as Read**: Test notification interaction
  - Expected: Status updated in database

### ⚙️ Settings

- [ ] **Settings Page**: `/settings`

  - Test: User preferences
  - Expected: Settings from database

- [ ] **Update Settings**: Test settings modification
  - Expected: Settings saved to database

## 🛣️ Navigation & Routing Tests

### Public Routes (no auth required)

- [ ] **Home**: `/`
- [ ] **About**: `/about`
- [ ] **Blog**: `/blog`
- [ ] **Contact**: `/contact`
- [ ] **Demo**: `/backend-demo`

### Protected Routes (auth required)

- [ ] **User Dashboard**: `/user`
- [ ] **Profile**: `/profile`
- [ ] **Progress**: `/progress`
- [ ] **Journey**: `/journey`
- [ ] **Plans**: `/plan`

### Role-Based Routes

- [ ] **Coach Dashboard**: `/coach` (coach role only)
- [ ] **Coach Bookings**: `/coach/bookings` (coach role only)

## 🔗 API Integration Tests

### Backend API Endpoints

- [ ] **Auth APIs**:

  - `POST /api/auth/register`
  - `POST /api/auth/login`

- [ ] **User APIs**:

  - `GET /api/users/profile`
  - `PUT /api/users/profile`

- [ ] **Package APIs**:

  - `GET /api/packages`
  - `GET /api/packages/:id`

- [ ] **Achievement APIs**:

  - `GET /api/achievements`
  - `GET /api/achievements/user`
  - `POST /api/achievements/unlock`

- [ ] **Progress APIs**:

  - `GET /api/progress`
  - `POST /api/progress`
  - `PUT /api/progress/:id`

- [ ] **Appointment APIs**:
  - `GET /api/appointments`
  - `POST /api/appointments`
  - `PUT /api/appointments/:id`
  - `DELETE /api/appointments/:id`

## 🧩 Component Integration Tests

### Authentication Flow

- [ ] **Login Form**: Submit → API call → Success response → User state update
- [ ] **Register Form**: Submit → API call → Success message
- [ ] **Protected Route Access**: Redirect to login if not authenticated
- [ ] **Token Persistence**: Refresh page → User state restored

### Data Flow Tests

- [ ] **Package Selection**: Click package → API call → Data display
- [ ] **Progress Logging**: Submit progress → API call → Database update
- [ ] **Achievement Unlock**: Trigger achievement → API call → UI update

## 🚨 Error Handling Tests

### Network Errors

- [ ] **Backend Down**: Turn off backend → Test frontend behavior
- [ ] **Invalid Credentials**: Wrong password → Error message display
- [ ] **API Timeout**: Slow connection → Loading state → Error handling

### UI Error States

- [ ] **Form Validation**: Invalid input → Validation messages
- [ ] **Loading States**: API calls → Loading indicators
- [ ] **Error Messages**: API errors → User-friendly messages

## 📱 User Experience Tests

### Navigation

- [ ] **Header Navigation**: All menu items work
- [ ] **Footer Links**: All footer links functional
- [ ] **Back to Top**: Scroll behavior works

### Responsive Design

- [ ] **Mobile View**: Test on mobile sizes
- [ ] **Tablet View**: Test on tablet sizes
- [ ] **Desktop View**: Test on desktop sizes

### Performance

- [ ] **Page Load Speed**: All pages load quickly
- [ ] **API Response Time**: Reasonable response times
- [ ] **Memory Usage**: No memory leaks

## ✅ SUCCESS CRITERIA

### Must Pass:

- [ ] Backend starts without errors
- [ ] Frontend loads without console errors
- [ ] Authentication flow works end-to-end
- [ ] At least 80% of API endpoints functional
- [ ] Core user journeys complete successfully
- [ ] No critical security vulnerabilities

### Nice to Have:

- [ ] All advanced features working
- [ ] Perfect responsive design
- [ ] Optimal performance scores
- [ ] Comprehensive error handling

## 📊 TEST REPORT TEMPLATE

```
## Test Results - [Date]

### ✅ Passed: X/Y tests
### ❌ Failed: X/Y tests
### ⚠️ Issues Found:
- Issue 1: Description
- Issue 2: Description

### 🔧 Fixes Needed:
- [ ] Fix 1
- [ ] Fix 2

### 🎯 Overall Status: [READY/NEEDS_WORK/CRITICAL_ISSUES]
```

**Sử dụng checklist này để test toàn bộ hệ thống một cách có hệ thống! 📋**
