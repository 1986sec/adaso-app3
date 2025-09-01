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
    }
    return false;
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

async function loadIncomeExpense() {
    const tbody = document.querySelector('#recordsTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Yükleniyor...</td></tr>';
        const response = await apiRequest('/visits');
        const visits = response || [];
        
        tbody.innerHTML = '';
        
        const incomeExpenseRecords = [];
        
        visits.forEach(visit => {
            if (visit.incomeAmount && visit.incomeAmount > 0) {
                incomeExpenseRecords.push({
                    id: `${visit._id || visit.id}_income`,
                    date: visit.visitDate,
                    description: visit.financialDescription || `${visit.company} - Gelir`,
                    category: 'Ziyaret Geliri',
                    amount: visit.incomeAmount,
                    type: 'income',
                    visitId: visit._id || visit.id
                });
            }
            
            if (visit.expenseAmount && visit.expenseAmount > 0) {
                incomeExpenseRecords.push({
                    id: `${visit._id || visit.id}_expense`,
                    date: visit.visitDate,
                    description: visit.financialDescription || `${visit.company} - Gider`,
                    category: 'Ziyaret Gideri',
                    amount: visit.expenseAmount,
                    type: 'expense',
                    visitId: visit._id || visit.id
                });
            }
        });
        
        if (incomeExpenseRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Henüz gelir-gider kaydı bulunmuyor</td></tr>';
            updateStatsFromRecords([]);
            return;
        }
        
        updateStatsFromRecords(incomeExpenseRecords);
        
        incomeExpenseRecords.forEach(record => {
            const row = document.createElement('tr');
            const typeLower = record.type.toLowerCase();
            const typeClass = typeLower === 'income' ? 'income' : 'expense';
            const amountPrefix = typeLower === 'income' ? '+' : '-';
            const statusClass = typeLower === 'income' ? 'visited' : 'not-visited';
            
            row.setAttribute('data-record-id', record.id);
            
            const dateCell = document.createElement('td');
            dateCell.textContent = record.date;
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = record.description;
            const categoryCell = document.createElement('td');
            categoryCell.textContent = record.category;
            const amountCell = document.createElement('td');
            amountCell.className = typeClass;
            amountCell.textContent = `${amountPrefix}${parseFloat(record.amount).toLocaleString('tr-TR')} ₺`;
            const typeCell = document.createElement('td');
            typeCell.innerHTML = `<span class="status ${statusClass}">${typeLower === 'income' ? 'Gelir' : 'Gider'}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class=\"detail-btn\" onclick=\"viewDetail('${record.id}')\" title=\"Detay Gör\">👁️</button>
            `;
            
            row.appendChild(dateCell);
            row.appendChild(descriptionCell);
            row.appendChild(categoryCell);
            row.appendChild(amountCell);
            row.appendChild(typeCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Veri yüklenirken hata oluştu</td></tr>';
        console.error('Gelir-gider verisi yükleme hatası:', error);
    }
}

let editingRecordId = null;



async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    const rows = document.querySelectorAll('#recordsTable tr');
    let targetRow = null;
    
    rows.forEach(row => {
        if (row.getAttribute('data-record-id') == id) {
            targetRow = row;
        }
    });
    
    if (targetRow) {
        const detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        const detailCell = document.createElement('td');
        detailCell.colSpan = 6;
        detailCell.style.padding = '0';
        
        const detailDiv = document.createElement('div');
        detailDiv.style.cssText = 'padding: 15px; background: #f8f9fa; border-left: 3px solid #B22222;';
        detailDiv.innerHTML = '<strong>Detay:</strong> Bu kayıt ziyaretler kısmından alınmıştır.';
        
        const hideBtn = document.createElement('button');
        hideBtn.textContent = 'Gizle';
        hideBtn.style.cssText = 'background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;';
        hideBtn.onclick = hideDetail;
        detailDiv.appendChild(hideBtn);
        
        detailCell.appendChild(detailDiv);
        detailRow.appendChild(detailCell);
        
        targetRow.parentNode.insertBefore(detailRow, targetRow.nextSibling);
    }
}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

function updateStatsFromRecords(records) {
    let totalIncome = 0;
    let totalExpense = 0;
    
    records.forEach(record => {
        if (record.type === 'income') {
            totalIncome += parseFloat(record.amount) || 0;
        } else if (record.type === 'expense') {
            totalExpense += parseFloat(record.amount) || 0;
        }
    });
    
    const netProfit = totalIncome - totalExpense;
    
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const netProfitEl = document.getElementById('netProfit');
    
    if (totalIncomeEl) totalIncomeEl.textContent = totalIncome.toLocaleString('tr-TR') + ' ₺';
    if (totalExpenseEl) totalExpenseEl.textContent = totalExpense.toLocaleString('tr-TR') + ' ₺';
    if (netProfitEl) netProfitEl.textContent = netProfit.toLocaleString('tr-TR') + ' ₺';
}

async function searchRecords() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    
    if (!searchTerm) {
        await loadIncomeExpense();
        return;
    }
    
    const tbody = document.querySelector('#recordsTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aranıyor...</td></tr>';
        const response = await apiRequest('/visits');
        const visits = response || [];
        
        const incomeExpenseRecords = [];
        
        visits.forEach(visit => {
            if (visit.incomeAmount && visit.incomeAmount > 0) {
                incomeExpenseRecords.push({
                    id: `${visit._id || visit.id}_income`,
                    date: visit.visitDate,
                    description: visit.financialDescription || `${visit.company} - Gelir`,
                    category: 'Ziyaret Geliri',
                    amount: visit.incomeAmount,
                    type: 'income'
                });
            }
            
            if (visit.expenseAmount && visit.expenseAmount > 0) {
                incomeExpenseRecords.push({
                    id: `${visit._id || visit.id}_expense`,
                    date: visit.visitDate,
                    description: visit.financialDescription || `${visit.company} - Gider`,
                    category: 'Ziyaret Gideri',
                    amount: visit.expenseAmount,
                    type: 'expense'
                });
            }
        });
        
        const filteredRecords = incomeExpenseRecords.filter(record => 
            record.description.toLowerCase().includes(searchTerm) ||
            record.category.toLowerCase().includes(searchTerm) ||
            record.type.toLowerCase().includes(searchTerm)
        );
        
        tbody.innerHTML = '';
        
        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredRecords.forEach(record => {
            const row = document.createElement('tr');
            const typeLower = record.type.toLowerCase();
            const typeClass = typeLower === 'income' ? 'income' : 'expense';
            const amountPrefix = typeLower === 'income' ? '+' : '-';
            const statusClass = typeLower === 'income' ? 'visited' : 'not-visited';
            
            row.setAttribute('data-record-id', record.id);
            
            const dateCell = document.createElement('td');
            dateCell.textContent = record.date;
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = record.description;
            const categoryCell = document.createElement('td');
            categoryCell.textContent = record.category;
            const amountCell = document.createElement('td');
            amountCell.className = typeClass;
            amountCell.textContent = `${amountPrefix}${parseFloat(record.amount).toLocaleString('tr-TR')} ₺`;
            const typeCell = document.createElement('td');
            typeCell.innerHTML = `<span class="status ${statusClass}">${typeLower === 'income' ? 'Gelir' : 'Gider'}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail('${record.id}')" title="Detay Gör">👁️</button>
            `;
            
            row.appendChild(dateCell);
            row.appendChild(descriptionCell);
            row.appendChild(categoryCell);
            row.appendChild(amountCell);
            row.appendChild(typeCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
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
        const userInfo = await apiRequest('/auth/me');
        const name = userInfo.fullName ? userInfo.fullName.split(' ')[0] : activeUser;
        if (userNameEl) userNameEl.innerText = name;
        if (userAvatarEl) userAvatarEl.innerText = name.charAt(0).toUpperCase();
    } catch (error) {
        // localStorage değeri zaten gösterildi
    }
    
    await loadIncomeExpense();
});

window.addEventListener('popstate', function() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        hideDetail();
    }
});

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

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn) searchBtn.addEventListener('click', searchRecords);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchRecords();
    });
}
