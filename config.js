// Configuration file for ADASO application
const config = {
    // Database Configuration
    database: {
        url: 'postgresql://postgres.pcclmzqmlqdaoukppbjz:vKuyztredw38dkjs@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=disable&family=4'
    },
    
    // Backend API URL
    backend: {
        url: 'https://adaso-backend.onrender.com'
    },
    
    // Frontend URL
    frontend: {
        url: 'https://adaso.net'
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'production'
    },
    
    // JWT Configuration
    jwt: {
        secret: '2d8c37661dfdd1e04a47ad6dd40a1f69'
    },
    
    // CORS Configuration
    cors: {
        origin: ['https://adaso.net', 'https://adaso-app3.netlify.app', 'http://localhost:3000']
    }
};

module.exports = config;
