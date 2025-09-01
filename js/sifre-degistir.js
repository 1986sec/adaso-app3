const API_BASE_URL = 'https://adaso-backend.onrender.com/api';

async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('authToken');
        const authHeaders = token
            ? {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
            }
            : {};

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('activeUser');
                if (!/index\.html$/.test(window.location.pathname)) {
                    window.location.href = '/index.html';
                }
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const activeUser = localStorage.getItem('activeUser');
    if (!activeUser) {
        window.location.href = '/index.html';
        return;
    }
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.querySelector('.user-avatar');
    if (userNameEl) userNameEl.innerText = activeUser;
    if (userAvatarEl) userAvatarEl.innerText = activeUser.charAt(0).toUpperCase();
    
    try {
        const userInfo = await apiRequest('/users/me');
        const name = userInfo.fullName ? userInfo.fullName.split(' ')[0] : activeUser;
        if (userNameEl) userNameEl.innerText = name;
        if (userAvatarEl) userAvatarEl.innerText = name.charAt(0).toUpperCase();
    } catch {
    }
    setupForm();
});

function setupForm() {
    const passwordForm = document.getElementById('passwordForm');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            checkPasswordRequirements(this.value);
            checkPasswordMatch();
        });
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            checkPasswordMatch();
        });
    }
}

function validatePassword(password) {
    const lengthReq = document.getElementById('lengthReq');
    const upperReq = document.getElementById('upperReq');
    const lowerReq = document.getElementById('lowerReq');
    const numberReq = document.getElementById('numberReq');
    
    if (lengthReq) {
        if (password.length >= 6) {
            lengthReq.style.color = '#28a745';
            lengthReq.innerHTML = '✓ En az 6 karakter';
        } else {
            lengthReq.style.color = '#dc3545';
            lengthReq.innerHTML = '• En az 6 karakter';
        }
    }
    if (upperReq) {
        if (/[A-Z]/.test(password)) {
            upperReq.style.color = '#28a745';
            upperReq.innerHTML = '✓ En az 1 büyük harf';
        } else {
            upperReq.style.color = '#dc3545';
            upperReq.innerHTML = '• En az 1 büyük harf';
        }
    }
    if (lowerReq) {
        if (/[a-z]/.test(password)) {
            lowerReq.style.color = '#28a745';
            lowerReq.innerHTML = '✓ En az 1 küçük harf';
        } else {
            lowerReq.style.color = '#dc3545';
            lowerReq.innerHTML = '• En az 1 küçük harf';
        }
    }
    if (numberReq) {
        if (/[0-9]/.test(password)) {
            numberReq.style.color = '#28a745';
            numberReq.innerHTML = '✓ En az 1 rakam';
        } else {
            numberReq.style.color = '#dc3545';
            numberReq.innerHTML = '• En az 1 rakam';
        }
    }
}

function checkPasswordRequirements(password) {
    validatePassword(password);
    checkPasswordMatch();
}

function checkPasswordMatch() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchReq = document.getElementById('matchReq');
    
    if (matchReq) {
        if (confirmPassword && password === confirmPassword) {
            matchReq.style.color = '#28a745';
            matchReq.innerHTML = '✓ Şifreler eşleşmeli';
        } else {
            matchReq.style.color = '#dc3545';
            matchReq.innerHTML = '• Şifreler eşleşmeli';
        }
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('Yeni şifreler eşleşmiyor!');
        return;
    }
    
    if (!isStrongPassword(newPassword)) {
        alert('Şifre gereksinimleri karşılanmıyor! Lütfen en az 6 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içeren bir şifre girin.');
        return;
    }
    
    if (currentPassword === newPassword) {
        alert('Yeni şifre mevcut şifre ile aynı olamaz!');
        return;
    }
    
    try {
        await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        document.getElementById('passwordForm').reset();
        alert('Şifreniz başarıyla değiştirildi! Güvenliğiniz için bu bilgiyi kimseyle paylaşmayın.');
        
        setTimeout(() => {
            window.location.href = '/anasayfa.html';
        }, 1500);
    } catch (error) {
        alert('Şifre değiştirilirken hata oluştu: ' + error.message);
    }
}

function isStrongPassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
}

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('activeUser');
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    }
    return false;
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile');
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (userProfile && !userProfile.contains(event.target) && userDropdown) {
        userDropdown.classList.remove('show');
    }
    
    if (notificationDropdown && notificationIcon && 
        !notificationIcon.contains(event.target) && 
        !notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.remove('show');
    }
    
    if (sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});
