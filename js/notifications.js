// Notifications functionality
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const notificationIcon = document.querySelector('.notification-icon');
    const userProfile = document.querySelector('.user-profile');
    
    if (!notificationIcon.contains(event.target)) {
        document.getElementById('notificationDropdown').style.display = 'none';
    }
    
    if (!userProfile.contains(event.target)) {
        document.getElementById('userDropdown').style.display = 'none';
    }
});

// Logout function
function logout() {
    // Clear any stored user data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    
    // Redirect to login page
    window.location.href = 'index.html';
    return false;
}

// Set user name from localStorage if available
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser;
        }
    }
});
