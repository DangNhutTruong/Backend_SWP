const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com/api' 
    : 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
};

export default API_CONFIG;
