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
    const datePickerWrapper = document.getElementById('datePickerWrapper');
    const btnPrevDay = document.getElementById('btnPrevDay');
    const btnNextDay = document.getElementById('btnNextDay');
    const datePicker = document.getElementById('datePicker');
    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const btnFilterAllDates = document.getElementById('btnFilterAllDates');
    const btnFilterToday = document.getElementById('btnFilterToday');
    const btnFilterTomorrow = document.getElementById('btnFilterTomorrow');

    // Custom Admin Monthly Calendar Modal Elements
    const adminCalendarModal = document.getElementById('adminCalendarModal');
    const btnCloseAdminCalendar = document.getElementById('btnCloseAdminCalendar');
    const adminCalPrevMonth = document.getElementById('adminCalPrevMonth');
    const adminCalNextMonth = document.getElementById('adminCalNextMonth');
    const adminCalMonthTitle = document.getElementById('adminCalMonthTitle');
    const adminCalDaysGrid = document.getElementById('adminCalDaysGrid');
    const btnAdminCalAllDates = document.getElementById('btnAdminCalAllDates');

    let adminCalMonth = new Date().getMonth();
    let adminCalYear = new Date().getFullYear();

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

    // Availability Modal Elements
    const btnManageAvailability = document.getElementById('btnManageAvailability');
    const availabilityModal = document.getElementById('availabilityModal');
    const btnCloseAvailability = document.getElementById('btnCloseAvailability');
    const availCalPrevMonth = document.getElementById('availCalPrevMonth');
    const availCalNextMonth = document.getElementById('availCalNextMonth');
    const availCalMonthTitle = document.getElementById('availCalMonthTitle');
    const availCalDaysGrid = document.getElementById('availCalDaysGrid');
    const btnBlockCurrentMonth = document.getElementById('btnBlockCurrentMonth');
    const btnOpenCurrentMonth = document.getElementById('btnOpenCurrentMonth');
    const btnResetDefaults = document.getElementById('btnResetDefaults');
    const btnSaveAvailability = document.getElementById('btnSaveAvailability');

    // Day Slots Modal Elements
    const daySlotsModal = document.getElementById('daySlotsModal');
    const btnCloseDaySlotsModal = document.getElementById('btnCloseDaySlotsModal');
    const daySlotsModalDateTitle = document.getElementById('daySlotsModalDateTitle');
    const btnSlotOptions = document.querySelectorAll('.btn-slot-option');
    let activeDaySlotsDateStr = null;

    let availabilityConfig = {
        closedWeekdays: [1, 2],
        blockedDates: [],
        allowedOverrideDates: [],
        dateSlotOverrides: {}
    };
    let availViewMonth = new Date().getMonth();
    let availViewYear = new Date().getFullYear();

    // --- INITIALIZATION ---
    function init() {
        if (authToken) {
            showDashboard();
            fetchReservations();
            fetchAvailabilitySettings();
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
            if (datePicker) datePicker.value = '';
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
            
            if (datePicker) {
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                datePicker.value = `${yyyy}-${mm}-${dd}`;
            }
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

    // --- UTILS: SANITIZATION ---
    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return str || '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
                    <button class="btn-approve" onclick="openApproveModal('${escapeHtml(res.id)}')">
                        🟢 Aprobar Mesa
                    </button>
                    <button class="btn-reject" onclick="openRejectModal('${escapeHtml(res.id)}')">
                        🔴 Rechazar
                    </button>
                </div>
            ` : res.status === 'CONFIRMADA' ? `
                <div class="res-card-actions">
                    <button class="btn-reject" style="width: 100%;" onclick="openRejectModal('${escapeHtml(res.id)}')">
                        Cambiar a Rechazada
                    </button>
                </div>
            ` : `
                <div class="res-card-actions">
                    <button class="btn-approve" style="width: 100%;" onclick="openApproveModal('${escapeHtml(res.id)}')">
                        Re-Aprobar Reserva
                    </button>
                </div>
            `;

            const tableNameHtml = res.tableName ? `
                <div class="res-detail-row">
                    <span class="res-detail-label">Nota / Mesa:</span>
                    <span class="res-detail-val" style="color: #22C55E;">${escapeHtml(res.tableName)}</span>
                </div>
            ` : '';

            const cleanPhone = (res.customerPhone || '').replace(/\D/g, '');
            const formattedPhone = (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) ? '549' + cleanPhone : cleanPhone;
            
            const waDirectUrl = `https://wa.me/${formattedPhone}`;

            const waBtnHtml = `
                <a href="${waDirectUrl}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #25D366; color: #FFFFFF; font-weight: 600; font-size: 13px; padding: 9px 12px; border-radius: 8px; text-decoration: none; margin-top: 8px; box-shadow: 0 2px 8px rgba(37,211,102,0.25);">
                    💬 Enviar WhatsApp al Cliente
                </a>
            `;

            card.innerHTML = `
                <div>
                    <div class="res-card-header">
                        <span class="res-id">${escapeHtml(res.id)}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="res-status-badge ${escapeHtml(res.status)}">${escapeHtml(res.status)}</span>
                            <button class="btn-delete-icon" onclick="openDeleteModal('${escapeHtml(res.id)}')" title="Eliminar reserva">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <h3 class="res-customer-name">${escapeHtml(res.customerName)}</h3>
                    <div class="res-contact-info">
                        📱 ${escapeHtml(res.customerPhone)}
                    </div>

                    <div class="res-details-box">
                        <div class="res-detail-row">
                            <span class="res-detail-label">Comensales:</span>
                            <span class="res-detail-val">${escapeHtml(String(res.diners))} personas</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Fecha:</span>
                            <span class="res-detail-val">${escapeHtml(res.dateStr)}</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Turno:</span>
                            <span class="res-detail-val">${escapeHtml(res.timeSlot)}</span>
                        </div>
                        <div class="res-detail-row">
                            <span class="res-detail-label">Sector Preferido:</span>
                            <span class="res-detail-val">${escapeHtml(res.locationPref)}</span>
                        </div>
                        ${tableNameHtml}
                    </div>

                    ${res.customerNotes ? `
                        <div class="res-notes-box">
                            <strong>Nota Cliente:</strong> ${escapeHtml(res.customerNotes)}
                        </div>
                    ` : ''}

                    ${res.staffNotes ? `
                        <div class="res-notes-box" style="border-color: #22C55E; background: rgba(34,197,94,0.08);">
                            <strong>Mensaje Staff:</strong> ${escapeHtml(res.staffNotes)}
                        </div>
                    ` : ''}
                </div>

                <div>
                    ${actionButtonsHtml}
                    ${waBtnHtml}
                </div>
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

    // --- ADMIN CALENDAR MODAL FUNCTIONS ---
    function openAdminCalendarModal() {
        if (selectedDateFilter) {
            adminCalMonth = selectedDateFilter.getMonth();
            adminCalYear = selectedDateFilter.getFullYear();
        } else {
            const now = new Date();
            adminCalMonth = now.getMonth();
            adminCalYear = now.getFullYear();
        }
        renderAdminCalendar();
        adminCalendarModal.classList.add('active');
    }

    function closeAdminCalendarModal() {
        adminCalendarModal.classList.remove('active');
    }

    function renderAdminCalendar() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        adminCalMonthTitle.textContent = `${monthNames[adminCalMonth]} ${adminCalYear}`;

        const firstDay = new Date(adminCalYear, adminCalMonth, 1).getDay();
        const daysInMonth = new Date(adminCalYear, adminCalMonth + 1, 0).getDate();
        const today = new Date();

        adminCalDaysGrid.innerHTML = '';

        // Empty cells before 1st day of month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'admin-day-cell empty';
            adminCalDaysGrid.appendChild(emptyCell);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'admin-day-cell';

            const dateObj = new Date(adminCalYear, adminCalMonth, day);

            // Check if today
            if (dateObj.toDateString() === today.toDateString()) {
                cell.classList.add('today');
            }

            // Check if selected
            if (selectedDateFilter && dateObj.toDateString() === selectedDateFilter.toDateString()) {
                cell.classList.add('selected');
            }

            // Count reservations on this date
            const dateShortStr = formatDateShort(dateObj).toLowerCase();
            const resCount = reservationsData.filter(r => r.dateStr && r.dateStr.toLowerCase().includes(dateShortStr)).length;

            let countHtml = '';
            if (resCount > 0) {
                countHtml = `<span class="res-count-dot">${resCount} res</span>`;
            }

            cell.innerHTML = `<span>${day}</span>${countHtml}`;

            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                setDateFilter(dateObj);
                closeAdminCalendarModal();
            });

            adminCalDaysGrid.appendChild(cell);
        }
    }

    // --- AVAILABILITY MANAGEMENT FUNCTIONS ---
    async function fetchAvailabilitySettings() {
        try {
            const res = await fetch('/api/availability');
            const data = await res.json();
            if (data.success && data.availability) {
                availabilityConfig = {
                    closedWeekdays: data.availability.closedWeekdays || [1, 2],
                    blockedDates: data.availability.blockedDates || [],
                    allowedOverrideDates: data.availability.allowedOverrideDates || [],
                    dateSlotOverrides: data.availability.dateSlotOverrides || {}
                };
            }
        } catch (err) {
            console.error('Error cargando disponibilidad:', err);
        }
    }

    function openAvailabilityModal() {
        const now = new Date();
        availViewMonth = now.getMonth();
        availViewYear = now.getFullYear();
        renderAvailabilityCalendar();
        availabilityModal.classList.add('active');
    }

    function closeAvailabilityModal() {
        availabilityModal.classList.remove('active');
    }

    function getFormattedDateStr(year, month, day) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    function isDateBlockedInConfig(dateObj) {
        const dateStr = getFormattedDateStr(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const dayOfWeek = dateObj.getDay();

        if (availabilityConfig.blockedDates.includes(dateStr)) return true;
        if (availabilityConfig.allowedOverrideDates.includes(dateStr)) return false;
        if (availabilityConfig.closedWeekdays.includes(dayOfWeek)) return true;
        return false;
    }

    function getDateSlotMode(dateObj, dateStr) {
        if (availabilityConfig.dateSlotOverrides && availabilityConfig.dateSlotOverrides[dateStr]) {
            return availabilityConfig.dateSlotOverrides[dateStr];
        }
        if (availabilityConfig.blockedDates && availabilityConfig.blockedDates.includes(dateStr)) {
            return 'CLOSED';
        }
        if (availabilityConfig.allowedOverrideDates && availabilityConfig.allowedOverrideDates.includes(dateStr)) {
            return 'BOTH';
        }
        const dayOfWeek = dateObj.getDay();
        if (availabilityConfig.closedWeekdays && availabilityConfig.closedWeekdays.includes(dayOfWeek)) {
            return 'CLOSED';
        }
        if (dayOfWeek >= 3 && dayOfWeek <= 5) {
            return 'DINNER_ONLY';
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
            return 'BOTH';
        }
        return 'CLOSED';
    }

    function renderAvailabilityCalendar() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        availCalMonthTitle.textContent = `${monthNames[availViewMonth]} ${availViewYear}`;

        const firstDay = new Date(availViewYear, availViewMonth, 1).getDay();
        let startingDay = firstDay - 1;
        if (startingDay < 0) startingDay = 6;

        const daysInMonth = new Date(availViewYear, availViewMonth + 1, 0).getDate();

        availCalDaysGrid.innerHTML = '';

        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'avail-day-cell empty';
            availCalDaysGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(availViewYear, availViewMonth, day);
            const dateStr = getFormattedDateStr(availViewYear, availViewMonth, day);
            const mode = getDateSlotMode(cellDate, dateStr);

            let cssClass = 'is-both';
            let labelText = '✨ Ambos';

            if (mode === 'CLOSED') {
                cssClass = 'is-blocked';
                labelText = '🔴 Cerrado';
            } else if (mode === 'LUNCH_ONLY') {
                cssClass = 'is-lunch';
                labelText = '☀️ Almuerzo';
            } else if (mode === 'DINNER_ONLY') {
                cssClass = 'is-dinner';
                labelText = '🍷 Cena';
            } else if (mode === 'BOTH') {
                cssClass = 'is-both';
                labelText = '✨ Ambos';
            }

            const cell = document.createElement('div');
            cell.className = `avail-day-cell ${cssClass}`;
            cell.innerHTML = `
                <span>${day}</span>
                <span class="day-status-label">${labelText}</span>
            `;

            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                openDaySlotsModal(cellDate, dateStr);
            });

            availCalDaysGrid.appendChild(cell);
        }
    }

    function openDaySlotsModal(dateObj, dateStr) {
        activeDaySlotsDateStr = dateStr;

        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const formattedTitle = `${days[dateObj.getDay()]} ${dateObj.getDate()} de ${months[dateObj.getMonth()]} (${dateStr})`;

        if (daySlotsModalDateTitle) {
            daySlotsModalDateTitle.textContent = formattedTitle;
        }

        const currentMode = getDateSlotMode(dateObj, dateStr);
        btnSlotOptions.forEach(btn => {
            if (btn.dataset.mode === currentMode) {
                btn.style.outline = '2px solid #FFFFFF';
                btn.style.boxShadow = '0 0 12px rgba(255, 255, 255, 0.4)';
            } else {
                btn.style.outline = 'none';
                btn.style.boxShadow = 'none';
            }
        });

        if (daySlotsModal) daySlotsModal.classList.add('active');
    }

    function closeDaySlotsModal() {
        if (daySlotsModal) daySlotsModal.classList.remove('active');
    }

    function selectDaySlotMode(mode) {
        if (!activeDaySlotsDateStr) return;
        const parts = activeDaySlotsDateStr.split('-');
        const cellDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayOfWeek = cellDate.getDay();

        if (!availabilityConfig.dateSlotOverrides) {
            availabilityConfig.dateSlotOverrides = {};
        }
        availabilityConfig.dateSlotOverrides[activeDaySlotsDateStr] = mode;

        if (mode === 'CLOSED') {
            availabilityConfig.allowedOverrideDates = (availabilityConfig.allowedOverrideDates || []).filter(d => d !== activeDaySlotsDateStr);
            if (!availabilityConfig.closedWeekdays.includes(dayOfWeek)) {
                if (!(availabilityConfig.blockedDates || []).includes(activeDaySlotsDateStr)) {
                    availabilityConfig.blockedDates.push(activeDaySlotsDateStr);
                }
            }
        } else {
            availabilityConfig.blockedDates = (availabilityConfig.blockedDates || []).filter(d => d !== activeDaySlotsDateStr);
            if (availabilityConfig.closedWeekdays.includes(dayOfWeek)) {
                if (!(availabilityConfig.allowedOverrideDates || []).includes(activeDaySlotsDateStr)) {
                    availabilityConfig.allowedOverrideDates.push(activeDaySlotsDateStr);
                }
            }
        }

        closeDaySlotsModal();
        renderAvailabilityCalendar();
    }

    function blockCurrentViewMonth() {
        const daysInMonth = new Date(availViewYear, availViewMonth + 1, 0).getDate();
        if (!availabilityConfig.dateSlotOverrides) availabilityConfig.dateSlotOverrides = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(availViewYear, availViewMonth, day);
            const dateStr = getFormattedDateStr(availViewYear, availViewMonth, day);
            const dayOfWeek = cellDate.getDay();

            availabilityConfig.dateSlotOverrides[dateStr] = 'CLOSED';

            availabilityConfig.allowedOverrideDates = (availabilityConfig.allowedOverrideDates || []).filter(d => d !== dateStr);
            if (!availabilityConfig.closedWeekdays.includes(dayOfWeek)) {
                if (!(availabilityConfig.blockedDates || []).includes(dateStr)) {
                    availabilityConfig.blockedDates.push(dateStr);
                }
            }
        }
        renderAvailabilityCalendar();
    }

    function openCurrentViewMonth() {
        const daysInMonth = new Date(availViewYear, availViewMonth + 1, 0).getDate();
        if (!availabilityConfig.dateSlotOverrides) availabilityConfig.dateSlotOverrides = {};

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(availViewYear, availViewMonth, day);
            const dateStr = getFormattedDateStr(availViewYear, availViewMonth, day);
            const dayOfWeek = cellDate.getDay();

            availabilityConfig.dateSlotOverrides[dateStr] = 'BOTH';

            availabilityConfig.blockedDates = (availabilityConfig.blockedDates || []).filter(d => d !== dateStr);
            if (availabilityConfig.closedWeekdays.includes(dayOfWeek)) {
                if (!(availabilityConfig.allowedOverrideDates || []).includes(dateStr)) {
                    availabilityConfig.allowedOverrideDates.push(dateStr);
                }
            }
        }
        renderAvailabilityCalendar();
    }

    function resetAvailabilityDefaults() {
        availabilityConfig.blockedDates = [];
        availabilityConfig.allowedOverrideDates = [];
        availabilityConfig.dateSlotOverrides = {};
        renderAvailabilityCalendar();
    }

    async function saveAvailabilitySettings() {
        btnSaveAvailability.disabled = true;
        btnSaveAvailability.textContent = 'Guardando...';

        try {
            const res = await fetch('/api/admin/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(availabilityConfig)
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Cambios de disponibilidad guardados correctamente.');
                closeAvailabilityModal();
            } else {
                alert(data.message || 'Error guardando disponibilidad.');
            }
        } catch (err) {
            alert('Error de conexión.');
        } finally {
            btnSaveAvailability.disabled = false;
            btnSaveAvailability.textContent = '💾 GUARDAR CAMBIOS DE DISPONIBILIDAD';
        }
    }

    // --- EVENT BINDINGS ---
    function bindEvents() {
        // Availability Event Listeners
        if (btnManageAvailability) btnManageAvailability.addEventListener('click', openAvailabilityModal);
        if (btnCloseAvailability) btnCloseAvailability.addEventListener('click', closeAvailabilityModal);
        if (btnCloseDaySlotsModal) btnCloseDaySlotsModal.addEventListener('click', closeDaySlotsModal);
        if (daySlotsModal) {
            daySlotsModal.addEventListener('click', (e) => {
                if (e.target === daySlotsModal) closeDaySlotsModal();
            });
        }
        btnSlotOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                if (mode) selectDaySlotMode(mode);
            });
        });
        if (availCalPrevMonth) {
            availCalPrevMonth.addEventListener('click', (e) => {
                e.stopPropagation();
                availViewMonth--;
                if (availViewMonth < 0) {
                    availViewMonth = 11;
                    availViewYear--;
                }
                renderAvailabilityCalendar();
            });
        }
        if (availCalNextMonth) {
            availCalNextMonth.addEventListener('click', (e) => {
                e.stopPropagation();
                availViewMonth++;
                if (availViewMonth > 11) {
                    availViewMonth = 0;
                    availViewYear++;
                }
                renderAvailabilityCalendar();
            });
        }
        if (btnBlockCurrentMonth) btnBlockCurrentMonth.addEventListener('click', blockCurrentViewMonth);
        if (btnOpenCurrentMonth) btnOpenCurrentMonth.addEventListener('click', openCurrentViewMonth);
        if (btnResetDefaults) btnResetDefaults.addEventListener('click', resetAvailabilityDefaults);
        if (btnSaveAvailability) btnSaveAvailability.addEventListener('click', saveAvailabilitySettings);

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

        // Admin Calendar Modal Trigger & Events
        if (datePickerWrapper) {
            datePickerWrapper.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openAdminCalendarModal();
            });
        }

        if (datePicker) {
            datePicker.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openAdminCalendarModal();
            });

            datePicker.addEventListener('change', (e) => {
                if (e.target.value) {
                    const parts = e.target.value.split('-');
                    const pickedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    setDateFilter(pickedDate);
                }
            });
        }

        btnCloseAdminCalendar.addEventListener('click', closeAdminCalendarModal);

        adminCalendarModal.addEventListener('click', (e) => {
            if (e.target === adminCalendarModal) {
                closeAdminCalendarModal();
            }
        });

        adminCalPrevMonth.addEventListener('click', (e) => {
            e.stopPropagation();
            adminCalMonth--;
            if (adminCalMonth < 0) {
                adminCalMonth = 11;
                adminCalYear--;
            }
            renderAdminCalendar();
        });

        adminCalNextMonth.addEventListener('click', (e) => {
            e.stopPropagation();
            adminCalMonth++;
            if (adminCalMonth > 11) {
                adminCalMonth = 0;
                adminCalYear++;
            }
            renderAdminCalendar();
        });

        btnAdminCalAllDates.addEventListener('click', (e) => {
            e.stopPropagation();
            setDateFilter(null);
            closeAdminCalendarModal();
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

            // Pre-open window synchronously to prevent iOS/Safari popup blockers
            const waWin = window.open('', '_blank');

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
                    if (data.waLink) {
                        if (waWin && !waWin.closed) {
                            waWin.location.href = data.waLink;
                        } else {
                            window.location.href = data.waLink;
                        }
                    } else if (waWin && !waWin.closed) {
                        waWin.close();
                    }
                } else {
                    if (waWin && !waWin.closed) waWin.close();
                    alert(data.message || 'Error al confirmar reserva.');
                }
            } catch (err) {
                if (waWin && !waWin.closed) waWin.close();
                alert('Error de conexión.');
            }
        });

        // Reject Modal Form Submit
        rejectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = rejectResId.value;
            const staffNotes = rejectReason.value.trim();

            // Pre-open window synchronously to prevent iOS/Safari popup blockers
            const waWin = window.open('', '_blank');

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
                    if (data.waLink) {
                        if (waWin && !waWin.closed) {
                            waWin.location.href = data.waLink;
                        } else {
                            window.location.href = data.waLink;
                        }
                    } else if (waWin && !waWin.closed) {
                        waWin.close();
                    }
                } else {
                    if (waWin && !waWin.closed) waWin.close();
                    alert(data.message || 'Error al rechazar reserva.');
                }
            } catch (err) {
                if (waWin && !waWin.closed) waWin.close();
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
