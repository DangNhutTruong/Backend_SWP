# Quit Smoking Support Platform - API Documentation

## Overview

This is a fullstack Quit Smoking Support Platform built with Node.js/Express backend and React frontend. The backend uses MySQL with Sequelize ORM and includes comprehensive APIs for user management, quit plans, progress tracking, coaching, community features, and more.

## Server Status

- **Base URL**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health
- **Status**: ✅ Running (Database connection needs configuration)

## Available API Endpoints

### 1. Authentication APIs

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user info

### 2. User Management APIs

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account
- `GET /api/users` - Get all users (Admin only)

### 3. Quit Smoking Plan APIs

- `POST /api/plans` - Create new quit plan
- `GET /api/plans` - Get user's plans
- `GET /api/plans/active` - Get active plan
- `GET /api/plans/:id` - Get specific plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan
- `GET /api/plans/templates` - Get plan templates
- `POST /api/plans/:planId/milestones/:milestoneId/complete` - Complete milestone
- `PUT /api/plans/:id/toggle` - Pause/Resume plan

### 4. Progress Tracking APIs

- `POST /api/progress` - Log daily progress
- `GET /api/progress` - Get progress history
- `GET /api/progress/:id` - Get specific progress entry
- `PUT /api/progress/:id` - Update progress entry
- `DELETE /api/progress/:id` - Delete progress entry
- `GET /api/progress/stats` - Get progress statistics
- `GET /api/progress/chart` - Get chart data

### 5. Achievement APIs

- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/user` - Get user achievements
- `POST /api/achievements/:id/unlock` - Unlock achievement
- `GET /api/achievements/categories` - Get achievement categories

### 6. Coach Management APIs

- `GET /api/coaches` - Get all coaches
- `GET /api/coaches/:id` - Get specific coach
- `PUT /api/coaches/:id/availability` - Update coach availability
- `GET /api/coaches/available` - Get available coaches

### 7. Appointment APIs

- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get user appointments
- `GET /api/appointments/:id` - Get specific appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `PUT /api/appointments/:id/status` - Update appointment status

### 8. Blog Post APIs

- `GET /api/blogs/published` - Get published blog posts
- `GET /api/blogs/categories` - Get blog categories
- `GET /api/blogs/public/:identifier` - Get blog post (public)
- `POST /api/blogs/:id/like` - Like blog post
- `POST /api/blogs` - Create blog post (Admin/Coach)
- `GET /api/blogs` - Get all blog posts (Admin/Coach)
- `PUT /api/blogs/:id` - Update blog post (Admin/Coach)
- `DELETE /api/blogs/:id` - Delete blog post (Admin/Coach)

### 9. Community Post APIs

- `GET /api/community/posts` - Get community posts
- `GET /api/community/posts/:id` - Get specific post
- `GET /api/community/posts/:id/comments` - Get post comments
- `POST /api/community/posts` - Create community post (Auth required)
- `PUT /api/community/posts/:id` - Update post (Auth required)
- `DELETE /api/community/posts/:id` - Delete post (Auth required)
- `POST /api/community/posts/:id/like` - Like post (Auth required)
- `POST /api/community/posts/:id/comments` - Add comment (Auth required)
- `PUT /api/community/comments/:commentId` - Update comment (Auth required)
- `DELETE /api/community/comments/:commentId` - Delete comment (Auth required)

### 10. Package APIs

- `GET /api/packages` - Get all packages
- `GET /api/packages/featured` - Get featured packages
- `GET /api/packages/popular` - Get popular packages
- `GET /api/packages/categories` - Get package categories
- `GET /api/packages/compare` - Compare packages
- `GET /api/packages/:id` - Get specific package
- `POST /api/packages` - Create package (Admin only)
- `PUT /api/packages/:id` - Update package (Admin only)
- `DELETE /api/packages/:id` - Delete package (Admin only)

### 11. Dashboard APIs

- `GET /api/dashboard/stats` - Get dashboard statistics (Auth required)
- `GET /api/dashboard/health-improvements` - Get health improvement timeline (Auth required)
- `GET /api/dashboard/weekly-chart` - Get weekly progress chart (Auth required)

## Database Models

### Core Models

- **User** - User accounts and profiles
- **QuitPlan** - Quit smoking plans with milestones
- **Progress** - Daily progress tracking
- **Achievement** - Achievement system
- **UserAchievement** - User-achievement relationship

### Coaching Models

- **Coach** - Coach profiles and availability
- **Appointment** - Coaching appointments

### Content Models

- **BlogPost** - Blog articles and content
- **CommunityPost** - Community discussion posts
- **CommunityComment** - Comments on community posts

### Business Models

- **Package** - Service packages and pricing
- **Payment** - Payment transactions

## Technology Stack

### Backend

- **Runtime**: Node.js v22.15.1
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Environment**: dotenv

### Features

- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (User, Coach, Admin)
- ✅ MySQL Database with Sequelize ORM
- ✅ Comprehensive API Endpoints
- ✅ Error Handling & Validation
- ✅ Security Middleware
- ✅ CORS Configuration
- ✅ Rate Limiting
- ✅ Health Check Endpoint

## Current Status

### ✅ Completed

- Monorepo structure (client/server)
- All API controllers and routes implemented
- Database models and relationships
- Authentication and authorization system
- Server configuration and middleware
- Error handling and validation
- API documentation structure

### ⚠️ Pending

- MySQL database connection setup (credentials configuration)
- Database seeding with sample data
- Payment integration (VNPay, Stripe)
- Email notifications
- File upload functionality
- API testing and validation
- Frontend integration testing

## Quick Start

1. **Install Dependencies**

   ```bash
   cd server
   npm install
   ```

2. **Configure Environment**

   ```bash
   # Update server/.env with correct MySQL credentials
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=quit_smoking_db
   ```

3. **Start Server**

   ```bash
   npm start
   # or
   node src/server.js
   ```

4. **Test API**
   ```bash
   curl http://localhost:5000/health
   ```

## Next Steps

1. **Setup MySQL Database**

   - Configure correct DB credentials in .env
   - Create database: `quit_smoking_db`
   - Run server to auto-create tables

2. **Test API Endpoints**

   - Use Postman or similar tool
   - Test authentication flow
   - Verify CRUD operations

3. **Frontend Integration**

   - Update API base URL in client
   - Test authentication flow
   - Implement UI components

4. **Add Missing Features**
   - Payment gateway integration
   - Email notifications
   - File upload for images
   - Advanced search and filtering

The backend is now complete with all major APIs implemented and ready for testing and frontend integration!
