document.addEventListener('DOMContentLoaded', () => {

    // --- STATE ---
    let reservationsData = [];
    let currentFilterStatus = 'ALL';
    let selectedDateFilter = null; // null = All Dates, Date object = specific day
    let searchQuery = '';
    let authToken = sessionStorage.getItem('montebello_admin_token');

    // --- DOM ELEMENTS ---
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const adminPassword = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const adminDashboard = document.getElementById('adminDashboard');
    const btnLogout = document.getElementById('btnLogout');
    const btnRefresh = document.getElementById('btnRefresh');

    // Calendar Elements
    const btnPrevDay = document.getElementById('btnPrevDay');
    const btnNextDay = document.getElementById('btnNextDay');
    const datePicker = document.getElementById('datePicker');
    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const btnFilterAllDates = document.getElementById('btnFilterAllDates');
    const btnFilterToday = document.getElementById('btnFilterToday');
    const btnFilterTomorrow = document.getElementById('btnFilterTomorrow');

    // Metrics
    const countPending = document.getElementById('countPending');
    const countConfirmed = document.getElementById('countConfirmed');
    const countTotalDiners = document.getElementById('countTotalDiners');
    const countTotal = document.getElementById('countTotal');
    const badgePending = document.getElementById('badgePending');

    // Grid & Search
    const reservationsGrid = document.getElementById('reservationsGrid');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Approve Modal
    const approveModal = document.getElementById('approveModal');
    const approveForm = document.getElementById('approveForm');
    const approveResId = document.getElementById('approveResId');
    const modalResId = document.getElementById('modalResId');
    const approveTableName = document.getElementById('approveTableName');
    const approveStaffNotes = document.getElementById('approveStaffNotes');
    const btnCloseApproveModal = document.getElementById('btnCloseApproveModal');
    const btnCancelApprove = document.getElementById('btnCancelApprove');

    // Reject Modal
    const rejectModal = document.getElementById('rejectModal');
    const rejectForm = document.getElementById('rejectForm');
    const rejectResId = document.getElementById('rejectResId');
    const modalRejectResId = document.getElementById('modalRejectResId');
    const rejectReason = document.getElementById('rejectReason');
    const btnCloseRejectModal = document.getElementById('btnCloseRejectModal');
    const btnCancelReject = document.getElementById('btnCancelReject');

    // Delete Modal
    const deleteModal = document.getElementById('deleteModal');
    const deleteForm = document.getElementById('deleteForm');
    const deleteResId = document.getElementById('deleteResId');
    const modalDeleteResId = document.getElementById('modalDeleteResId');
    const btnCloseDeleteModal = document.getElementById('btnCloseDeleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');

    // --- INITIALIZATION ---
    function init() {
        if (authToken) {
            showDashboard();
            fetchReservations();
            // Start polling every 10 seconds for live updates
            setInterval(fetchReservations, 10000);
        } else {
            showLogin();
        }

        bindEvents();
    }

    function showLogin() {
        loginModal.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }

    function showDashboard() {
        loginModal.style.display = 'none';
        adminDashboard.style.display = 'block';
    }

    // --- DATE HELPERS ---
    function formatDateShort(date) {
        if (!date) return '';
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    }

    function formatFullTitle(date) {
        if (!date) return 'Todas las Fechas';
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    function setDateFilter(dateObj) {
        selectedDateFilter = dateObj;
        
        // Update quick pills UI
        [btnFilterAllDates, btnFilterToday, btnFilterTomorrow].forEach(b => b.classList.remove('active'));

        if (!dateObj) {
            selectedDateTitle.textContent = 'Todas las Fechas';
            btnFilterAllDates.classList.add('active');
            datePicker.value = '';
        } else {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            if (dateObj.toDateString() === today.toDateString()) {
                btnFilterToday.classList.add('active');
            } else if (dateObj.toDateString() === tomorrow.toDateString()) {
                btnFilterTomorrow.classList.add('active');
            }

            selectedDateTitle.textContent = formatFullTitle(dateObj);
            
            // Set datePicker HTML5 YYYY-MM-DD
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            datePicker.value = `${yyyy}-${mm}-${dd}`;
        }

        updateMetrics();
        renderReservations();
    }

    // --- FETCH RESERVATIONS ---
    async function fetchReservations() {
        try {
            const res = await fetch('/api/admin/reservations');
            const data = await res.json();

            if (data.success) {
                reservationsData = data.reservations || [];
                updateMetrics();
                renderReservations();
            }
        } catch (err) {
            console.error('Error cargando reservas:', err);
        }
    }

    // --- FILTER HELPER ---
    function getFilteredReservations() {
        let filtered = reservationsData;

        // Filter by Date
        if (selectedDateFilter) {
            const dateShortStr = formatDateShort(selectedDateFilter).toLowerCase();
            filtered = filtered.filter(r => r.dateStr && r.dateStr.toLowerCase().includes(dateShortStr));
        }

        // Filter by Tab Status
        if (currentFilterStatus !== 'ALL') {
            filtered = filtered.filter(r => r.status === currentFilterStatus);
        }

        // Filter by Search Query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                (r.customerName && r.customerName.toLowerCase().includes(q)) ||
                (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
                (r.customerPhone && r.customerPhone.includes(q)) ||
                (r.id && r.id.toLowerCase().includes(q))
            );
        }

        return filtered;
    }

    // --- METRICS ---
    function updateMetrics() {
        let pool = reservationsData;
        if (selectedDateFilter) {
            const dateShortStr = formatDateShort(selectedDateFilter).toLowerCase();
            pool = pool.filter(r => r.dateStr && r.dateStr.toLowerCase().includes(dateShortStr));
        }

        const pending = pool.filter(r => r.status === 'PENDIENTE').length;
        const confirmed = pool.filter(r => r.status === 'CONFIRMADA').length;
        const totalDiners = pool
            .filter(r => r.status === 'CONFIRMADA')
            .reduce((sum, r) => sum + (parseInt(r.diners, 10) || 0), 0);

        countPending.textContent = pending;
        badgePending.textContent = pending;
        countConfirmed.textContent = confirmed;
        countTotalDiners.textContent = totalDiners;
        countTotal.textContent = pool.length;
    }

    // --- RENDER RESERVATIONS GRID ---
    function renderReservations() {
        const filtered = getFilteredReservations();

        reservationsGrid.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(res => {
            const card = document.createElement('div');
            card.className = `res-card status-${res.status.toLowerCase()}`;

            const actionButtonsHtml = res.status === 'PENDIENTE' ? `
                <div class="res-card-actions">
                    <button class="btn-approve" onclick="openApproveModal('${res.id}')">
                        🟢 Aprobar Mesa
                    </button>
                    <button class="btn-reject" onclick="openRejectModal('${res.id}')">
                        🔴 Rechazar
                    </button>
                </div>
            ` : res.status === 'CONFIRMADA' ? `
                <div class="res-card-actions">
                    <button class="btn-reject" style="width: 100%;" onclick="openRejectModal('${res.id}')">
                        Cambiar a Rechazada
                    </button>
                </div>
            ` : `
                <div class="res-card-actions">
                    <button class="btn-approve" style="width: 100%;" onclick="openApproveModal('${res.id}')">
                        Re-Aprobar Reserva
                    </button>
                </div>
            `;

            const tableNameHtml = res.tableName ? `
                <div class="res-detail-row">
                    <span class="res-detail-label">Nota / Mesa:</span>
                    <span class="res-detail-val" style="color: #22C55E;">${res.tableName}</span>
                </div>
            ` : '';

            card.innerHTML = `
                <div>
                    <div class="res-card-header">
                        <span class="res-id">${res.id}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="res-status-badge ${res.status}">${res.status}</span>
                            <button class="btn-delete-icon" onclick="openDeleteModal('${res.id}')" title="Eliminar reserva">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <h3 class="res-customer-name">${res.customerName}</h3>
                    <div class="res-contact-info">
                        📧 ${res.customerEmail}<br>
                        📱 ${res.customerPhone}
                    </div>

                    <div class="res-details-box">
                        <div class="res-detail-row">
                            <span class="res-detail-label">Comensales:</span>
                            <span class="res-detail-val">${res.diners} personas</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Fecha:</span>
                            <span class="res-detail-val">${res.dateStr}</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Turno:</span>
                            <span class="res-detail-val">${res.timeSlot}</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Sector Preferido:</span>
                            <span class="res-detail-val">${res.locationPref}</span>
                        </div>
                        ${tableNameHtml}
                    </div>

                    ${res.customerNotes ? `
                        <div class="res-notes-box">
                            <strong>Nota Cliente:</strong> ${res.customerNotes}
                        </div>
                    ` : ''}

                    ${res.staffNotes ? `
                        <div class="res-notes-box" style="border-color: #22C55E; background: rgba(34,197,94,0.08);">
                            <strong>Mensaje Staff:</strong> ${res.staffNotes}
                        </div>
                    ` : ''}
                </div>

                ${actionButtonsHtml}
            `;

            reservationsGrid.appendChild(card);
        });
    }

    // --- MODAL CONTROLS ---
    window.openApproveModal = function(resId) {
        approveResId.value = resId;
        modalResId.textContent = `[${resId}]`;
        approveTableName.value = '';
        approveStaffNotes.value = '';
        approveModal.classList.add('active');
    };

    function closeApproveModal() {
        approveModal.classList.remove('active');
    }

    window.openRejectModal = function(resId) {
        rejectResId.value = resId;
        modalRejectResId.textContent = `[${resId}]`;
        rejectReason.value = '';
        rejectModal.classList.add('active');
    };

    function closeRejectModal() {
        rejectModal.classList.remove('active');
    }

    window.openDeleteModal = function(resId) {
        deleteResId.value = resId;
        modalDeleteResId.textContent = `[${resId}]`;
        deleteModal.classList.add('active');
    };

    function closeDeleteModal() {
        deleteModal.classList.remove('active');
    }

    // --- EVENT BINDINGS ---
    function bindEvents() {
        // Login Form
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = adminPassword.value.trim();

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const data = await res.json();

                if (data.success && data.token) {
                    authToken = data.token;
                    sessionStorage.setItem('montebello_admin_token', authToken);
                    loginError.textContent = '';
                    showDashboard();
                    fetchReservations();
                } else {
                    loginError.textContent = data.message || 'Contraseña incorrecta.';
                }
            } catch (err) {
                loginError.textContent = 'Error al verificar contraseña.';
            }
        });

        // Logout
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('montebello_admin_token');
            authToken = null;
            showLogin();
        });

        // Refresh
        btnRefresh.addEventListener('click', fetchReservations);

        // Search Input
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderReservations();
        });

        // Calendar Controls
        btnFilterAllDates.addEventListener('click', () => setDateFilter(null));
        
        btnFilterToday.addEventListener('click', () => {
            setDateFilter(new Date());
        });

        btnFilterTomorrow.addEventListener('click', () => {
            const tom = new Date();
            tom.setDate(tom.getDate() + 1);
            setDateFilter(tom);
        });

        btnPrevDay.addEventListener('click', () => {
            const base = selectedDateFilter ? new Date(selectedDateFilter) : new Date();
            base.setDate(base.getDate() - 1);
            setDateFilter(base);
        });

        btnNextDay.addEventListener('click', () => {
            const base = selectedDateFilter ? new Date(selectedDateFilter) : new Date();
            base.setDate(base.getDate() + 1);
            setDateFilter(base);
        });

        datePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                const parts = e.target.value.split('-');
                const pickedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                setDateFilter(pickedDate);
            }
        });

        // Tabs
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilterStatus = btn.dataset.status;
                renderReservations();
            });
        });

        // Approve Modal Form Submit
        approveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = approveResId.value;
            const tableName = approveTableName.value.trim();
            const staffNotes = approveStaffNotes.value.trim();

            try {
                const res = await fetch(`/api/admin/reservations/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'CONFIRMADA',
                        tableName,
                        staffNotes
                    })
                });

                const data = await res.json();
                if (data.success) {
                    closeApproveModal();
                    fetchReservations();
                } else {
                    alert(data.message || 'Error al confirmar reserva.');
                }
            } catch (err) {
                alert('Error de conexión.');
            }
        });

        // Reject Modal Form Submit
        rejectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = rejectResId.value;
            const staffNotes = rejectReason.value.trim();

            try {
                const res = await fetch(`/api/admin/reservations/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'RECHAZADA',
                        staffNotes
                    })
                });

                const data = await res.json();
                if (data.success) {
                    closeRejectModal();
                    fetchReservations();
                } else {
                    alert(data.message || 'Error al rechazar reserva.');
                }
            } catch (err) {
                alert('Error de conexión.');
            }
        });

        // Delete Modal Form Submit
        deleteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = deleteResId.value;

            try {
                const res = await fetch(`/api/admin/reservations/${id}`, {
                    method: 'DELETE'
                });

                const data = await res.json();
                if (data.success) {
                    closeDeleteModal();
                    fetchReservations();
                } else {
                    alert(data.message || 'Error al eliminar reserva.');
                }
            } catch (err) {
                alert('Error de conexión.');
            }
        });

        // Modal Close Buttons
        btnCloseApproveModal.addEventListener('click', closeApproveModal);
        btnCancelApprove.addEventListener('click', closeApproveModal);

        btnCloseRejectModal.addEventListener('click', closeRejectModal);
        btnCancelReject.addEventListener('click', closeRejectModal);

        btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
        btnCancelDelete.addEventListener('click', closeDeleteModal);
    }

    init();
});
