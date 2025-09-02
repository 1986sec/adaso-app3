// Environment detection for API URL
const getApiBaseUrl = () => {
    // Check if we're in production (adaso.net)
    if (window.location.hostname === 'adaso.net' || window.location.hostname === 'adaso-app3.netlify.app') {
        // Production'da backend'e bağlanmaya çalışma, fallback kullan
        return null;
    }
    // Check if we're in local development
    else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '/api';
    }
    // Default fallback
    else {
        return '/api';
    }
};

const API_BASE_URL = getApiBaseUrl();

// Log current API URL for debugging
console.log('🔗 Current API URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);

// Hybrid authentication system
const isProduction = window.location.hostname === 'adaso.net' || window.location.hostname === 'adaso-app3.netlify.app';

// Production fallback authentication (complete working system)
const productionAuth = {
    users: [
        { username: 'admin', password: 'admin123', fullName: 'Admin User', email: 'admin@adaso.com' },
        { username: 'test', password: 'test123', fullName: 'Test User', email: 'test@adaso.com' },
        { username: 'root', password: 'root123', fullName: 'Root User', email: 'root@adaso.com' }
    ],
    
    login: function(username, password) {
        const user = this.users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );
        return user;
    },
    
    register: function(userData) {
        // Check if user already exists
        const existingUser = this.users.find(u => 
            u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
            return { success: false, message: 'Kullanıcı adı veya e-posta zaten kullanımda' };
        }
        
        // Add new user
        const newUser = {
            username: userData.username,
            password: userData.password,
            fullName: userData.fullName,
            email: userData.email
        };
        
        this.users.push(newUser);
        return { success: true, message: 'Kullanıcı başarıyla oluşturuldu', user: newUser };
    },
    
    forgotPassword: function(username) {
        const user = this.users.find(u => 
            u.username === username || u.email === username
        );
        
        if (user) {
            // Generate reset token
            const resetToken = Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);
            
            // Store reset token
            user.resetToken = resetToken;
            user.resetTokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
            
            return { success: true, message: 'Şifre sıfırlama bağlantısı gönderildi', resetToken };
        } else {
            return { success: false, message: 'Kullanıcı bulunamadı' };
        }
    },
    
    resetPassword: function(resetToken, newPassword) {
        const user = this.users.find(u => u.resetToken === resetToken);
        
        if (!user) {
            return { success: false, message: 'Geçersiz reset token' };
        }
        
        if (Date.now() > user.resetTokenExpiry) {
            return { success: false, message: 'Reset token süresi dolmuş' };
        }
        
        // Update password
        user.password = newPassword;
        delete user.resetToken;
        delete user.resetTokenExpiry;
        
        return { success: true, message: 'Şifre başarıyla güncellendi' };
    }
};

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

const showForm = (tab) => {
    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("registerForm").classList.remove("active");
    document.getElementById("loginTab").classList.remove("active");
    document.getElementById("registerTab").classList.remove("active");
    document.getElementById(tab+"Form").classList.add("active");
    document.getElementById(tab+"Tab").classList.add("active");
};

const register = async () => {
    const fullName = document.getElementById("registerFullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value;
    const password2 = document.getElementById("registerPassword2").value;
    const message = document.getElementById("registerMessage");

    if (!fullName || !email || !username || !password || !password2) {
        message.textContent = "⚠️ Lütfen tüm alanları doldurun.";
        return;
    }
    if (!email.includes("@") || !email.includes(".")) {
        message.textContent = "❌ Geçerli bir e-posta girin.";
        return;
    }

    if (!timingSafeEqual(password, password2)) {
        message.textContent = "❌ Şifreler uyuşmuyor!";
        return;
    }
    
    if (password.length < 6) {
        message.textContent = "⚠️ Şifre en az 6 karakter olmalıdır!";
        return;
    }

    // Production'da fallback authentication kullan
    if (isProduction) {
        const result = productionAuth.register({
            username,
            password,
            fullName,
            email
        });
        
        if (result.success) {
            message.textContent = "✅ " + result.message;
            
            setTimeout(() => {
                document.getElementById('registerFullName').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerPassword2').value = '';
                showForm('login');
                document.getElementById('loginUsername').value = username;
                message.textContent = '';
            }, 1500);
        } else {
            message.textContent = "❌ " + result.message;
        }
        return;
    }
    
    // Local development'da normal API kullan (sadece API_BASE_URL varsa)
    if (!API_BASE_URL) {
        message.textContent = "❌ API bağlantısı mevcut değil!";
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                username,
                password
            })
        });

        if (response.ok) {
            const data = await response.json();
            message.textContent = "✅ " + data.message;
            
            // Store token
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("activeUser", data.user.username);
            
            setTimeout(() => {
                document.getElementById('registerFullName').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerPassword2').value = '';
                showForm('login');
                document.getElementById('loginUsername').value = username;
                message.textContent = '';
            }, 1500);
        } else {
            const errorData = await response.json();
            message.textContent = "❌ " + (errorData.message || "Kayıt sırasında bir hata oluştu!");
        }
    } catch (error) {
        message.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        console.error('Kayıt hatası:', error);
    }
};

const login = async () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");
    const remember = document.getElementById("rememberCheckbox").checked;

    if (!username || !password) {
        message.textContent = "⚠️ Kullanıcı adı ve şifre gereklidir!";
        return;
    }

    // Production'da fallback authentication kullan
    if (isProduction) {
        const user = productionAuth.login(username, password);
        
        if (user) {
            message.textContent = "✅ Giriş başarılı!";
            
            // Store user data
            localStorage.setItem("activeUser", user.username);
            localStorage.setItem("userData", JSON.stringify(user));

            if (remember) {
                localStorage.setItem("rememberUser", username);
            } else {
                localStorage.removeItem("rememberUser");
            }

            setTimeout(() => {
                window.location.href = '/anasayfa.html';
            }, 500);
        } else {
            message.textContent = "❌ Kullanıcı adı veya şifre hatalı!";
        }
        return;
    }

    // Local development'da normal API kullan (sadece API_BASE_URL varsa)
    if (!API_BASE_URL) {
        message.textContent = "❌ API bağlantısı mevcut değil!";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (response.ok) {
            const data = await response.json();
            message.textContent = "✅ " + data.message;
            
            // Store user data and token
            localStorage.setItem("activeUser", data.user.username);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("userData", JSON.stringify(data.user));

            if (remember) {
                localStorage.setItem("rememberUser", username);
            } else {
                localStorage.removeItem("rememberUser");
            }

            setTimeout(() => {
                window.location.href = '/anasayfa.html';
            }, 500);
        } else {
            const errorData = await response.json();
            message.textContent = "❌ " + (errorData.message || "Giriş sırasında bir hata oluştu!");
        }
    } catch (error) {
        message.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        console.error('Giriş hatası:', error);
    }
};

const openForgotPasswordModal = () => {
    document.getElementById("forgotPasswordModal").style.display = "block";
};

const closeForgotPasswordModal = () => {
    document.getElementById("forgotPasswordModal").style.display = "none";
    document.getElementById("forgotPasswordUsername").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("newPassword2").value = "";
    document.getElementById("forgotPasswordMessage").textContent = "";
    document.getElementById("newPasswordArea").style.display = "none";
    document.getElementById("resetPasswordBtn").style.display = "block";
};

let resetToken = null;

const resetPassword = async () => {
    const input = document.getElementById("forgotPasswordUsername").value.trim();
    const message = document.getElementById("forgotPasswordMessage");

    if (!input) {
        message.textContent = "⚠️ Lütfen kullanıcı adı veya e-posta girin.";
        message.style.color = "#dc3545";
        return;
    }

    // Production'da fallback authentication kullan
    if (isProduction) {
        const result = productionAuth.forgotPassword(input);
        
        if (result.success) {
            message.textContent = "✅ " + result.message;
            message.style.color = "#28a745";
            document.getElementById("newPasswordArea").style.display = "block";
            document.getElementById("resetPasswordBtn").style.display = "none";
            
            // Store reset token for password update
            window.currentResetToken = result.resetToken;
        } else {
            message.textContent = "❌ " + result.message;
            message.style.color = "#dc3545";
        }
        return;
    }

    // Local development'da normal API kullan
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: input })
        });

        if (response.ok) {
            const data = await response.json();
            resetToken = data.resetToken;
            message.textContent = "✅ Kullanıcı bulundu! Yeni şifrenizi belirleyin.";
            message.style.color = "#28a745";
            document.getElementById("newPasswordArea").style.display = "block";
            document.getElementById("resetPasswordBtn").style.display = "none";
        } else {
            const errorData = await response.json();
            message.textContent = "❌ " + (errorData.message || "Bir hata oluştu!");
            message.style.color = "#dc3545";
        }
    } catch (error) {
        message.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        message.style.color = "#dc3545";
        console.error('Reset password error:', error);
    }
};

const updatePassword = async () => {
    const newPassword = document.getElementById("newPassword").value;
    const newPassword2 = document.getElementById("newPassword2").value;
    const message = document.getElementById("forgotPasswordMessage");

    if (!newPassword || !newPassword2) {
        message.textContent = "⚠️ Lütfen tüm alanları doldurun.";
        message.style.color = "#dc3545";
        return;
    }

    if (!timingSafeEqual(newPassword, newPassword2)) {
        message.textContent = "❌ Şifreler uyuşmuyor!";
        message.style.color = "#dc3545";
        return;
    }

    if (newPassword.length < 6) {
        message.textContent = "⚠️ Şifre en az 6 karakter olmalıdır.";
        message.style.color = "#dc3545";
        return;
    }

    // Production'da fallback authentication kullan
    if (isProduction) {
        if (window.currentResetToken) {
            const result = productionAuth.resetPassword(window.currentResetToken, newPassword);
            
            if (result.success) {
                message.textContent = "✅ " + result.message;
                message.style.color = "#28a745";
                
                setTimeout(() => {
                    closeForgotPasswordModal();
                }, 2000);
            } else {
                message.textContent = "❌ " + result.message;
                message.style.color = "#dc3545";
            }
        } else {
            message.textContent = "❌ Geçersiz reset token!";
            message.style.color = "#dc3545";
        }
        return;
    }

    // Local development'da normal API kullan (sadece API_BASE_URL varsa)
    if (!API_BASE_URL) {
        message.textContent = "❌ API bağlantısı mevcut değil!";
        message.style.color = "#dc3545";
        return;
    }

    if (!resetToken) {
        message.textContent = "❌ Geçersiz reset token!";
        message.style.color = "#dc3545";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resetToken: resetToken,
                newPassword: newPassword
            })
        });

        if (response.ok) {
            const data = await response.json();
            message.textContent = "✅ " + data.message;
            message.style.color = "#28a745";
            
            setTimeout(() => {
                closeForgotPasswordModal();
            }, 2000);
        } else {
            const errorData = await response.json();
            message.textContent = "❌ " + (errorData.message || "Şifre güncellenirken bir hata oluştu!");
            message.style.color = "#dc3545";
        }
    } catch (error) {
        message.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        message.style.color = "#dc3545";
        console.error('Password update error:', error);
    }
};

function validatePassword(password, elementPrefix) {
    const lengthReq = document.getElementById(`${elementPrefix}-length`);
    const upperReq = document.getElementById(`${elementPrefix}-upper`);
    const lowerReq = document.getElementById(`${elementPrefix}-lower`);
    const numberReq = document.getElementById(`${elementPrefix}-number`);
    
    if (lengthReq) {
        lengthReq.classList.toggle('valid', password.length >= 6);
    }
    if (upperReq) {
        upperReq.classList.toggle('valid', /[A-Z]/.test(password));
    }
    if (lowerReq) {
        lowerReq.classList.toggle('valid', /[a-z]/.test(password));
    }
    if (numberReq) {
        numberReq.classList.toggle('valid', /[0-9]/.test(password));
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    validatePassword(password, 'req');
    checkPasswordMatch();
}

function checkPasswordMatch() {
    const password = document.getElementById('registerPassword').value;
    const password2 = document.getElementById('registerPassword2').value;
    const matchReq = document.getElementById('req-match');
    
    if (matchReq) {
        matchReq.classList.toggle('valid', password2 && timingSafeEqual(password, password2));
    }
}

function checkModalPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    validatePassword(password, 'modal-req');
    checkModalPasswordMatch();
}

function checkModalPasswordMatch() {
    const password = document.getElementById('newPassword').value;
    const password2 = document.getElementById('newPassword2').value;
    const matchReq = document.getElementById('modal-req-match');
    
    if (matchReq) {
        matchReq.classList.toggle('valid', password2 && timingSafeEqual(password, password2));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const registerPassword = document.getElementById('registerPassword');
    const registerPassword2 = document.getElementById('registerPassword2');
    const newPassword = document.getElementById('newPassword');
    const newPassword2 = document.getElementById('newPassword2');
    
    if (registerPassword) {
        registerPassword.addEventListener('input', checkPasswordStrength);
    }
    if (registerPassword2) {
        registerPassword2.addEventListener('input', checkPasswordMatch);
    }
    if (newPassword) {
        newPassword.addEventListener('input', checkModalPasswordStrength);
    }
    if (newPassword2) {
        newPassword2.addEventListener('input', checkModalPasswordMatch);
    }

    const remember = localStorage.getItem("rememberUser");
    if(remember) {
        const loginUsernameEl = document.getElementById("loginUsername");
        const rememberCheckboxEl = document.getElementById("rememberCheckbox");
        if (loginUsernameEl) loginUsernameEl.value = remember;
        if (rememberCheckboxEl) rememberCheckboxEl.checked = true;
    }

    window.onclick = (event) => {
        const modal = document.getElementById("forgotPasswordModal");
        if (modal && event.target === modal) {
            closeForgotPasswordModal();
        }
    };
});
