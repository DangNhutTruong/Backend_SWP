import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import quitPlanRoutes from './routes/quit-plans.js';
import progressRoutes from './routes/progress.js';
import achievementRoutes from './routes/achievements.js';
import packageRoutes from './routes/packages.js';
import coachRoutes from './routes/coaches.js';
import appointmentRoutes from './routes/appointments.js';
import dailyCheckinRoutes from './routes/dailyCheckins.js';
// import blogRoutes from './routes/blogs.js';
// import communityRoutes from './routes/community.js';
// import paymentRoutes from './routes/payments.js';
// import notificationRoutes from './routes/notifications.js';
// import smokingStatusRoutes from './routes/smoking-status.js';
// import settingsRoutes from './routes/settings.js';
// import dashboardRoutes from './routes/dashboard.js';
import path from 'path';

// Load environment variables --
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS ?
            process.env.ALLOWED_ORIGINS.split(',') :
            ['http://localhost:5173'];

        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);

        // Allow any localhost port for development
        if (origin && origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.includes('/auth/')) {
        console.log('Auth request body:', { ...req.body, password: '***' });
    }
    next();
});

// Test database connection
await testConnection();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'NoSmoke API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Static files for public directory (HTML test pages)
app.use(express.static(path.join(process.cwd(), 'public')));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quit-plans', quitPlanRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/daily-checkins', dailyCheckinRoutes);
// app.use('/api/appointments', appointmentRoutes);
// app.use('/api/blog', blogRoutes);
// app.use('/api/community', communityRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/smoking-status', smokingStatusRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        data: null,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    // CORS error
    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation',
            data: null
        });
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        data: process.env.NODE_ENV === 'development' ? error.stack : null,
        timestamp: new Date().toISOString()
    });
});

export default app;
