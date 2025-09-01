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

function openAddModal() {
    editingCompanyId = null;
    document.getElementById('modalTitle').innerText = '🏢 Yeni Firma Ekle';
    document.getElementById('companyModal').style.display = 'block';
    clearForm();
    history.pushState({modal: true}, '', '');
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('companyName').value = '';
    document.getElementById('sector').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('contactPerson').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('address').value = '';
}

async function saveCompany() {
    const companyName = document.getElementById('companyName').value;
    const sector = document.getElementById('sector').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const contactPerson = document.getElementById('contactPerson').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const address = document.getElementById('address').value;
    
    if (!companyName || !sector || !phone || !contactPerson || !contactPhone) {
        alert('Lütfen tüm zorunlu alanları doldurun!');
        return;
    }
    
    const companyData = {
        company: companyName,
        sector,
        phone,
        email: email || '-',
        contactPerson,
        contactPhone,
        address
    };
    
    try {
        if (editingCompanyId) {
            await apiRequest(`/companies/${editingCompanyId}`, {
                method: 'PUT',
                body: JSON.stringify(companyData)
            });
            editingCompanyId = null;
        } else {
            await apiRequest('/companies', {
                method: 'POST',
                body: JSON.stringify(companyData)
            });
        }
        
        await loadCompanies();
        closeModal();
    } catch (error) {
        alert('Firma kaydedilirken hata oluştu: ' + error.message);
    }
}

let editingCompanyId = null;

async function editCompany(id) {
    try {
        const companies = await apiRequest('/companies');
        const company = companies.find(c => c.id == id);
        
        if (company) {
            editingCompanyId = company.id;
            document.getElementById('modalTitle').innerText = '✏️ Firma Düzenle';
            document.getElementById('companyName').value = company.company;
            document.getElementById('sector').value = company.sector;
            document.getElementById('phone').value = company.phone;
            document.getElementById('email').value = company.email;
            document.getElementById('contactPerson').value = company.contactPerson || '';
            document.getElementById('contactPhone').value = company.contactPhone || '';
            document.getElementById('address').value = company.address || '';
            document.getElementById('companyModal').style.display = 'block';
            history.pushState({modal: true}, '', '');
        }
    } catch (error) {
        alert('Firma bilgileri yüklenirken hata: ' + error.message);
    }
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    try {
        const [companies, visits] = await Promise.all([
            apiRequest('/companies'),
            apiRequest('/visits')
        ]);
        const company = companies.find(c => c.id == id);
    
    if (company) {
        const companyMeetings = visits.filter(v => v.company === company.company);
        
        const rows = document.querySelectorAll('#companyTable tr');
        let targetRow = null;
        
        rows.forEach(row => {
            if (row.getAttribute('data-company-id') == id) {
                targetRow = row;
            }
        });
        
        if (targetRow) {
            let meetingsHTML = '';
            if (companyMeetings.length > 0) {
                meetingsHTML = '<div style="margin-top: 15px;"><strong>Görüşmeler:</strong></div>';
                companyMeetings.forEach(meeting => {
                    let statusClass = 'planned';
                    if (meeting.visitStatus === 'completed') statusClass = 'completed';
                    if (meeting.visitStatus === 'cancelled') statusClass = 'cancelled';
                    
                    meetingsHTML += `
                        <div style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 2px solid #B22222; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>${meeting.date}</strong> - ${meeting.visitor}</span>
                                <span class="status ${statusClass}" style="font-size: 0.75rem; padding: 2px 6px;">${meeting.visitStatus === 'planned' ? 'Planlandı' : meeting.visitStatus === 'completed' ? 'Tamamlandı' : 'İptal Edildi'}</span>
                            </div>
                            <div style="color: #666; margin-top: 3px;">${meeting.purpose}</div>
                        </div>
                    `;
                });
            } else {
                meetingsHTML = '<div style="margin-top: 15px; color: #666; font-style: italic;">Henüz görüşme kaydı yok</div>';
            }
            
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.innerHTML = `
                <td colspan="7" style="padding: 0;">
                    <div style="padding: 15px; background: #f8f9fa; border-left: 3px solid #B22222;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px; text-align: left;">
                            <div><strong>Firma Adı:</strong> ${company.company}</div>
                            <div><strong>Sektör:</strong> ${company.sector}</div>
                            <div><strong>Telefon:</strong> ${company.phone}</div>
                            <div><strong>E-posta:</strong> ${company.email || '-'}</div>
                            <div><strong>Yetkili Kişi:</strong> ${company.contactPerson || '-'}</div>
                            <div><strong>Yetkili Numarası:</strong> ${company.contactPhone || '-'}</div>
                        </div>
                        ${company.address ? `<div style=\"margin-bottom: 10px; font-size: 0.9rem;\"><strong>Adres:</strong> ${company.address}</div>` : ''}
                        ${meetingsHTML}
                        <button onclick="hideDetail()" style="background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;">Gizle</button>
                    </div>
                </td>
            `;
            
            targetRow.parentNode.insertBefore(detailRow, targetRow.nextSibling);
            history.pushState({detail: true}, '', '');
        }
    }
} catch (error) {
    console.error('Detay yükleme hatası:', error);
    alert('Detay yüklenirken hata oluştu: ' + (error.message || error));
}

}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

async function loadCompanies() {
    const tbody = document.querySelector('#companyTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Yükleniyor...</td></tr>';
        const companies = await apiRequest('/companies');
        
        tbody.innerHTML = '';
        
        if (!companies || companies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Henüz firma kaydı bulunmuyor</td></tr>';
            return;
        }
        
        companies.forEach(company => {
            const row = document.createElement('tr');
            row.setAttribute('data-company-id', company.id);
            
            const nameCell = document.createElement('td');
            nameCell.textContent = company.company;
            const sectorCell = document.createElement('td');
            sectorCell.textContent = company.sector;
            const phoneCell = document.createElement('td');
            phoneCell.textContent = company.phone;
            const emailCell = document.createElement('td');
            emailCell.textContent = company.email;
            const contactPersonCell = document.createElement('td');
            contactPersonCell.textContent = company.contactPerson || '-';
            const contactPhoneCell = document.createElement('td');
            contactPhoneCell.textContent = company.contactPhone || '-';
            
            const actionsCell = document.createElement('td');
            const cid = company._id || company.id;
            actionsCell.innerHTML = `
                <button class=\"detail-btn\" onclick=\"viewDetail('${cid}')\" title=\"Detay Gör\">👁️</button>
                <button class=\"edit-btn\" onclick=\"editCompany('${cid}')\" title=\"Düzenle\">✏️</button>
                <button class=\"delete-btn\" onclick=\"deleteCompany('${cid}')\" title=\"Sil\">🗑️</button>
            `;
            
            row.appendChild(nameCell);
            row.appendChild(sectorCell);
            row.appendChild(phoneCell);
            row.appendChild(emailCell);
            row.appendChild(contactPersonCell);
            row.appendChild(contactPhoneCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">Firmalar yüklenirken hata oluştu</td></tr>';
        console.error('Firmalar yüklenirken hata:', error);
    }
}

async function deleteCompany(id) {
    if (confirm('Bu firmayı silmek istediğinizden emin misiniz?')) {
        try {
            await apiRequest(`/companies/${id}`, { method: 'DELETE' });
            await loadCompanies();
        } catch (error) {
            alert('Firma silinirken hata oluştu: ' + error.message);
        }
    }
}

async function updateStats() {
    try {
        const [companies, visits] = await Promise.all([
            apiRequest('/companies'),
            apiRequest('/visits')
        ]);
        
        const companyCount = companies ? companies.length : 0;
        const statEl1 = document.querySelector('.stat-card:nth-child(1) h3');
        if (statEl1) statEl1.textContent = companyCount;
        
        if (visits) {
            const visitedCompanies = new Set(visits.filter(v => v.visitStatus === 'completed').map(v => v.company));
            const statEl2 = document.querySelector('.stat-card:nth-child(2) h3');
            if (statEl2) statEl2.textContent = visitedCompanies.size;
            
            const pendingVisits = visits.filter(v => v.visitStatus === 'planned').length;
            const statEl3 = document.querySelector('.stat-card:nth-child(3) h3');
            if (statEl3) statEl3.textContent = pendingVisits;
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
        console.warn('Kullanıcı bilgileri alınamadı:', error);
    }
    await loadCompanies();
    await updateStats();
});

window.addEventListener('popstate', function(event) {
    if (document.getElementById('companyModal').style.display === 'block') {
        closeModal();
    }
    if (document.querySelector('.detail-row')) {
        hideDetail();
    }
});

async function searchCompanies() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#companyTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aranıyor...</td></tr>';
        const companies = await apiRequest('/companies');
        tbody.innerHTML = '';
        
        const filteredCompanies = companies.filter(company => 
            company.company.toLowerCase().includes(searchTerm) ||
            company.sector.toLowerCase().includes(searchTerm) ||
            (company.contactPerson && company.contactPerson.toLowerCase().includes(searchTerm))
        );
        
        if (filteredCompanies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredCompanies.forEach(company => {
            const row = document.createElement('tr');
            row.setAttribute('data-company-id', company.id);
            
            const nameCell = document.createElement('td');
            nameCell.textContent = company.company;
            const sectorCell = document.createElement('td');
            sectorCell.textContent = company.sector;
            const phoneCell = document.createElement('td');
            phoneCell.textContent = company.phone;
            const emailCell = document.createElement('td');
            emailCell.textContent = company.email;
            const contactPersonCell = document.createElement('td');
            contactPersonCell.textContent = company.contactPerson || '-';
            const contactPhoneCell = document.createElement('td');
            contactPhoneCell.textContent = company.contactPhone || '-';
            
            const actionsCell = document.createElement('td');
            const cid = company._id || company.id;
            actionsCell.innerHTML = `
                <button class=\"detail-btn\" onclick=\"viewDetail('${cid}')\" title=\"Detay Gör\">👁️</button>
                <button class=\"edit-btn\" onclick=\"editCompany('${cid}')\" title=\"Düzenle\">✏️</button>
                <button class=\"delete-btn\" onclick=\"deleteCompany('${cid}')\" title=\"Sil\">🗑️</button>
            `;
            
            row.appendChild(nameCell);
            row.appendChild(sectorCell);
            row.appendChild(phoneCell);
            row.appendChild(emailCell);
            row.appendChild(contactPersonCell);
            row.appendChild(contactPhoneCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
        console.error('Arama hatası:', error);
    }
}

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn) {
    searchBtn.addEventListener('click', searchCompanies);
}
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchCompanies();
    });
}
