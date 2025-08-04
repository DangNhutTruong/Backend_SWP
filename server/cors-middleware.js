import cors from 'cors';

const setupCorsMiddleware = (app) => {
    // CORS configuration
    const corsOptions = {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'https://frontend-swp.vercel.app',
            'https://your-production-domain.com'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type', 
            'Authorization', 
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        credentials: true,
        optionsSuccessStatus: 200 // For legacy browser support
    };

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Handle preflight requests
    app.options('*', cors(corsOptions));
};

export default setupCorsMiddleware;
