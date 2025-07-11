import app from './src/app.js';
import { testConnection } from './src/config/database.js';

const PORT = process.env.PORT || 5000;  // Changed from 3000 to 5000

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});



