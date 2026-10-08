const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const dbService = require('./services/dbService');
const {
    sendPendingWhatsApp,
    sendConfirmationWhatsApp,
    sendRejectionWhatsApp,
    buildWhatsAppLink,
    getConfirmationMessageText,
    getRejectionMessageText
} = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; connect-src 'self' https:;"
    );
    next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static(__dirname));

// --- API ENDPOINTS ---

/**
 * Public Endpoint: Get Availability Settings (Blocked Dates & Closed Weekdays)
 */
app.get('/api/availability', async (req, res) => {
    try {
        const availability = await dbService.getAvailabilitySettings();
        res.json({ success: true, availability });
    } catch (err) {
        console.error('Error en GET /api/availability:', err);
        res.status(500).json({ success: false, message: 'Error obteniendo disponibilidad.' });
    }
});

/**
 * Admin Endpoint: Update Availability Settings
 */
app.post('/api/admin/availability', async (req, res) => {
    try {
        const { blockedDates, allowedOverrideDates, closedWeekdays, dateSlotOverrides } = req.body;
        const updated = await dbService.saveAvailabilitySettings({
            closedWeekdays: closedWeekdays || [1, 2],
            blockedDates: blockedDates || [],
            allowedOverrideDates: allowedOverrideDates || [],
            dateSlotOverrides: dateSlotOverrides || {}
        });
        res.json({ success: true, message: 'Ajustes de disponibilidad actualizados.', availability: updated });
    } catch (err) {
        console.error('Error en POST /api/admin/availability:', err);
        res.status(500).json({ success: false, message: 'Error guardando disponibilidad.' });
    }
});

/**
 * Public Endpoint: Customer creates a new reservation request
 */
app.post('/api/reservations', async (req, res) => {
    try {
        const { diners, dateStr, timeSlot, locationPref, customerName, customerPhone, customerEmail, customerNotes } = req.body;

        if (!customerName || !customerPhone || !dateStr || !timeSlot) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios en el formulario.' });
        }

        const reservations = await dbService.getAllReservations();
        
        // Find highest existing numeric ID (e.g., MB-1005 -> 1005) to prevent recycling or collisions
        let maxNum = 1000;
        reservations.forEach(r => {
            if (r.id && typeof r.id === 'string' && r.id.startsWith('MB-')) {
                const num = parseInt(r.id.replace('MB-', ''), 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });
        const nextNum = maxNum + 1;
        const reservationId = `MB-${nextNum}`;

        const newReservation = {
            id: reservationId,
            uuid: crypto.randomUUID(),
            diners: parseInt(diners, 10) || 2,
            dateStr,
            timeSlot,
            locationPref: locationPref || 'Indistinto',
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerNotes: customerNotes ? customerNotes.trim() : '',
            status: 'PENDIENTE', // PENDIENTE | CONFIRMADA | RECHAZADA
            createdAt: new Date().toISOString(),
            tableName: '',
            staffNotes: ''
        };

        await dbService.saveReservation(newReservation);

        // Send WhatsApp Notification to customer (await before Lambda freezes)
        try {
            await sendPendingWhatsApp(newReservation);
            console.log(`✅ Notificación WhatsApp de recepción enviada a ${newReservation.customerPhone}`);
        } catch (err) {
            console.error('Error enviando notificación WhatsApp de recepción:', err);
        }

        res.status(201).json({
            success: true,
            message: 'Solicitud de reserva guardada correctamente.',
            reservation: newReservation
        });
    } catch (err) {
        console.error('Error en POST /api/reservations:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

/**
 * Admin Login Endpoint
 */
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'montebello2026';

    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, token: 'session-montebello-admin-2026' });
    } else {
        return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }
});

/**
 * Admin Endpoint: Get list of reservations with optional filtering
 */
app.get('/api/admin/reservations', async (req, res) => {
    try {
        const reservations = await dbService.getAllReservations();
        const { date, status } = req.query;

        let filtered = reservations;

        if (status && status !== 'ALL') {
            filtered = filtered.filter(r => r.status === status);
        }

        if (date) {
            filtered = filtered.filter(r => r.dateStr === date);
        }

        res.json({
            success: true,
            total: filtered.length,
            reservations: filtered
        });
    } catch (err) {
        console.error('Error en GET /api/admin/reservations:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

/**
 * Admin Endpoint: Update reservation status (APPROVE / REJECT)
 */
app.put('/api/admin/reservations/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tableName, staffNotes } = req.body;

        if (!['CONFIRMADA', 'RECHAZADA', 'PENDIENTE'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Estado inválido.' });
        }

        const reservations = await dbService.getAllReservations();
        const existing = reservations.find(r => r.id === id || r.uuid === id);

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        const previousStatus = existing.status;
        const updateFields = { status };
        if (tableName !== undefined) updateFields.tableName = tableName.trim();
        if (staffNotes !== undefined) updateFields.staffNotes = staffNotes.trim();

        const updated = await dbService.updateReservation(id, updateFields);

        // Send WhatsApp Notification if status changed
        let waLink = '';
        try {
            if (status === 'CONFIRMADA' && previousStatus !== 'CONFIRMADA') {
                const res = await sendConfirmationWhatsApp(updated);
                waLink = res.waLink;
                console.log(`✅ Notificación WhatsApp de confirmación enviada a ${updated.customerPhone}`);
            } else if (status === 'RECHAZADA' && previousStatus !== 'RECHAZADA') {
                const res = await sendRejectionWhatsApp(updated);
                waLink = res.waLink;
                console.log(`✅ Notificación WhatsApp de rechazo enviada a ${updated.customerPhone}`);
            } else {
                waLink = buildWhatsAppLink(updated.customerPhone, getConfirmationMessageText(updated));
            }
        } catch (err) {
            console.error('Error enviando notificación WhatsApp de estado:', err);
        }

        res.json({
            success: true,
            message: `Reserva ${id} actualizada a ${status}`,
            reservation: updated,
            waLink
        });
    } catch (err) {
        console.error('Error en PUT /api/admin/reservations/:id/status:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar reserva.' });
    }
});

/**
 * Admin Endpoint: Delete a reservation permanently
 */
app.delete('/api/admin/reservations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbService.deleteReservation(id);

        res.json({
            success: true,
            message: `Reserva ${id} eliminada correctamente.`
        });
    } catch (err) {
        console.error('Error en DELETE /api/admin/reservations/:id:', err);
        res.status(500).json({ success: false, message: 'Error al eliminar reserva.' });
    }
});

// Fallback to index.html for unknown routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const serverless = require('serverless-http');

// Export handler for AWS Lambda
module.exports.handler = serverless(app);

// Start Standalone Server for local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🍷 Club Montebello Backend Server corriendo en: http://localhost:${PORT}`);
        console.log(`📱 Widget de Reservas Cliente: http://localhost:${PORT}`);
        console.log(`👨‍🍳 Panel de Administración Staff: http://localhost:${PORT}/admin.html\n`);
    });
}
