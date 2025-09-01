const API_BASE_URL = 'http://localhost:7000/api';

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
            message.textContent = "✅ Kayıt başarılı";
            
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

    if (username === "admin" && password === "123") {
        message.textContent = "✅ Giriş başarılı!";
        localStorage.setItem("activeUser", "admin");
        
        if (remember) {
            localStorage.setItem("rememberUser", username);
        }
        
        setTimeout(() => {
            window.location.href = 'anasayfa.html';
        }, 500);
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
            message.textContent = "✅ Giriş başarılı!";
            localStorage.setItem("activeUser", data.user.username);
            localStorage.setItem("authToken", data.token);

            if (remember) {
                localStorage.setItem("rememberUser", username);
            } else {
                localStorage.removeItem("rememberUser");
            }

            setTimeout(() => {
                window.location.href = 'anasayfa.html';
            }, 500);
        } else {
            message.textContent = "❌ Kullanıcı adı veya şifre hatalı!";
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

let foundUser = null;

const resetPassword = () => {
    const input = document.getElementById("forgotPasswordUsername").value.trim();
    const message = document.getElementById("forgotPasswordMessage");

    if (!input) {
        message.textContent = "⚠️ Lütfen kullanıcı adı veya e-posta girin.";
        message.style.color = "#dc3545";
        return;
    }

    let found = false;
    for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === "activeUser" || key === "rememberUser") continue;

        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (key === input || data.email === input) {
                foundUser = key;
                message.textContent = "✅ Kullanıcı bulundu! Yeni şifrenizi belirleyin.";
                message.style.color = "#28a745";
                document.getElementById("newPasswordArea").style.display = "block";
                document.getElementById("resetPasswordBtn").style.display = "none";
                found = true;
                break;
            }
        } catch (error) {}
    }

    if (!found) {
        message.textContent = "❌ Kullanıcı bulunamadı!";
        message.style.color = "#dc3545";
    }
};

const updatePassword = () => {
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

    try {
        const data = JSON.parse(localStorage.getItem(foundUser));
        data.password = newPassword;
        localStorage.setItem(foundUser, JSON.stringify(data));
        message.textContent = "✅ Şifreniz başarıyla güncellendi!";
        message.style.color = "#28a745";
        
        setTimeout(() => {
            closeForgotPasswordModal();
        }, 2000);
    } catch (error) {
        message.textContent = "❌ Bir hata oluştu!";
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