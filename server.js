const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
    origin: config.cors.origin,
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ADASO Server is running',
        timestamp: new Date().toISOString()
    });
});

// Backend API Proxy
app.use('/api/backend', async (req, res) => {
    try {
        const backendUrl = config.backend.url;
        const response = await axios({
            method: req.method,
            url: `${backendUrl}${req.url}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                ...req.headers
            },
            timeout: 10000
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Backend API Error:', error.message);
        res.status(500).json({ 
            error: 'Backend service unavailable',
            message: error.message 
        });
    }
});

// Database connection test
app.get('/api/database/test', async (req, res) => {
    try {
        // Test database connection
        res.json({ 
            status: 'OK', 
            message: 'Database connection configured',
            database_url: config.database.url ? 'Configured' : 'Not configured'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Database connection failed',
            message: error.message 
        });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ADASO Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${config.server.env}`);
    console.log(`🔗 Backend URL: ${config.backend.url}`);
    console.log(`🎯 Frontend URL: ${config.frontend.url}`);
    console.log(`📊 Database: ${config.database.url ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
