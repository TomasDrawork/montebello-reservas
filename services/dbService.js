const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'montebello_reservations';
const IS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const DATA_DIR = IS_LAMBDA ? '/tmp' : path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'reservations.json');

// Initialize DynamoDB client
const region = process.env.AWS_REGION || 'us-east-1';
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Local JSON Fallback Helpers
 */
function readLocalReservations() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(DATA_FILE)) {
            let initialContent = '[]';
            const seedPath = path.join(__dirname, '..', 'data', 'reservations.json');
            if (fs.existsSync(seedPath)) {
                try { initialContent = fs.readFileSync(seedPath, 'utf8'); } catch (e) {}
            }
            fs.writeFileSync(DATA_FILE, initialContent);
        }
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error leyendo reservations.json local:', err);
        return [];
    }
}

function writeLocalReservations(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Storage API Interface with DynamoDB + Local Fallback
 */
async function getAllReservations() {
    let items = [];
    if (IS_LAMBDA) {
        try {
            const command = new ScanCommand({ TableName: TABLE_NAME });
            const response = await docClient.send(command);
            items = response.Items || [];
        } catch (err) {
            console.error('DynamoDB Scan error, fallback a local:', err.message);
            items = readLocalReservations();
        }
    } else {
        items = readLocalReservations();
    }
    // Filter out system settings item
    const reservations = items.filter(i => i.id !== 'SETTINGS_AVAILABILITY');
    // Sort by createdAt descending
    reservations.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return reservations;
}

async function saveReservation(reservation) {
    if (IS_LAMBDA) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: reservation
            });
            await docClient.send(command);
            console.log(`✅ Reserva ${reservation.id} guardada en DynamoDB`);
        } catch (err) {
            console.error('DynamoDB Put error:', err.message);
        }
    }
    
    // Always sync to local file as backup
    const items = readLocalReservations();
    items.unshift(reservation);
    writeLocalReservations(items);
    return reservation;
}

async function updateReservation(id, updateFields) {
    const items = await getAllReservations();
    const index = items.findIndex(r => r.id === id || r.uuid === id);

    if (index === -1) return null;

    const reservation = { ...items[index], ...updateFields, updatedAt: new Date().toISOString() };

    if (IS_LAMBDA) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: reservation
            });
            await docClient.send(command);
            console.log(`✅ Reserva ${id} actualizada en DynamoDB`);
        } catch (err) {
            console.error('DynamoDB Update error:', err.message);
        }
    }

    // Sync local
    const localItems = readLocalReservations();
    const localIdx = localItems.findIndex(r => r.id === id || r.uuid === id);
    if (localIdx !== -1) {
        localItems[localIdx] = reservation;
        writeLocalReservations(localItems);
    }

    return reservation;
}

async function deleteReservation(id) {
    if (IS_LAMBDA) {
        try {
            const command = new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { id }
            });
            await docClient.send(command);
            console.log(`✅ Reserva ${id} eliminada de DynamoDB`);
        } catch (err) {
            console.error('DynamoDB Delete error:', err.message);
        }
    }

    let items = readLocalReservations();
    items = items.filter(r => r.id !== id && r.uuid !== id);
    writeLocalReservations(items);

    return true;
}

const DEFAULT_AVAILABILITY = {
    id: 'SETTINGS_AVAILABILITY',
    closedWeekdays: [1, 2], // 1 = Lunes, 2 = Martes
    blockedDates: [],       // Array of "YYYY-MM-DD"
    allowedOverrideDates: [] // Array of "YYYY-MM-DD"
};

async function getAvailabilitySettings() {
    let items = [];
    if (IS_LAMBDA) {
        try {
            const command = new ScanCommand({ TableName: TABLE_NAME });
            const response = await docClient.send(command);
            items = response.Items || [];
        } catch (err) {
            items = readLocalReservations();
        }
    } else {
        items = readLocalReservations();
    }
    const settings = items.find(i => i.id === 'SETTINGS_AVAILABILITY');
    if (!settings) return DEFAULT_AVAILABILITY;
    return {
        id: 'SETTINGS_AVAILABILITY',
        closedWeekdays: Array.isArray(settings.closedWeekdays) ? settings.closedWeekdays : [1, 2],
        blockedDates: Array.isArray(settings.blockedDates) ? settings.blockedDates : [],
        allowedOverrideDates: Array.isArray(settings.allowedOverrideDates) ? settings.allowedOverrideDates : []
    };
}

async function saveAvailabilitySettings(settings) {
    const updated = {
        id: 'SETTINGS_AVAILABILITY',
        closedWeekdays: Array.isArray(settings.closedWeekdays) ? settings.closedWeekdays : [1, 2],
        blockedDates: Array.isArray(settings.blockedDates) ? settings.blockedDates : [],
        allowedOverrideDates: Array.isArray(settings.allowedOverrideDates) ? settings.allowedOverrideDates : [],
        updatedAt: new Date().toISOString()
    };

    if (IS_LAMBDA) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: updated
            });
            await docClient.send(command);
            console.log('✅ Ajustes de disponibilidad guardados en DynamoDB');
        } catch (err) {
            console.error('DynamoDB Put availability settings error:', err.message);
        }
    }

    // Backup local
    const items = readLocalReservations();
    const idx = items.findIndex(i => i.id === 'SETTINGS_AVAILABILITY');
    if (idx !== -1) {
        items[idx] = updated;
    } else {
        items.push(updated);
    }
    writeLocalReservations(items);

    return updated;
}

module.exports = {
    getAllReservations,
    saveReservation,
    updateReservation,
    deleteReservation,
    getAvailabilitySettings,
    saveAvailabilitySettings
};
