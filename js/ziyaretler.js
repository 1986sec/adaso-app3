const API_BASE_URL = 'https://adaso-backend.onrender.com/api';
let editingVisitId = null;
let cachedVisits = null;

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
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function openAddModal() {
    editingVisitId = null;
    document.getElementById('modalTitle').innerText = '🚗 Yeni Ziyaret Ekle';
    document.getElementById('visitModal').style.display = 'block';
    clearForm();
    history.pushState({modal: true}, '', '');
}

function closeModal() {
    document.getElementById('visitModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('visitDate').value = '';
    document.getElementById('visitTime').value = '';
    document.getElementById('company').value = '';
    document.getElementById('customCompany').value = '';
    document.getElementById('customCompany').style.display = 'none';
    document.getElementById('visitor').value = '';
    document.getElementById('purpose').value = '';
    document.getElementById('status').value = 'Planned';
    document.getElementById('notes').value = '';
    document.getElementById('detailedInfo').value = '';
    document.getElementById('participants').value = '';
    document.getElementById('location').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('financialDescription').value = '';
    document.getElementById('file').value = '';
}

function createVisitRow(visit) {
    const row = document.createElement('tr');
    let statusClass = 'planned';
    if (visit.status === 'completed') statusClass = 'completed';
    if (visit.status === 'cancelled') statusClass = 'cancelled';
    
    row.setAttribute('data-visit-id', visit.id);
    
    const dateCell = document.createElement('td');
    dateCell.textContent = visit.date;
    const companyCell = document.createElement('td');
    companyCell.textContent = visit.company;
    const visitorCell = document.createElement('td');
    visitorCell.textContent = visit.visitor;
    const purposeCell = document.createElement('td');
    purposeCell.textContent = visit.purpose;
    const statusCell = document.createElement('td');
    const statusText = visit.status === 'Planned' ? 'Planlandı' : visit.status === 'Completed' ? 'Tamamlandı' : 'İptal Edildi';
    statusCell.innerHTML = `<span class="status ${statusClass}">${statusText}</span>`;
    const actionsCell = document.createElement('td');
    const vid = visit.id;
    actionsCell.innerHTML = `
        <button class=\"detail-btn\" onclick=\"viewDetail('${vid}')\" title=\"Detay Gör\">👁️</button>
        <button class=\"edit-btn\" onclick=\"editVisit('${vid}')\" title=\"Düzenle\">✏️</button>
        <button class=\"delete-btn\" onclick=\"deleteVisit('${vid}')\" title=\"Sil\">🗑️</button>
    `;
    
    row.appendChild(dateCell);
    row.appendChild(companyCell);
    row.appendChild(visitorCell);
    row.appendChild(purposeCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    return row;
}

async function saveVisit() {
    const date = document.getElementById('visitDate').value;
    const time = document.getElementById('visitTime').value;
    const companySelect = document.getElementById('company').value;
    const customCompany = document.getElementById('customCompany').value;
    let company, companyId;
    
    if (companySelect === 'custom') {
        company = customCompany;
        companyId = null;
    } else {
        const companies = await apiRequest('/companies');
        const selectedCompany = companies.find(c => c.company === companySelect);
        company = selectedCompany ? selectedCompany.companyName : companySelect;
        companyId = selectedCompany ? selectedCompany.id : null;
    }
    const visitor = document.getElementById('visitor').value;
    const purpose = document.getElementById('purpose').value;
    const status = document.getElementById('status').value;
    const notes = document.getElementById('notes').value;
    const detailedInfo = document.getElementById('detailedInfo').value;
    const participants = document.getElementById('participants').value;
    const location = document.getElementById('location').value;
    const incomeAmount = parseFloat(document.getElementById('incomeAmount').value) || 0;
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    const financialDescription = document.getElementById('financialDescription').value;
    const files = document.getElementById('file').files;
    
    if (!date || !time || !company || !visitor || !purpose) {
        alert('Lütfen tüm zorunlu alanları doldurun!');
        return;
    }
    
    const fileNames = [];
    for (let i = 0; i < files.length; i++) {
        fileNames.push(files[i].name);
    }
    
    const visitData = {
        date: date,
        time: time,
        company: companyId || company,
        visitor,
        purpose,
        status: status.toLowerCase(),
        notes,
        detailedInfo,
        participants,
        location,
        files: fileNames,
        incomeAmount,
        expenseAmount,
        financialDescription
    };
    
    try {
        if (editingVisitId) {
            await apiRequest(`/visits/${editingVisitId}`, {
                method: 'PUT',
                body: JSON.stringify(visitData)
            });
            editingVisitId = null;
        } else {
            await apiRequest('/visits', {
                method: 'POST',
                body: JSON.stringify(visitData)
            });
        }
        
        cachedVisits = null;
        await loadVisits();
        await updateVisitStats();
        
        if (window.notificationSystem && status === 'Completed') {
            const nextVisitDate = new Date();
            nextVisitDate.setDate(nextVisitDate.getDate() + 7);
            
            const updatedVisitData = {
                ...visitData,
                nextVisitDate: nextVisitDate.toISOString().split('T')[0]
            };
            
            const visits = JSON.parse(localStorage.getItem('visits') || '[]');
            const existingIndex = visits.findIndex(v => v.companyName === company);
            
            if (existingIndex >= 0) {
                visits[existingIndex] = {
                    ...visits[existingIndex],
                    companyName: company,
                    nextVisitDate: nextVisitDate.toISOString().split('T')[0]
                };
            } else {
                visits.push({
                    companyName: company,
                    nextVisitDate: nextVisitDate.toISOString().split('T')[0]
                });
            }
            
            localStorage.setItem('visits', JSON.stringify(visits));
            window.notificationSystem.checkUpcomingVisits();
        }
        
        closeModal();
    } catch (error) {
        alert('Ziyaret kaydedilirken hata oluştu: ' + error.message);
    }
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    try {
        const visit = cachedVisits ? 
            cachedVisits.find(v => v.id == id) : 
            (await apiRequest('/visits')).find(v => v.id == id);
        
        if (visit) {
            const rows = document.querySelectorAll('#visitTable tr');
            let targetRow = null;
            
            rows.forEach(row => {
                if (row.getAttribute('data-visit-id') == id) {
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
                
                const gridDiv = document.createElement('div');
                gridDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px; text-align: left;';
                
                const statusText = visit.status === 'planned' ? 'Planlandı' : visit.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi';
                const fields = [
                    ['Tarih', visit.date],
                    ['Saat', visit.time],
                    ['Firma', visit.company],
                    ['Ziyaretçi', visit.visitor],
                    ['Amaç', visit.purpose],
                    ['Durum', statusText]
                ];
                
                fields.forEach(([label, value]) => {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.innerHTML = `<strong>${label}:</strong> `;
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = value;
                    fieldDiv.appendChild(valueSpan);
                    gridDiv.appendChild(fieldDiv);
                });
                
                detailDiv.appendChild(gridDiv);
                
                if (visit.notes) {
                    const notesDiv = document.createElement('div');
                    notesDiv.style.cssText = 'margin-bottom: 10px; font-size: 0.9rem;';
                    notesDiv.innerHTML = '<strong>Notlar:</strong> ';
                    const notesSpan = document.createElement('span');
                    notesSpan.textContent = visit.notes;
                    notesDiv.appendChild(notesSpan);
                    detailDiv.appendChild(notesDiv);
                }
                
                const hideBtn = document.createElement('button');
                hideBtn.textContent = 'Gizle';
                hideBtn.style.cssText = 'background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;';
                hideBtn.onclick = hideDetail;
                detailDiv.appendChild(hideBtn);
                
                detailCell.appendChild(detailDiv);
                detailRow.appendChild(detailCell);
                
                targetRow.parentNode.insertBefore(detailRow, targetRow.nextSibling);
                history.pushState({detail: true}, '', '');
            }
        }
    } catch (error) {
        console.error('Detay yükleme hatası:', error);
    }
}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

async function loadCompanies() {
    try {
        const companies = await apiRequest('/companies');
        const companySelect = document.getElementById('company');
        
        while (companySelect.children.length > 2) {
            companySelect.removeChild(companySelect.lastChild);
        }
        
        if (companies) {
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.company;
                option.textContent = company.company;
                companySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Firmalar yüklenirken hata:', error);
    }
}

function toggleCustomCompany() {
    const companySelect = document.getElementById('company');
    const customCompany = document.getElementById('customCompany');
    
    if (companySelect.value === 'custom') {
        customCompany.style.display = 'block';
        customCompany.required = true;
        companySelect.required = false;
    } else {
        customCompany.style.display = 'none';
        customCompany.required = false;
        companySelect.required = true;
        customCompany.value = '';
    }
}

async function editVisit(id) {
    try {
        const visit = cachedVisits ? 
            cachedVisits.find(v => v.id == id) : 
            (await apiRequest('/visits')).find(v => v.id == id);
        
        if (visit) {
            editingVisitId = visit.id;
            document.getElementById('modalTitle').innerText = '✏️ Ziyaret Düzenle';
            document.getElementById('visitDate').value = visit.date;
            document.getElementById('visitTime').value = visit.time;
            document.getElementById('company').value = visit.company;
            document.getElementById('visitor').value = visit.visitor;
            document.getElementById('purpose').value = visit.purpose;
            document.getElementById('status').value = visit.status;
            document.getElementById('notes').value = visit.notes || '';
            document.getElementById('visitModal').style.display = 'block';
            history.pushState({modal: true}, '', '');
        }
    } catch (error) {
        alert('Ziyaret bilgileri yüklenirken hata: ' + error.message);
    }
}

async function loadVisits() {
    const tbody = document.querySelector('#visitTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Yükleniyor...</td></tr>';
        cachedVisits = await apiRequest('/visits');
        
        tbody.innerHTML = '';
        
        if (!cachedVisits || cachedVisits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Henüz ziyaret kaydı bulunmuyor</td></tr>';
            return;
        }
        
        cachedVisits.forEach(visit => {
            tbody.appendChild(createVisitRow(visit));
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Ziyaretler yüklenirken hata oluştu</td></tr>';
    }
}

async function deleteVisit(id) {
    if (confirm('Bu ziyareti silmek istediğinizden emin misiniz?')) {
        try {
            await apiRequest(`/visits/${id}`, { method: 'DELETE' });
            cachedVisits = null;
            await loadVisits();
        } catch (error) {
            alert('Ziyaret silinirken hata oluştu: ' + error.message);
        }
    }
}

async function searchVisits() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#visitTable');
    
    if (!searchTerm) {
        await loadVisits();
        return;
    }
    
    try {
        if (!cachedVisits) {
            cachedVisits = await apiRequest('/visits');
        }
        
        tbody.innerHTML = '';
        
        const filteredVisits = cachedVisits.filter(visit => 
            visit.company.toLowerCase().includes(searchTerm) ||
            visit.visitor.toLowerCase().includes(searchTerm) ||
            visit.purpose.toLowerCase().includes(searchTerm)
        );
        
        if (filteredVisits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredVisits.forEach(visit => {
            tbody.appendChild(createVisitRow(visit));
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
    }
}

async function updateVisitStats() {
    try {
        const visits = cachedVisits || await apiRequest('/visits');
        
        if (visits) {
            const totalVisits = visits.length;
            const completedVisits = visits.filter(v => v.status === 'completed').length;
            const plannedVisits = visits.filter(v => v.status === 'planned').length;
            
            const totalEl = document.getElementById('totalVisits');
            const completedEl = document.getElementById('completedVisits');
            const plannedEl = document.getElementById('plannedVisits');
            
            if (totalEl) totalEl.textContent = totalVisits;
            if (completedEl) completedEl.textContent = completedVisits;
            if (plannedEl) plannedEl.textContent = plannedVisits;
        }
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
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
    await loadVisits();
    await loadCompanies();
    await updateVisitStats();
    
    const editVisitId = localStorage.getItem('editVisitId');
    if (editVisitId) {
        localStorage.removeItem('editVisitId');
        setTimeout(() => {
            editVisit(parseInt(editVisitId));
        }, 500);
    }
});

window.addEventListener('popstate', function() {
    if (document.getElementById('visitModal').style.display === 'block') {
        closeModal();
    }
    if (document.querySelector('.detail-row')) {
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

if (searchBtn) searchBtn.addEventListener('click', searchVisits);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchVisits();
    });
}
