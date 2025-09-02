const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// In-memory user storage (production'da database kullanılmalı)
let users = [];
let passwordResetTokens = new Map();

// Middleware
app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ADASO Server is running',
        timestamp: new Date().toISOString()
    });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('🔍 Register isteği body:', req.body);
        console.log('🔍 Register isteği headers:', req.headers);
        
        // Hem İngilizce hem Türkçe field isimlerini destekle
        let fullName = req.body.fullName || req.body.adSoyad || req.body.ad;
        let email = req.body.email || req.body.eposta;
        let username = req.body.username || req.body.kullaniciAdi || req.body.kullanici;
        let password = req.body.password || req.body.sifre;

        // Validation
        if (!fullName || !email || !username || !password) {
            console.log('❌ Eksik alanlar - fullName:', fullName, 'email:', email, 'username:', username, 'password:', password);
            return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
        }

        if (password.length < 6) {
            console.log('❌ Şifre çok kısa:', password.length);
            return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
        }

        // Check if user already exists
        const existingUser = users.find(user => 
            user.username === username || user.email === email
        );

        if (existingUser) {
            console.log('❌ Kullanıcı zaten mevcut:', username, email);
            return res.status(400).json({ message: 'Kullanıcı adı veya e-posta zaten kullanımda' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        console.log('✅ Kullanıcı oluşturuldu:', username);

        // Create JWT token
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            config.jwt.secret,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                username: newUser.username
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔍 Login isteği body:', req.body);
        console.log('🔍 Login isteği headers:', req.headers);
        
        // Hem İngilizce hem Türkçe field isimlerini destekle
        let username = req.body.username || req.body.kullaniciAdi || req.body.kullanici;
        let password = req.body.password || req.body.sifre;

        // Validation
        if (!username || !password) {
            console.log('❌ Eksik alanlar - username:', username, 'password:', password);
            return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
        }

        // Find user
        const user = users.find(u => 
            u.username === username || u.email === username
        );

        if (!user) {
            console.log('❌ Kullanıcı bulunamadı:', username);
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Şifre hatalı:', username);
            return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }

        console.log('✅ Giriş başarılı:', username);

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            config.jwt.secret,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Giriş başarılı',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                username: user.username
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Forgot Password - Send Reset Token
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        console.log('🔍 Forgot password isteği body:', req.body);
        
        // Hem İngilizce hem Türkçe field isimlerini destekle
        let username = req.body.username || req.body.kullaniciAdi || req.body.kullanici || req.body.eposta;

        if (!username) {
            console.log('❌ Kullanıcı adı eksik');
            return res.status(400).json({ message: 'Kullanıcı adı veya e-posta gereklidir' });
        }

        // Find user
        const user = users.find(u => 
            u.username === username || u.email === username
        );

        if (!user) {
            console.log('❌ Kullanıcı bulunamadı:', username);
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        
        // Store reset token with expiration (1 hour)
        passwordResetTokens.set(resetToken, {
            userId: user.id,
            expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
        });

        console.log('✅ Reset token oluşturuldu:', username, 'token:', resetToken);

        // In production, send email here
        // For now, just return the token
        res.json({
            message: 'Şifre sıfırlama bağlantısı gönderildi',
            resetToken: resetToken // Production'da bu kaldırılmalı
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        console.log('🔍 Reset password isteği body:', req.body);
        
        // Hem İngilizce hem Türkçe field isimlerini destekle
        let resetToken = req.body.resetToken || req.body.sifirlaToken;
        let newPassword = req.body.newPassword || req.body.yeniSifre || req.body.sifre;

        if (!resetToken || !newPassword) {
            console.log('❌ Eksik alanlar - resetToken:', resetToken, 'newPassword:', newPassword);
            return res.status(400).json({ message: 'Reset token ve yeni şifre gereklidir' });
        }

        if (newPassword.length < 6) {
            console.log('❌ Şifre çok kısa:', newPassword.length);
            return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
        }

        // Check if reset token exists and is valid
        const resetData = passwordResetTokens.get(resetToken);
        if (!resetData) {
            console.log('❌ Geçersiz reset token:', resetToken);
            return res.status(400).json({ message: 'Geçersiz reset token' });
        }

        if (Date.now() > resetData.expiresAt) {
            console.log('❌ Reset token süresi dolmuş:', resetToken);
            passwordResetTokens.delete(resetToken);
            return res.status(400).json({ message: 'Reset token süresi dolmuş' });
        }

        // Find user
        const user = users.find(u => u.id === resetData.userId);
        if (!user) {
            console.log('❌ Kullanıcı bulunamadı:', resetData.userId);
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Remove reset token
        passwordResetTokens.delete(resetToken);

        console.log('✅ Şifre güncellendi:', user.username);

        res.json({ message: 'Şifre başarıyla güncellendi' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        res.json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
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
    console.log(`🔐 Local Authentication System: Active`);
});

module.exports = app;
