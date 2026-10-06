/**
 * WhatsApp Notification Service for Club Montebello
 */

// Montebello Official WhatsApp Number
const MONTEBELLO_WHATSAPP = process.env.MONTEBELLO_WHATSAPP || '5493541760808';

/**
 * Format phone number to international WhatsApp format (only numbers)
 * Example: +54 9 3541 76-0808 -> 5493541760808
 */
function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    
    // Default Argentina country code prefix if local number is passed without 54
    if (cleaned.length === 10 && !cleaned.startsWith('54')) {
        cleaned = '549' + cleaned;
    }
    return cleaned;
}

/**
 * Helper to build wa.me direct links
 */
function buildWhatsAppLink(phone, text) {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Build Pending Notification Text for WhatsApp
 */
function getPendingMessageText(reservation) {
    return `🍷 *CLUB MONTEBELLO — Solicitud de Reserva Recibida*

Hola *${reservation.customerName}*, recibimos correctamente tu solicitud de reserva. Nuestro maitre está revisando la disponibilidad para brindarte la mejor experiencia.

📌 *Detalles de tu solicitud:*
• *Código de Reserva:* ${reservation.id}
• *Fecha:* ${reservation.dateStr}
• *Hora:* ${reservation.timeSlot}
• *Comensales:* ${reservation.diners} personas
• *Sector:* ${reservation.locationPref}

⏳ *Estado: Pendiente de Confirmación.*
Te enviaremos un nuevo mensaje por WhatsApp en cuanto el maitre apruebe tu mesa.

_Club Montebello • Rooftop & Gastronomía_`;
}

/**
 * Build Confirmation Message Text for WhatsApp
 */
function getConfirmationMessageText(reservation) {
    const staffNotesText = reservation.staffNotes ? `\n📝 *Mensaje del Restaurante:* ${reservation.staffNotes}` : '';
    const tableText = reservation.tableName ? ` (${reservation.tableName})` : '';

    return `🎉 *¡TU RESERVA ESTÁ CONFIRMADA! — CLUB MONTEBELLO*

Hola *${reservation.customerName}*, nos complace informarte que tu mesa en *Club Montebello* ha sido confirmada.

✅ *Detalles de la Reserva:*
• *Código:* ${reservation.id}
• *Fecha:* ${reservation.dateStr}
• *Hora:* ${reservation.timeSlot}
• *Comensales:* ${reservation.diners} personas
• *Sector:* ${reservation.locationPref}${tableText}${staffNotesText}

📌 *Información Importante:*
• Tolerancia de impuntualidad: *15 minutos*.
• En caso de necesitar cancelar, por favor responde a este mensaje.

📖 *Ver Carta Digital:* https://menu.fu.do/clubmontebello/qr-menu
📍 *Cómo llegar:* https://maps.app.goo.gl/N98GZTW9BFzf8oLK7

¡Te esperamos para disfrutar de una velada inigualable! 🍷✨`;
}

/**
 * Build Rejection / Cancellation Message Text for WhatsApp
 */
function getRejectionMessageText(reservation) {
    const reasonText = reservation.staffNotes 
        ? reservation.staffNotes 
        : 'Lamentablemente no contamos con capacidad disponible para el turno y fecha solicitados.';

    return `❌ *Aviso sobre tu Solicitud de Reserva — CLUB MONTEBELLO*

Hola *${reservation.customerName}*, agradecemos tu interés en visitar Club Montebello para el *${reservation.dateStr} (${reservation.timeSlot})*.

⚠️ *Estado: No Disponible*
${reasonText}

Te invitamos a consultar la disponibilidad para otra fecha u horario en nuestro sitio web o respondiendo a este mensaje.

_Club Montebello • Rooftop & Gastronomía_`;
}

/**
 * Send WhatsApp notification when reservation request is created (PENDING)
 */
async function sendPendingWhatsApp(reservation) {
    const message = getPendingMessageText(reservation);
    const targetPhone = formatPhoneForWhatsApp(reservation.customerPhone);

    console.log('\n=================== 📱 WHATSAPP SIMULATION (PENDIENTE) ===================');
    console.log(`Para: ${reservation.customerName} (${targetPhone})`);
    console.log(`Código: ${reservation.id}`);
    console.log('-------------------------------------------------------------------------');
    console.log(message);
    console.log(`\nLink directo WhatsApp Web: ${buildWhatsAppLink(targetPhone, message)}`);
    console.log('=========================================================================\n');

    return {
        success: true,
        type: 'PENDING',
        targetPhone,
        waLink: buildWhatsAppLink(targetPhone, message)
    };
}

/**
 * Send WhatsApp notification when reservation is CONFIRMED
 */
async function sendConfirmationWhatsApp(reservation) {
    const message = getConfirmationMessageText(reservation);
    const targetPhone = formatPhoneForWhatsApp(reservation.customerPhone);

    console.log('\n=================== 📱 WHATSAPP SIMULATION (CONFIRMADA) ===================');
    console.log(`Para: ${reservation.customerName} (${targetPhone})`);
    console.log(`Código: ${reservation.id}`);
    console.log('--------------------------------------------------------------------------');
    console.log(message);
    console.log(`\nLink directo WhatsApp Web: ${buildWhatsAppLink(targetPhone, message)}`);
    console.log('==========================================================================\n');

    return {
        success: true,
        type: 'CONFIRMADA',
        targetPhone,
        waLink: buildWhatsAppLink(targetPhone, message)
    };
}

/**
 * Send WhatsApp notification when reservation is REJECTED
 */
async function sendRejectionWhatsApp(reservation) {
    const message = getRejectionMessageText(reservation);
    const targetPhone = formatPhoneForWhatsApp(reservation.customerPhone);

    console.log('\n=================== 📱 WHATSAPP SIMULATION (RECHAZADA) ===================');
    console.log(`Para: ${reservation.customerName} (${targetPhone})`);
    console.log(`Código: ${reservation.id}`);
    console.log('-------------------------------------------------------------------------');
    console.log(message);
    console.log(`\nLink directo WhatsApp Web: ${buildWhatsAppLink(targetPhone, message)}`);
    console.log('=========================================================================\n');

    return {
        success: true,
        type: 'RECHAZADA',
        targetPhone,
        waLink: buildWhatsAppLink(targetPhone, message)
    };
}

module.exports = {
    formatPhoneForWhatsApp,
    buildWhatsAppLink,
    getPendingMessageText,
    getConfirmationMessageText,
    getRejectionMessageText,
    sendPendingWhatsApp,
    sendConfirmationWhatsApp,
    sendRejectionWhatsApp
};
