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
    const inputPhone = document.getElementById('inputPhone');
    const inputNotes = document.getElementById('inputNotes');
    const btnSubmitWhatsApp = document.getElementById('btnSubmitWhatsApp');
    const finalSummaryCard = document.getElementById('finalSummaryCard');
    const manualWaLink = document.getElementById('manualWaLink');
    const btnRestart = document.getElementById('btnRestart');


    // --- INITIALIZATION ---
    function init() {
        renderDateCarousel();
        bindEvents();
        updateUI();
    }

    // --- STEP NAVIGATION ---
    function goToStep(stepNumber) {
        if (stepNumber < 0 || stepNumber > 5) return;
        state.currentStep = stepNumber;

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

            const dayOfWeek = date.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar...
            const isClosed = CONFIG.closedDays.includes(dayOfWeek);

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

            const dayOfWeek = cellDate.getDay();
            const isClosed = CONFIG.closedDays.includes(dayOfWeek);
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
        const dayOfWeek = date.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb

        if (dayOfWeek === 1 || dayOfWeek === 2) {
            timeSlotsContainer.innerHTML = `<p class="step-subtitle">Los días Lunes y Martes el restaurante permanece cerrado.</p>`;
            return;
        }

        let slots = [];

        if (dayOfWeek >= 3 && dayOfWeek <= 5) {
            // Miércoles, Jueves y Viernes: Únicamente Cena 21:30 hs
            slots = [
                { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Horario Único de Cena' }
            ];
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
            // Sábados y Domingos: Almuerzo 13:00 hs y Cena 21:30 hs
            slots = [
                { title: 'Almuerzo', time: '13:00 hs', icon: '☀️', desc: 'Horario Único de Almuerzo' },
                { title: 'Cena', time: '21:30 hs', icon: '🍷', desc: 'Horario Único de Cena' }
            ];
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

    // --- WHATSAPP MESSAGE SUBMISSION ---
    function handleReservationSubmit() {
        state.customerName = inputName.value.trim();
        state.customerPhone = inputPhone.value.trim();
        state.customerNotes = inputNotes.value.trim();

        const selectedPref = document.querySelector('input[name="locationPref"]:checked');
        state.locationPref = selectedPref ? selectedPref.value : 'Indistinto';

        if (!state.customerName || !state.customerPhone) {
            alert('Por favor completa tu nombre y teléfono para continuar.');
            return;
        }

        const dateFormatted = formatDateFull(state.selectedDate);

        // Build WhatsApp Message Text
        const messageText = 
`🍷 *SOLICITUD DE RESERVA - CLUB MONTEBELLO*

👤 *Nombre:* ${state.customerName}
📱 *Teléfono:* ${state.customerPhone}
👥 *Comensales:* ${state.diners} ${state.diners === 1 ? 'persona' : 'personas'}
📅 *Fecha:* ${dateFormatted}
⏰ *Turno:* ${state.selectedTime}
🪑 *Ubicación:* ${state.locationPref}
📝 *Notas/Motivo:* ${state.customerNotes || 'Sin observaciones'}

_Por favor confírmeme la disponibilidad para agendar esta reserva. ¡Muchas gracias!_`;

        const encodedMsg = encodeURIComponent(messageText);
        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMsg}`;

        // Populate final summary card
        finalSummaryCard.innerHTML = `
            <div class="summary-row">
                <span class="summary-label">Nombre:</span>
                <span class="summary-val">${state.customerName}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Comensales:</span>
                <span class="summary-val">${state.diners} personas</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Fecha:</span>
                <span class="summary-val">${formatDateShort(state.selectedDate)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Turno:</span>
                <span class="summary-val">${state.selectedTime}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Ubicación:</span>
                <span class="summary-val">${state.locationPref}</span>
            </div>
        `;

        manualWaLink.href = waUrl;
        
        // Go to Step 5
        goToStep(5);

        // Open WhatsApp window automatically
        window.open(waUrl, '_blank');
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
