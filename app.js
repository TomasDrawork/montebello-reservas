/* ==========================================================================
   Club Montebello - JavaScript Application Logic + Fixed Reservation Slots
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION & CONSTANTS ---
    const CONFIG = {
        whatsappNumber: '5493541760808', // Montebello WhatsApp Business Number
        maxDaysAhead: 60,
        closedDays: [1, 2] // 1 = Lunes, 2 = Martes
    };

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

    // --- APPLICATION STATE ---
    const state = {
        currentStep: 0,
        diners: 2,
        selectedDate: null, // Date object
        selectedTime: null, // String "Cena (21:30 hs)"
        locationPref: 'Indistinto',
        customerName: '',
        customerPhone: '',
        customerNotes: '',
        // Calendar Modal View State
        viewMonth: new Date().getMonth(),
        viewYear: new Date().getFullYear()
    };

    let availabilityConfig = {
        closedWeekdays: [1, 2],
        blockedDates: [],
        allowedOverrideDates: [],
        dateSlotOverrides: {}
    };

    async function fetchAvailability() {
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

    function isDateBlocked(dateObj) {
        if (!dateObj) return true;
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayOfWeek = dateObj.getDay();

        const overrideMode = availabilityConfig.dateSlotOverrides ? availabilityConfig.dateSlotOverrides[dateStr] : null;
        if (overrideMode === 'CLOSED') return true;
        if (overrideMode === 'LUNCH_ONLY' || overrideMode === 'DINNER_ONLY' || overrideMode === 'BOTH') return false;

        if (availabilityConfig.blockedDates.includes(dateStr)) return true;
        if (availabilityConfig.allowedOverrideDates.includes(dateStr)) return false;
        if (availabilityConfig.closedWeekdays.includes(dayOfWeek)) return true;
        return false;
    }

    // --- DOM ELEMENTS ---
    const panes = {
        step0: document.getElementById('step0'),
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        step4: document.getElementById('step4'),
        step5: document.getElementById('step5')
    };

    const btnStartReservation = document.getElementById('btnStartReservation');
    const btnToStep2 = document.getElementById('btnToStep2');
    const btnBackStep = document.getElementById('btnBackStep');
    const progressBarFill = document.getElementById('progressBarFill');

    // Diners Elements
    const customDinersNum = document.getElementById('customDinersNum');
    const customDinersUnit = document.getElementById('customDinersUnit');
    const customDinersSub = document.getElementById('customDinersSub');
    const btnDecrementDiners = document.getElementById('btnDecrementDiners');
    const btnIncrementDiners = document.getElementById('btnIncrementDiners');
    const btnDinersLabel = document.getElementById('btnDinersLabel');

    // Step 2 & 3 Elements
    const pillDinersText = document.getElementById('pillDinersText');
    const pillDinersTextStep3 = document.getElementById('pillDinersTextStep3');
    const pillDateTextStep3 = document.getElementById('pillDateTextStep3');
    const dateCarousel = document.getElementById('dateCarousel');
    const carouselPrev = document.getElementById('carouselPrev');
    const carouselNext = document.getElementById('carouselNext');
    const btnOpenCalendar = document.getElementById('btnOpenCalendar');
    const timeSlotsContainer = document.getElementById('timeSlotsContainer');

    // Custom Calendar Modal Elements
    const calendarModal = document.getElementById('calendarModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modalPrevMonth = document.getElementById('modalPrevMonth');
    const modalNextMonth = document.getElementById('modalNextMonth');
    const modalMonthTitle = document.getElementById('modalMonthTitle');
    const modalDaysGrid = document.getElementById('modalDaysGrid');

    // Contact Form & Submit
    const contactForm = document.getElementById('contactForm');
    const inputName = document.getElementById('inputName');
    const inputEmail = document.getElementById('inputEmail');
    const inputPhone = document.getElementById('inputPhone');
    const inputNotes = document.getElementById('inputNotes');
    const btnSubmitWhatsApp = document.getElementById('btnSubmitWhatsApp');
    const finalSummaryCard = document.getElementById('finalSummaryCard');
    const btnRestart = document.getElementById('btnRestart');


    // --- INITIALIZATION ---
    async function init() {
        preloadBackgroundImages();
        await fetchAvailability();
        renderDateCarousel();
        bindEvents();
        updateUI();
    }

    function preloadBackgroundImages() {
        const bgSources = ['imagenes/fondo-vino.jpg', 'imagenes/fondo-coctel.jpg'];
        bgSources.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    function updateBackgroundImage(stepNumber) {
        const bg1 = document.getElementById('bgImage1');
        const bg2 = document.getElementById('bgImage2');
        if (!bg1 || !bg2) return;

        const targetSrc = (stepNumber === 0) ? 'imagenes/fondo-vino.jpg' : 'imagenes/fondo-coctel.jpg';
        
        const isBg1Active = bg1.classList.contains('active');
        const activeBg = isBg1Active ? bg1 : bg2;
        const inactiveBg = isBg1Active ? bg2 : bg1;

        if (activeBg.getAttribute('src') && activeBg.getAttribute('src').includes(targetSrc)) {
            return;
        }

        inactiveBg.src = targetSrc;
        inactiveBg.classList.add('active');
        activeBg.classList.remove('active');
    }

    // --- STEP NAVIGATION ---
    function goToStep(stepNumber) {
        if (stepNumber < 0 || stepNumber > 5) return;
        state.currentStep = stepNumber;

        // Dynamic Background Transition (Seamless Crossfade)
        updateBackgroundImage(stepNumber);

        // Hide all panes
        Object.values(panes).forEach(pane => pane.classList.remove('active'));

        // Show target pane
        panes[`step${stepNumber}`].classList.add('active');

        // Update progress bar
        const progressMap = { 0: 0, 1: 25, 2: 50, 3: 75, 4: 95, 5: 100 };
        progressBarFill.style.width = `${progressMap[stepNumber]}%`;

        // Footer Back Button state
        if (stepNumber === 0 || stepNumber === 5) {
            btnBackStep.style.visibility = 'hidden';
        } else {
            btnBackStep.style.visibility = 'visible';
        }

        // Auto update pills
        updateSummaryPills();

        // Scroll to top of widget
        document.getElementById('widgetCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function updateSummaryPills() {
        const dinersStr = `${state.diners} ${state.diners === 1 ? 'Persona' : 'Personas'}`;
        if (pillDinersText) pillDinersText.textContent = dinersStr;
        if (pillDinersTextStep3) pillDinersTextStep3.textContent = dinersStr;

        if (state.selectedDate && pillDateTextStep3) {
            pillDateTextStep3.textContent = formatDateShort(state.selectedDate);
        }
    }

    // --- UNIFIED DINERS COUNTER LOGIC ---
    function setDiners(count) {
        state.diners = Math.max(1, Math.min(20, count));
        if (customDinersNum) customDinersNum.textContent = state.diners;
        
        if (customDinersUnit) {
            customDinersUnit.textContent = state.diners === 1 ? 'persona' : 'personas';
        }

        if (customDinersSub) {
            if (state.diners === 1) {
                customDinersSub.textContent = 'Individual';
            } else if (state.diners === 2) {
                customDinersSub.textContent = 'Con compañía';
            } else if (state.diners <= 5) {
                customDinersSub.textContent = 'Grupo pequeño';
            } else {
                customDinersSub.textContent = 'Mesa grande / Evento';
            }
        }

        if (btnDinersLabel) {
            btnDinersLabel.textContent = `${state.diners} ${state.diners === 1 ? 'COMENSAL' : 'COMENSALES'}`;
        }
    }

    // --- DATE CAROUSEL LOGIC ---
    function renderDateCarousel() {
        dateCarousel.innerHTML = '';
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const isClosed = isDateBlocked(date);

            const card = document.createElement('div');
            card.className = `date-card ${isClosed ? 'closed' : ''}`;
            if (state.selectedDate && isSameDay(date, state.selectedDate)) {
                card.classList.add('active');
            }
            
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('es-ES', { month: 'short' });

            card.innerHTML = `
                <span class="date-day-name">${dayName}</span>
                <span class="date-day-num">${dayNum}</span>
                <span class="date-month-name">${monthName}</span>
                ${isClosed ? '<span class="closed-badge">Cerrado</span>' : ''}
            `;

            if (!isClosed) {
                card.addEventListener('click', () => {
                    selectDate(date);
                });
            }

            dateCarousel.appendChild(card);
        }
    }

    function selectDate(date) {
        state.selectedDate = date;
        renderDateCarousel();
        renderTimeSlotsForDate(date);
        goToStep(3);
    }

    // --- CUSTOM CALENDAR MODAL LOGIC ---
    function openCalendarModal() {
        const initialDate = state.selectedDate || new Date();
        state.viewMonth = initialDate.getMonth();
        state.viewYear = initialDate.getFullYear();
        renderModalCalendar();
        calendarModal.classList.add('active');
    }

    function closeCalendarModal() {
        calendarModal.classList.remove('active');
    }

    function renderModalCalendar() {
        modalDaysGrid.innerHTML = '';

        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        modalMonthTitle.textContent = `${months[state.viewMonth]} ${state.viewYear}`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First day of current view month
        const firstDayOfMonth = new Date(state.viewYear, state.viewMonth, 1);
        const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();

        // Get starting day index (0 = Monday in ES calendar)
        let startingDay = firstDayOfMonth.getDay() - 1;
        if (startingDay < 0) startingDay = 6; // Sunday = 6

        // Empty padding cells
        for (let i = 0; i < startingDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'modal-day-cell disabled';
            modalDaysGrid.appendChild(emptyCell);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(state.viewYear, state.viewMonth, day);
            cellDate.setHours(0, 0, 0, 0);

            const isClosed = isDateBlocked(cellDate);
            const isPast = cellDate < today;

            const cell = document.createElement('div');
            cell.className = 'modal-day-cell';
            cell.textContent = day;

            if (isPast) {
                cell.classList.add('disabled');
            } else if (isClosed) {
                cell.classList.add('closed');
            } else {
                if (state.selectedDate && isSameDay(cellDate, state.selectedDate)) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    closeCalendarModal();
                    selectDate(cellDate);
                });
            }

            modalDaysGrid.appendChild(cell);
        }
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // --- FIXED RESERVATION SLOTS LOGIC ---
    // Almuerzo: 13:00 hs (Solo Sábados y Domingos)
    // Cena: 21:30 hs (Miércoles a Domingos)
    function renderTimeSlotsForDate(date) {
        timeSlotsContainer.innerHTML = '';

        if (isDateBlocked(date)) {
            timeSlotsContainer.innerHTML = `<p class="step-subtitle">El restaurante permanece cerrado para esta fecha.</p>`;
            return;
        }

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayOfWeek = date.getDay();

        const overrideMode = availabilityConfig.dateSlotOverrides ? availabilityConfig.dateSlotOverrides[dateStr] : null;

        let slots = [];

        if (overrideMode === 'LUNCH_ONLY') {
            slots = [
                { title: 'Almuerzo', time: '13:00 hs', icon: '☀️', desc: 'Horario Especial de Almuerzo' }
            ];
        } else if (overrideMode === 'DINNER_ONLY') {
            slots = [
                { title: 'Cena', time: '21:00 hs', icon: '🍷', desc: 'Primer Turno de Cena' },
                { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Segundo Turno de Cena' }
            ];
        } else if (overrideMode === 'BOTH') {
            slots = [
                { title: 'Almuerzo', time: '13:00 hs', icon: '☀️', desc: 'Turno de Almuerzo Habilitado' },
                { title: 'Cena', time: '21:00 hs', icon: '🍷', desc: 'Primer Turno de Cena' },
                { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Segundo Turno de Cena' }
            ];
        } else {
            if (dayOfWeek === 1 || dayOfWeek === 2) {
                slots = [
                    { title: 'Cena Especial', time: '21:00 hs', icon: '🍷', desc: 'Primer Turno de Cena' },
                    { title: 'Cena Especial', time: '21:30 hs', icon: '🍷', desc: 'Segundo Turno de Cena' }
                ];
            } else if (dayOfWeek >= 3 && dayOfWeek <= 5) {
                slots = [
                    { title: 'Cena', time: '21:00 hs', icon: '🍷', desc: 'Primer Turno de Cena' },
                    { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Segundo Turno de Cena' }
                ];
            } else if (dayOfWeek === 6 || dayOfWeek === 0) {
                slots = [
                    { title: 'Almuerzo', time: '13:00 hs', icon: '☀️', desc: 'Turno de Almuerzo Habilitado' },
                    { title: 'Cena', time: '21:00 hs', icon: '🍷', desc: 'Primer Turno de Cena' },
                    { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Segundo Turno de Cena' }
                ];
            }
        }

        slots.forEach(slotObj => {
            const btn = document.createElement('button');
            btn.className = 'time-slot-btn fixed-slot';
            btn.innerHTML = `
                <span class="slot-icon">${slotObj.icon}</span>
                <div class="slot-text-block">
                    <span class="slot-title-text">${slotObj.title} - ${slotObj.time}</span>
                    <span class="slot-desc-text">${slotObj.desc}</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.selectedTime = `${slotObj.title} (${slotObj.time})`;
                goToStep(4);
            });

            timeSlotsContainer.appendChild(btn);
        });
    }

    // --- FORMAT DATE HELPERS ---
    function formatDateShort(date) {
        if (!date) return '';
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const dayNum = date.getDate();
        const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
        return `${capitalize(dayName)} ${dayNum} ${capitalize(monthName)}`;
    }

    function formatDateFull(date) {
        if (!date) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return capitalize(date.toLocaleDateString('es-ES', options));
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // --- RESERVATION API SUBMISSION ---
    async function handleReservationSubmit() {
        state.customerName = inputName ? inputName.value.trim() : '';
        state.customerPhone = inputPhone ? inputPhone.value.trim() : '';
        state.customerNotes = inputNotes ? inputNotes.value.trim() : '';

        const selectedPref = document.querySelector('input[name="locationPref"]:checked');
        state.locationPref = selectedPref ? selectedPref.value : 'Indistinto';

        if (!state.customerName || !state.customerPhone) {
            alert('Por favor completa tu nombre y número de teléfono celular (WhatsApp) para continuar.');
            return;
        }

        const dateFormatted = formatDateShort(state.selectedDate);

        // Disable submit button during request
        btnSubmitWhatsApp.disabled = true;
        btnSubmitWhatsApp.innerHTML = `Enviando Solicitud...`;

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    diners: state.diners,
                    dateStr: dateFormatted,
                    timeSlot: state.selectedTime,
                    locationPref: state.locationPref,
                    customerName: state.customerName,
                    customerEmail: 'noreply@clubmontebello.com',
                    customerPhone: state.customerPhone,
                    customerNotes: state.customerNotes
                })
            });

            const data = await response.json();

            if (data.success && data.reservation) {
                const res = data.reservation;
                // Populate final summary card
                finalSummaryCard.innerHTML = `
                    <div style="text-align: center; margin-bottom: 14px;">
                        <span style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.35); color: #FFFFFF; font-family: 'Outfit', sans-serif; font-weight: 700; padding: 6px 16px; border-radius: 20px; font-size: 14px; display: inline-block;">
                            CÓDIGO: ${escapeHtml(res.id)}
                        </span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Nombre:</span>
                        <span class="summary-val">${escapeHtml(res.customerName)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Teléfono (WhatsApp):</span>
                        <span class="summary-val">${escapeHtml(res.customerPhone)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Comensales:</span>
                        <span class="summary-val">${escapeHtml(String(res.diners))} personas</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Fecha:</span>
                        <span class="summary-val">${escapeHtml(res.dateStr)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Turno:</span>
                        <span class="summary-val">${escapeHtml(res.timeSlot)}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Ubicación:</span>
                        <span class="summary-val">${escapeHtml(res.locationPref)}</span>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.08); border-left: 3px solid #FFFFFF; padding: 14px; border-radius: 8px; font-size: 13.5px; color: rgba(255, 255, 255, 0.85); margin-top: 14px; text-align: left;">
                        ⏳ <strong>Estado: Pendiente de Confirmación</strong>.<br>Te enviaremos una notificación por WhatsApp al celular <strong>${escapeHtml(res.customerPhone)}</strong> en cuanto el maitre apruebe tu mesa.
                    </div>
                    <div style="margin-top: 20px;">
                        <a href="https://wa.me/5493541760808?text=${encodeURIComponent('Hola Club Montebello, acabo de solicitar la reserva ' + res.id + ' a nombre de ' + res.customerName)}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: #FFF; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 600; font-size: 14px; width: 100%; box-shadow: 0 4px 12px rgba(37,211,102,0.3);">
                            💬 Abrir Chat de WhatsApp con Montebello
                        </a>
                    </div>
                `;

                goToStep(5);
            } else {
                alert(data.message || 'Ocurrió un error al registrar tu solicitud. Por favor reintenta.');
            }
        } catch (err) {
            console.error('Error enviando reserva:', err);
            alert('Error de conexión al servidor. Por favor verifica tu red e intenta nuevamente.');
        } finally {
            btnSubmitWhatsApp.disabled = false;
            btnSubmitWhatsApp.innerHTML = `
                <svg class="wa-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                SOLICITAR RESERVA AHORA
            `;
        }
    }

    // --- EVENT BINDINGS ---
    function bindEvents() {
        btnStartReservation.addEventListener('click', () => goToStep(1));
        btnToStep2.addEventListener('click', () => goToStep(2));

        btnBackStep.addEventListener('click', () => {
            if (state.currentStep > 0 && state.currentStep < 5) {
                goToStep(state.currentStep - 1);
            }
        });

        // Single Unified Diners Counter Buttons
        btnDecrementDiners.addEventListener('click', () => setDiners(state.diners - 1));
        btnIncrementDiners.addEventListener('click', () => setDiners(state.diners + 1));

        // Date Carousel Controls
        carouselPrev.addEventListener('click', () => {
            dateCarousel.scrollBy({ left: -220, behavior: 'smooth' });
        });
        carouselNext.addEventListener('click', () => {
            dateCarousel.scrollBy({ left: 220, behavior: 'smooth' });
        });

        // Custom Modal Calendar Events
        btnOpenCalendar.addEventListener('click', openCalendarModal);
        btnCloseModal.addEventListener('click', closeCalendarModal);
        
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) closeCalendarModal();
        });

        modalPrevMonth.addEventListener('click', () => {
            const today = new Date();
            if (state.viewYear > today.getFullYear() || (state.viewYear === today.getFullYear() && state.viewMonth > today.getMonth())) {
                state.viewMonth--;
                if (state.viewMonth < 0) {
                    state.viewMonth = 11;
                    state.viewYear--;
                }
                renderModalCalendar();
            }
        });

        modalNextMonth.addEventListener('click', () => {
            state.viewMonth++;
            if (state.viewMonth > 11) {
                state.viewMonth = 0;
                state.viewYear++;
            }
            renderModalCalendar();
        });

        // Submit Form
        btnSubmitWhatsApp.addEventListener('click', handleReservationSubmit);

        // Rooftop Location Notice Modal
        const rooftopModal = document.getElementById('rooftopModal');
        const btnCloseRooftopModal = document.getElementById('btnCloseRooftopModal');
        const btnCloseRooftopTop = document.getElementById('btnCloseRooftopTop');

        window.openRooftopNotice = function() {
            if (rooftopModal) rooftopModal.classList.add('active');
        };

        window.closeRooftopNotice = function() {
            if (rooftopModal) rooftopModal.classList.remove('active');
        };

        document.addEventListener('click', (e) => {
            const chip = e.target.closest('.pref-chip');
            if (chip) {
                const radio = chip.querySelector('input[name="locationPref"]');
                if (radio && radio.value === 'Rooftop') {
                    window.openRooftopNotice();
                }
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target && e.target.name === 'locationPref' && e.target.value === 'Rooftop') {
                window.openRooftopNotice();
            }
        });

        if (btnCloseRooftopModal) btnCloseRooftopModal.addEventListener('click', window.closeRooftopNotice);
        if (btnCloseRooftopTop) btnCloseRooftopTop.addEventListener('click', window.closeRooftopNotice);
        if (rooftopModal) {
            rooftopModal.addEventListener('click', (e) => {
                if (e.target === rooftopModal) window.closeRooftopNotice();
            });
        }

        // Restart
        btnRestart.addEventListener('click', () => {
            contactForm.reset();
            setDiners(2);
            goToStep(0);
        });
    }

    function updateUI() {
        setDiners(2);
    }

    // Start App
    init();
});
