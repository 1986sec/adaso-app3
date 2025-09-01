const API_BASE_URL = 'https://adaso-backend.onrender.com/api';
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const activeUser = localStorage.getItem('activeUser');
    
    if (!token && !activeUser) {
        window.location.href = '/index.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });
    
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('activeUser');
                window.location.href = '/index.html';
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
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationDropdown && notificationIcon && 
        !notificationIcon.contains(event.target) && 
        !notificationDropdown.contains(event.target)) {
        notificationDropdown.classList.remove('show');
    }
});

async function loadRecentMeetings() {
    const tbody = document.querySelector('#recentMeetings');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Yükleniyor...</td></tr>';
        
        const [companies, visits] = await Promise.all([
            apiRequest('/companies'),
            apiRequest('/visits')
        ]);
        
        tbody.innerHTML = '';
        
        if (!companies || companies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Henüz firma kaydı bulunmuyor</td></tr>';
            return;
        }
        
        const visitsByCompany = {};
        if (visits) {
            visits.forEach(v => {
                if (!visitsByCompany[v.company]) {
                    visitsByCompany[v.company] = [];
                }
                visitsByCompany[v.company].push(v);
            });
        }
        
        const recentCompanies = companies.slice(-5).reverse();
        
        recentCompanies.forEach(company => {
            const companyVisits = visitsByCompany[company.company] || [];
            const lastVisit = companyVisits.length > 0 ? companyVisits[companyVisits.length - 1] : null;
            
            const row = document.createElement('tr');
            let statusClass = 'not-visited';
            let durum = 'Ziyaret Edilmedi';
            
            if (lastVisit) {
                if (lastVisit.status === 'completed') {
                    statusClass = 'meeting-completed';
                    durum = 'Görüşme Yapıldı';
                } else if (lastVisit.status === 'planned') {
                    statusClass = 'planned';
                    durum = 'Planlandı';
                }
            }
            
            const tarihCell = document.createElement('td');
            tarihCell.textContent = lastVisit ? lastVisit.date : '-';
            const companyCell = document.createElement('td');
            companyCell.textContent = company.company;
            const contactCell = document.createElement('td');
            contactCell.textContent = company.contactPerson || '-';
            const durumCell = document.createElement('td');
            durumCell.innerHTML = `<span class="status ${statusClass}">${durum}</span>`;
            
            row.appendChild(tarihCell);
            row.appendChild(companyCell);
            row.appendChild(contactCell);
            row.appendChild(durumCell);
            tbody.appendChild(row);
        });
        
    } catch {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #f44336;">Veriler yüklenirken hata oluştu</td></tr>';
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
    
    await loadDashboardData();
    await loadRecentMeetings();
});

async function loadDashboardData() {
    try {
        const [companies, visits, stats] = await Promise.all([
            apiRequest('/companies'),
            apiRequest('/visits'),
            apiRequest('/dashboard/stats')
        ]);
        
        if (stats) {
            const totalFirmsEl = document.getElementById('totalFirms');
            const totalMeetingsEl = document.getElementById('totalMeetings');
            const totalIncomeEl = document.getElementById('totalIncome');
            const totalExpenseEl = document.getElementById('totalExpense');
            
            if (totalFirmsEl) totalFirmsEl.textContent = stats.totalCompanies || 0;
            if (totalMeetingsEl) totalMeetingsEl.textContent = stats.completedVisits || 0;
            if (totalIncomeEl) totalIncomeEl.textContent = (stats.totalIncome || 0).toLocaleString('tr-TR') + ' ₺';
            if (totalExpenseEl) totalExpenseEl.textContent = (stats.totalExpense || 0).toLocaleString('tr-TR') + ' ₺';
            return;
        }
        

        
        const completedMeetingCompanies = new Set();
        if (visits) {
            visits.forEach(visit => {
                if (visit.status === 'completed') {
                    completedMeetingCompanies.add(visit.company);
                }
            });
        }
        
        const totalFirmsEl = document.getElementById('totalFirms');
        const totalMeetingsEl = document.getElementById('totalMeetings');
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        
        if (totalFirmsEl) totalFirmsEl.textContent = companies ? companies.length : 0;
        if (totalMeetingsEl) totalMeetingsEl.textContent = completedMeetingCompanies.size;
        if (totalIncomeEl) totalIncomeEl.textContent = '0 ₺';
        if (totalExpenseEl) totalExpenseEl.textContent = '0 ₺';
        
    } catch {
    }
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

async function globalSearch() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase().trim();
    const tableTitle = document.getElementById('tableTitle');
    const tbody = document.querySelector('#recentMeetings');
    
    if (!searchTerm) {
        if (tableTitle) tableTitle.innerHTML = '🏢 Son Eklenen Firmalar';
        await loadRecentMeetings();
        return;
    }
    
    if (tableTitle) tableTitle.innerHTML = '🔍 Arama Sonuçları';
    
    try {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Aranıyor...</td></tr>';
        

        const searchResults = [];
        
        if (tbody) tbody.innerHTML = '';
        
        if (!searchResults || searchResults.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        searchResults.slice(0, 10).forEach(result => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = result.date || '-';
            const nameCell = document.createElement('td');
            nameCell.textContent = result.name;
            const detailCell = document.createElement('td');
            detailCell.textContent = result.detail;
            const statusCell = document.createElement('td');
            statusCell.innerHTML = `<span class="status ${result.status}">${result.type}</span>`;
            
            row.appendChild(dateCell);
            row.appendChild(nameCell);
            row.appendChild(detailCell);
            row.appendChild(statusCell);
            
            if (tbody) tbody.appendChild(row);
        });
        
    } catch {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
    }
}

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');


if (searchBtn) searchBtn.addEventListener('click', () => {});
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {}
    });
    searchInput.addEventListener('input', function(e) {
        if (e.target.value === '') {
            loadRecentMeetings();
            hideSearchSuggestions();
        } else {

        }
    });
}

async function showSearchSuggestions(searchTerm) {

    try {

        const suggestions = [];
        
        let suggestionBox = document.getElementById('searchSuggestions');
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.id = 'searchSuggestions';
            suggestionBox.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
            `;
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.style.position = 'relative';
                searchContainer.appendChild(suggestionBox);
            }
        }
        
        if (!suggestions || suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }
        
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'block';
        
        suggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 14px;
            `;
            item.textContent = suggestion;
            item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
            item.addEventListener('mouseleave', () => item.style.background = 'white');
            item.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    hideSearchSuggestions();
                    globalSearch();
                }
            });
            suggestionBox.appendChild(item);
        });
        
    } catch {
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    const suggestionBox = document.getElementById('searchSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideSearchSuggestions();
    }
});
