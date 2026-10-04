const nodemailer = require('nodemailer');

// Official Montebello Email Configuration
const MONTEBELLO_EMAIL = process.env.MONTEBELLO_EMAIL || 'reservas.montebellovcp@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'fepixwspdvunpxin';

// Create Transporter (uses Gmail SMTP if password provided, or Ethereal/Console fallback)
let transporter = null;

if (GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: MONTEBELLO_EMAIL,
            pass: GMAIL_APP_PASSWORD
        }
    });
} else {
    // Development / Test mode transporter (logs to console and returns success)
    transporter = {
        sendMail: async (mailOptions) => {
            console.log('\n=================== 📧 EMAIL SIMULATION ===================');
            console.log(`De: ${mailOptions.from}`);
            console.log(`Para: ${mailOptions.to}`);
            console.log(`Asunto: ${mailOptions.subject}`);
            console.log('-----------------------------------------------------------');
            console.log(`(Modo simulación: Configurar GMAIL_APP_PASSWORD para envíos reales)`);
            console.log('===========================================================\n');
            return { messageId: 'simulated-' + Date.now() };
        }
    };
}

/**
 * Base HTML Template wrapper with Club Montebello Fine Dining Aesthetics
 */
function wrapEmailTemplate(contentHtml, titleText) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleText}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap');
        body {
            margin: 0;
            padding: 0;
            background-color: #0E0C0A;
            color: #FFFFFF;
            font-family: 'Poppins', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #14110E;
            border: 1px solid rgba(224, 90, 16, 0.3);
            border-radius: 16px;
            overflow: hidden;
        }
        .email-header {
            background: linear-gradient(180deg, #1C1713 0%, #14110E 100%);
            padding: 32px 24px;
            text-align: center;
            border-bottom: 2px solid #E05A10;
        }
        .brand-subtitle {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            letter-spacing: 3px;
            color: #E05A10;
            text-transform: uppercase;
            font-weight: 700;
            margin: 0 0 6px 0;
        }
        .brand-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 26px;
            color: #FFFFFF;
            font-weight: 700;
            margin: 0;
        }
        .email-body {
            padding: 32px 28px;
            color: #E0E0E0;
            font-size: 15px;
            line-height: 1.6;
        }
        .reservation-badge {
            display: inline-block;
            background-color: rgba(224, 90, 16, 0.15);
            border: 1px solid #E05A10;
            color: #FFA767;
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 16px;
            padding: 8px 16px;
            border-radius: 8px;
            margin: 16px 0;
        }
        .details-card {
            background-color: #0E0C0A;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #AD9F93;
            font-size: 13px;
        }
        .details-value {
            color: #FFFFFF;
            font-weight: 600;
            font-size: 14px;
        }
        .email-footer {
            background-color: #0B0A08;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #73685E;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .email-footer a {
            color: #FFA767;
            text-decoration: none;
        }
        .btn-action {
            display: inline-block;
            background: linear-gradient(135deg, #F47B20 0%, #B83A00 100%);
            color: #FFFFFF !important;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 10px;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(224, 90, 16, 0.3);
        }
    </style>
</head>
<body>
    <div style="padding: 20px 10px;">
        <div class="email-container">
            <div class="email-header">
                <div class="brand-subtitle">ROOFTOP & GASTRONOMÍA</div>
                <div class="brand-title">CLUB MONTEBELLO</div>
            </div>
            <div class="email-body">
                ${contentHtml}
            </div>
            <div class="email-footer">
                <p>Club Montebello • Villa Carlos Paz, Córdoba</p>
                <p><a href="https://maps.app.goo.gl/N98GZTW9BFzf8oLK7" target="_blank">Ver Ubicación en Google Maps</a></p>
                <p style="margin-top: 12px; font-size: 11px;">Este es un correo automático enviado en respuesta a tu solicitud de reserva en clubmontebellovcp@gmail.com.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Send email when reservation request is received (PENDING)
 */
async function sendPendingNotification(reservation) {
    const content = `
        <h2 style="font-family: 'Montserrat', sans-serif; color: #FFA767; margin-top: 0;">¡Solicitud de Reserva Recibida!</h2>
        <p>Hola <strong>${reservation.customerName}</strong>,</p>
        <p>Hemos recibido correctamente tu solicitud de reserva en <strong>Club Montebello</strong>. Nuestro equipo está revisando la disponibilidad para brindarte la mejor experiencia.</p>
        
        <div style="text-align: center;">
            <div class="reservation-badge">Código: ${reservation.id}</div>
        </div>

        <div class="details-card">
            <table width="100%" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Fecha:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.dateStr}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Hora:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.timeSlot}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Comensales:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.diners} personas</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Ubicación Preferida:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.locationPref}</td>
                </tr>
            </table>
        </div>

        <p style="background: rgba(224, 90, 16, 0.1); border-left: 3px solid #E05A10; padding: 12px; font-size: 13px; color: #AD9F93;">
            ⏳ <strong>Estado: Pendiente de Confirmación.</strong> Te enviaremos un nuevo correo en cuanto el maitre apruebe tu mesa.
        </p>
    `;

    const html = wrapEmailTemplate(content, 'Solicitud Recibida - Club Montebello');

    return transporter.sendMail({
        from: `"Club Montebello" <${MONTEBELLO_EMAIL}>`,
        to: reservation.customerEmail,
        subject: `⏳ Solicitud de Reserva Recibida [${reservation.id}] - Club Montebello`,
        html: html
    });
}

/**
 * Send email when reservation is CONFIRMED by restaurant staff
 */
async function sendConfirmationNotification(reservation) {
    const tableInfoHtml = reservation.tableName ? `
        <tr>
            <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Mesa Asignada:</td>
            <td style="padding: 6px 0; color: #22C55E; font-weight: 700; font-size: 14px; text-align: right;">${reservation.tableName}</td>
        </tr>
    ` : '';

    const staffNotesHtml = reservation.staffNotes ? `
        <p style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22C55E; padding: 12px; font-size: 14px; color: #E0E0E0; margin-top: 15px;">
            📝 <strong>Mensaje del Restaurante:</strong> ${reservation.staffNotes}
        </p>
    ` : '';

    const content = `
        <h2 style="font-family: 'Montserrat', sans-serif; color: #22C55E; margin-top: 0;">🎉 ¡Tu Reserva está CONFIRMADA!</h2>
        <p>Hola <strong>${reservation.customerName}</strong>,</p>
        <p>Nos complace informarte que tu mesa en <strong>Club Montebello</strong> ha sido confirmada. Te esperamos para disfrutar de una velada inigualable.</p>

        <div style="text-align: center;">
            <div class="reservation-badge" style="border-color: #22C55E; color: #4ADE80; background: rgba(34, 197, 94, 0.15);">
                ✓ RESERVA CONFIRMADA: ${reservation.id}
            </div>
        </div>

        <div class="details-card">
            <table width="100%" style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Fecha:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.dateStr}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Hora:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.timeSlot}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Comensales:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.diners} personas</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #AD9F93; font-size: 14px;">Sector:</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600; font-size: 14px; text-align: right;">${reservation.locationPref}</td>
                </tr>
                ${tableInfoHtml}
            </table>
        </div>

        ${staffNotesHtml}

        <div style="background-color: #0E0C0A; padding: 16px; border-radius: 10px; font-size: 13px; color: #AD9F93; margin-top: 20px;">
            📌 <strong>Información Importante:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>Tolerancia de impuntualidad: <strong>15 minutos</strong>.</li>
                <li>Si necesitas modificar o cancelar la reserva, contáctanos a clubmontebellovcp@gmail.com o respondiendo este mail.</li>
            </ul>
        </div>

        <div style="text-align: center; margin-top: 25px;">
            <a href="https://maps.app.goo.gl/N98GZTW9BFzf8oLK7" target="_blank" class="btn-action">
                📍 CÓMO LLEGAR AL CLUB
            </a>
        </div>
    `;

    const html = wrapEmailTemplate(content, 'Reserva Confirmada - Club Montebello');

    return transporter.sendMail({
        from: `"Club Montebello" <${MONTEBELLO_EMAIL}>`,
        to: reservation.customerEmail,
        subject: `✅ ¡Reserva Confirmada! [${reservation.id}] - Club Montebello`,
        html: html
    });
}

/**
 * Send email when reservation is REJECTED/CANCELLED by staff
 */
async function sendRejectionNotification(reservation) {
    const reasonText = reservation.staffNotes ? reservation.staffNotes : 'Lamentablemente no contamos con capacidad disponible para el turno y fecha solicitados.';

    const content = `
        <h2 style="font-family: 'Montserrat', sans-serif; color: #EF4444; margin-top: 0;">Aviso sobre tu Solicitud de Reserva</h2>
        <p>Hola <strong>${reservation.customerName}</strong>,</p>
        <p>Agradecemos tu interés en visitar <strong>Club Montebello</strong> para la fecha <strong>${reservation.dateStr} (${reservation.timeSlot})</strong>.</p>

        <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #EF4444; padding: 14px; font-size: 14px; color: #FCA5A5; margin: 20px 0;">
            ❌ <strong>Estado: No Disponible</strong><br>
            ${reasonText}
        </div>

        <p>Te invitamos a consultar la disponibilidad para otra fecha u horario directamente a través de nuestro sitio web o escribiéndonos a este correo.</p>

        <div style="text-align: center; margin-top: 25px;">
            <a href="mailto:${MONTEBELLO_EMAIL}" class="btn-action" style="background: linear-gradient(135deg, #475569 0%, #1E293B 100%);">
                📩 CONTACTAR AL CLUB
            </a>
        </div>
    `;

    const html = wrapEmailTemplate(content, 'Actualización de Solicitud - Club Montebello');

    return transporter.sendMail({
        from: `"Club Montebello" <${MONTEBELLO_EMAIL}>`,
        to: reservation.customerEmail,
        subject: `Actualización sobre tu reserva [${reservation.id}] - Club Montebello`,
        html: html
    });
}

module.exports = {
    sendPendingNotification,
    sendConfirmationNotification,
    sendRejectionNotification
};
