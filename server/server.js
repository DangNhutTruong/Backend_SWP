import app from './src/app.js';
import { testConnection } from './src/config/database.js';

const PORT = process.env.PORT || 5000;

// Add health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server without database sync
const startServer = async () => {
    try {
        // Test database connection first
        await testConnection();
        
        const server = app.listen(PORT, () => {
            console.log('\n🎉 ===== SERVER STARTED SUCCESSFULLY ===== 🎉');
            console.log(`🚀 NoSmoke API Server running on port ${PORT}`);
            console.log(`📱 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`� Using direct MySQL connection (no auto-sync)`);
            console.log('============================================\n');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                console.log('Process terminated');
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received. Shutting down gracefully...');
            server.close(() => {
                console.log('Process terminated');
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
