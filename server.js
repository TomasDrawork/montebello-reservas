const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
    sendPendingNotification,
    sendConfirmationNotification,
    sendRejectionNotification
} = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const DATA_DIR = IS_LAMBDA ? '/tmp' : path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reservations.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure JSON file exists
if (!fs.existsSync(DATA_FILE)) {
    let initialContent = '[]';
    const seedPath = path.join(__dirname, 'data', 'reservations.json');
    if (fs.existsSync(seedPath)) {
        try { initialContent = fs.readFileSync(seedPath, 'utf8'); } catch (e) {}
    }
    fs.writeFileSync(DATA_FILE, initialContent);
}

// Helper to read reservations
function readReservations() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error leyendo reservations.json:', err);
        return [];
    }
}

// Helper to write reservations
function writeReservations(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- API ENDPOINTS ---

/**
 * Public Endpoint: Customer creates a new reservation request
 */
app.post('/api/reservations', async (req, res) => {
    try {
        const { diners, dateStr, timeSlot, locationPref, customerName, customerPhone, customerEmail, customerNotes } = req.body;

        if (!customerName || !customerPhone || !customerEmail || !dateStr || !timeSlot) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios en el formulario.' });
        }

        const reservations = readReservations();
        
        // Generate short custom ID: MB-1001, MB-1002...
        const nextNum = 1000 + reservations.length + 1;
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

        reservations.unshift(newReservation);
        writeReservations(reservations);

        // Send email to customer (await before Lambda freezes)
        try {
            await sendPendingNotification(newReservation);
            console.log(`✅ Mail de recepción enviado correctamente a ${newReservation.customerEmail}`);
        } catch (err) {
            console.error('Error enviando mail de recepción:', err);
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
app.get('/api/admin/reservations', (req, res) => {
    try {
        const reservations = readReservations();
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

        const reservations = readReservations();
        const index = reservations.findIndex(r => r.id === id || r.uuid === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        const reservation = reservations[index];
        const previousStatus = reservation.status;

        reservation.status = status;
        if (tableName !== undefined) reservation.tableName = tableName.trim();
        if (staffNotes !== undefined) reservation.staffNotes = staffNotes.trim();
        reservation.updatedAt = new Date().toISOString();

        reservations[index] = reservation;
        writeReservations(reservations);

        // Send Email Notification if status changed (await before Lambda freezes)
        try {
            if (status === 'CONFIRMADA' && previousStatus !== 'CONFIRMADA') {
                await sendConfirmationNotification(reservation);
                console.log(`✅ Mail de confirmación enviado correctamente a ${reservation.customerEmail}`);
            } else if (status === 'RECHAZADA' && previousStatus !== 'RECHAZADA') {
                await sendRejectionNotification(reservation);
                console.log(`✅ Mail de rechazo enviado correctamente a ${reservation.customerEmail}`);
            }
        } catch (err) {
            console.error('Error enviando mail de estado:', err);
        }

        res.json({
            success: true,
            message: `Reserva ${id} actualizada a ${status}`,
            reservation
        });
    } catch (err) {
        console.error('Error en PUT /api/admin/reservations/:id/status:', err);
        res.status(500).json({ success: false, message: 'Error al actualizar reserva.' });
    }
});

/**
 * Admin Endpoint: Delete a reservation permanently
 */
app.delete('/api/admin/reservations/:id', (req, res) => {
    try {
        const { id } = req.params;
        let reservations = readReservations();
        const initialCount = reservations.length;

        reservations = reservations.filter(r => r.id !== id && r.uuid !== id);

        if (reservations.length === initialCount) {
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        writeReservations(reservations);

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
