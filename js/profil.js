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
        return false;
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
    const userSection = document.querySelector('.user-section');
    const dropdown = document.getElementById('userDropdown');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (userSection && !userSection.contains(event.target) && dropdown) {
        dropdown.classList.remove('show');
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

const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newFullName = document.getElementById('newFullName').value;
    const newUsername = document.getElementById('newUsername').value;
    const newEmail = document.getElementById('newEmail').value;
    const newPhone = document.getElementById('newPhone').value;
    
    const updateData = {};
    if (newFullName) updateData.fullName = newFullName;
    if (newUsername) updateData.username = newUsername;
    if (newEmail) updateData.email = newEmail;
    if (newPhone) updateData.phone = newPhone;
    
    try {
        await apiRequest('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        alert('Profil başarıyla güncellendi!');
        document.getElementById('profileForm').reset();
        
        setTimeout(() => {
            window.location.href = '/anasayfa.html';
        }, 1000);
    } catch (error) {
        alert('Profil güncellenirken hata oluştu: ' + error.message);
    }
    });
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
        const userInfo = await apiRequest('/auth/me');
        const name = userInfo.fullName ? userInfo.fullName.split(' ')[0] : activeUser;
        if (userNameEl) userNameEl.innerText = name;
        if (userAvatarEl) userAvatarEl.innerText = name.charAt(0).toUpperCase();
        
        const currentFullNameEl = document.getElementById('currentFullName');
        const currentEmailEl = document.getElementById('currentEmail');
        const currentPhoneEl = document.getElementById('currentPhone');
        const currentUsernameEl = document.getElementById('currentUsername');
        
        if (userInfo.fullName && currentFullNameEl) currentFullNameEl.textContent = userInfo.fullName;
        if (userInfo.email && currentEmailEl) currentEmailEl.textContent = userInfo.email;
        if (userInfo.phone && currentPhoneEl) currentPhoneEl.textContent = userInfo.phone;
        if (currentUsernameEl) currentUsernameEl.textContent = userInfo.username || activeUser;
    } catch {
        const currentUsernameEl = document.getElementById('currentUsername');
        if (currentUsernameEl) currentUsernameEl.textContent = activeUser;
    }
});
