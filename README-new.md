# 🚭 NoSmoke - Quit Smoking Support Platform

A modern web application helping users quit smoking with professional support, progress tracking, and Gmail email integration.

## ✨ Features

### 🔐 **Complete Authentication System**

- User registration with Gmail email verification
- Secure login/logout with JWT tokens
- Password reset via Gmail SMTP
- Email verification flow
- Refresh token management

### 🏥 **Health & Progress Tracking**

- Daily check-ins and progress monitoring
- Smoking cessation timeline tracking
- Achievement system
- User dashboard

### 👩‍⚕️ **Professional Support**

- Coach appointments booking
- Expert consultation features
- Professional guidance

## 🛠️ Technology Stack

**Backend:** Node.js + Express + MySQL (Railway) + Sequelize + JWT + Nodemailer  
**Frontend:** React + Vite + Context API + Modern CSS  
**Email:** Gmail SMTP integration  
**Database:** Railway MySQL Cloud

## 🚀 Quick Start

### **Prerequisites**

- Node.js 18+ and npm 8+
- Gmail account with App Password setup
- Railway MySQL database

### **Installation & Setup**

1. **Install all dependencies:**

   ```bash
   npm run install:all
   ```

2. **Configure Gmail in server/.env:**

   ```env
   # Database
   DATABASE_URL=mysql://user:pass@host:port/database

   # Gmail Configuration
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password

   # Server Config
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-secret-key
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start development servers:**

   ```bash
   # Both backend + frontend
   npm run dev

   # Or separately:
   npm run dev:backend    # http://localhost:5000
   npm run dev:frontend   # http://localhost:5173
   ```

## 📚 API Endpoints

### **Authentication**

- `POST /api/auth/register` - Register + Send verification email
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### **User Management**

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/progress` - Get user progress

### **Health & Appointments**

- `POST /api/progress/checkin` - Daily check-in
- `GET /api/appointments` - User appointments
- `POST /api/appointments` - Book appointment

## 🔧 Gmail Setup Guide

1. **Enable 2-Factor Authentication:**

   - Go to Google Account Settings
   - Security → 2-Step Verification → Enable

2. **Create App Password:**

   - Security → App passwords
   - Select app: "Other (Custom name)"
   - Enter: "NoSmoke Backend"
   - Copy the 16-character password

3. **Update .env file:**
   ```env
   EMAIL_USER=your-real-gmail@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```

## ✅ Production Ready Features

- ✅ **Gmail SMTP** - Real email sending via Google
- ✅ **Railway MySQL** - Cloud database with auto-scaling
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Email Verification** - Account activation via email
- ✅ **Password Reset** - Secure password recovery
- ✅ **React Frontend** - Modern UI with all auth pages
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Logging** - Detailed application logging
- ✅ **Responsive Design** - Mobile-friendly interface

## 🏗️ Project Structure

```
Backend_SWP/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Auth pages (Login, Register, etc.)
│   │   ├── context/        # AuthContext for state
│   │   └── styles/         # CSS styling
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # authController with all endpoints
│   │   ├── models/         # User model with auth fields
│   │   ├── routes/         # API route definitions
│   │   ├── utils/          # emailService with Gmail integration
│   │   ├── config/         # Database configuration
│   │   └── middleware/     # Authentication middleware
│   ├── .env                # Environment variables
│   └── package.json
├── package.json            # Root package with convenience scripts
└── README.md
```

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start both servers
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Production
npm run build            # Build frontend
npm run start            # Start production server

# Utilities
npm run install:all      # Install all dependencies
npm test                 # Run tests
```

## 🌐 Environment Configuration

**Development:**

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Database: Railway MySQL Cloud

**Production:**

- Set `NODE_ENV=production`
- Configure production URLs
- Use secure JWT secrets
- Enable HTTPS

## 🚀 Deployment

### **Backend (Railway/Heroku)**

1. Set environment variables on platform
2. Deploy from Git repository
3. Ensure database URL is configured

### **Frontend (Vercel/Netlify)**

1. Build: `npm run build`
2. Deploy `client/dist` folder
3. Set API base URL for production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## 📄 License

MIT License - See LICENSE file for details.

---

**🚭 Built with ❤️ to help people quit smoking and live healthier lives**

_NoSmoke Team - Making quitting smoking easier with modern technology_
