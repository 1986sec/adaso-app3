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
        secret: 'adaso_super_secret_key_2024'
    },
    
    // CORS Configuration
    cors: {
        origin: 'https://adaso.net'
    }
};

module.exports = config;
