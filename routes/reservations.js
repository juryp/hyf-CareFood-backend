import express from 'express';
import query from '../config/db.js';

const router = express.Router();

// Utility function to map the status
const mapStatus = (status) => {
    switch (status) {
        case 'active':
            return 'Reserved';
        case 'ready':
            return 'Ready for Pickup';
        case 'issued':
            return 'Delivered';
        default:
            return status;
    }
};

// Create a reservation for a user
router.post('/', async (req, res) => {
    const { user_id, provider_id, box_id, date, quantity } = req.body;  // Unified 'date' field

    try {
        const formattedReservationDate = date.split('T')[0];

        const boxTypeSql = 'SELECT type FROM boxes WHERE id = ?';
        const box = await query(boxTypeSql, [box_id]);
        
        if (box.length === 0) {
            return res.status(404).json({ message: 'Box type not found' });
        }

        const boxType = box[0].type.toLowerCase() + '_quantity';

        const checkQuantitySql = 
            'SELECT ' + boxType + ' FROM weekly_plans WHERE provider_id = ? AND week_start = ?';
        const availableBox = await query(checkQuantitySql, [provider_id, formattedReservationDate]);

        if (availableBox.length === 0 || availableBox[0][boxType] < quantity) {
            return res.status(400).json({ message: 'Not enough boxes available for reservation' });
        }

        const updatePlanSql = 
            'UPDATE weekly_plans SET ' + boxType + ' = ' + boxType + ' - ? WHERE provider_id = ? AND week_start = ?';
        await query(updatePlanSql, [quantity, provider_id, formattedReservationDate]);

        const sql = 
            'INSERT INTO reservations (user_id, provider_id, box_id, reservation_date, quantity, status) VALUES (?, ?, ?, ?, ?, "active")';
        await query(sql, [user_id, provider_id, box_id, formattedReservationDate, quantity]);

        res.status(201).json({ message: 'Reservation successfully created' });
    } catch (err) {
        res.status(500).json({ error: 'Error creating reservation' });
    }
});

// Retrieve all active reservations for a user
router.get('/user/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { date } = req.query;

    let sql = 
        'SELECT r.id, r.reservation_date, r.quantity, r.status, b.type, p.name AS provider_name, p.address, p.id AS provider_id, p.coordinates ' +
        'FROM reservations r ' +
        'JOIN boxes b ON r.box_id = b.id ' +
        'JOIN providers p ON r.provider_id = p.id ' +
        'WHERE r.user_id = ? AND (r.status = "active" OR r.status = "ready")';
    
    const params = [user_id];
    
    if (date) {
        sql += ' AND r.reservation_date = ?';
        params.push(date);
    }

    try {
        const reservations = await query(sql, params);
        const formattedReservations = reservations.map(reservation => ({
            ...reservation,
            status: mapStatus(reservation.status),
        }));
        res.json(formattedReservations);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving reservations' });
    }
});

// Retrieve all active and ready reservations for a provider within a date range
router.get('/provider/:provider_id', async (req, res) => {
    const { provider_id } = req.params;
    const { startDate, endDate } = req.query;

    let sql =
        'SELECT r.id, r.reservation_date, r.quantity, r.status, b.type, u.name AS user_name, u.email, u.id AS user_id ' +
        'FROM reservations r ' +
        'JOIN boxes b ON r.box_id = b.id ' +
        'JOIN users u ON r.user_id = u.id ' +
        'WHERE r.provider_id = ? AND (r.status = "active" OR r.status = "ready")';

    const params = [provider_id];

    if (startDate && endDate) {
        sql += ' AND r.reservation_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    try {
        const reservations = await query(sql, params);
        const formattedReservations = reservations.map(reservation => ({
            ...reservation,
            reservation_date: reservation.reservation_date.toISOString().split('T')[0],
            status: mapStatus(reservation.status),
        }));
        res.json(formattedReservations);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving reservations' });
    }
});

// Ready all reservations for a store on a specific date
router.post('/ready/all', async (req, res) => {
    const { provider_id, date } = req.body;  // Unified 'date' field

    try {
        const sql = `
            UPDATE reservations
            SET status = 'ready'
            WHERE provider_id = ? AND reservation_date = ? AND status = 'active'
        `;
        const result = await query(sql, [provider_id, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No active reservations found for this store on the specified date' });
        }

        res.json({ message: 'All reservations for this store on the specified date have been marked as ready' });
    } catch (err) {
        res.status(500).json({ error: 'Error marking reservations as ready' });
    }
});

// Ready all reservations of a specific type for a store on a specific date
router.post('/ready/type', async (req, res) => {
    const { provider_id, box_type, date } = req.body;

    try {
        const sql = `
            UPDATE reservations
            SET status = 'ready'
            WHERE provider_id = ? AND box_id IN (
                SELECT id FROM boxes WHERE type = ?
            ) AND reservation_date = ? AND status = 'active'
        `;
        const result = await query(sql, [provider_id, box_type, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No active reservations of this type found for this store on the specified date' });
        }

        res.json({ message: 'All reservations of this type for this store on the specified date have been marked as ready' });
    } catch (err) {
        res.status(500).json({ error: 'Error marking reservations as ready' });
    }
});

// Ready all reservations for user on date
router.post('/ready/user', async (req, res) => {
    const { provider_id, user_id, date } = req.body;

    try {
        const sql = `
            UPDATE reservations
            SET status = 'ready'
            WHERE provider_id = ? AND user_id = ? AND reservation_date = ? AND status = 'active'
        `;
        const result = await query(sql, [provider_id, user_id, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No active reservations found for this user on the specified date' });
        }

        res.json({ message: 'All reservations for this user on the specified date have been marked as ready' });
    } catch (err) {
        res.status(500).json({ error: 'Error marking reservations as ready' });
    }
});

// Mark a specific reservation as ready by ID
router.post('/ready/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            UPDATE reservations
            SET status = 'ready'
            WHERE id = ? AND status = 'active'
        `;
        const result = await query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Reservation not found or not active' });
        }

        res.json({ message: 'Reservation has been successfully marked as ready' });
    } catch (err) {
        res.status(500).json({ error: 'Error marking reservation as ready' });
    }
});

// Issue all reservations for user on date
router.post('/issue/all', async (req, res) => {
    const { provider_id, user_id, date } = req.body;  // Unified 'date' field

    try {
        const sql = `
            UPDATE reservations
            SET status = 'issued', issued_date = NOW()
            WHERE provider_id = ? AND user_id = ? AND reservation_date = ? AND status = 'ready'
        `;
        const result = await query(sql, [provider_id, user_id, date]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No ready reservations found for this user on the specified date' });
        }

        res.json({ message: 'All reservations for the user on this date have been issued' });
    } catch (err) {
        res.status(500).json({ error: 'Error issuing reservations' });
    }
});

// Issue a specific reservation by ID
router.post('/issue/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            UPDATE reservations
            SET status = 'issued', issued_date = NOW()
            WHERE id = ? AND status = 'ready'
        `;
        const result = await query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Reservation not found or already issued' });
        }

        res.json({ message: 'Reservation has been successfully issued' });
    } catch (err) {
        res.status(500).json({ error: 'Error issuing reservation' });
    }
});

// Retrieve the history of issued reservations for a user within a date range
router.get('/user/:user_id/history', async (req, res) => {
    const { user_id } = req.params;
    const { startDate, endDate } = req.query;

    let sql =
        'SELECT r.id, r.reservation_date, r.issued_date, r.quantity, r.status, b.type, p.name AS provider_name, p.address, p.id AS provider_id, p.coordinates ' +
        'FROM reservations r ' +
        'JOIN boxes b ON r.box_id = b.id ' +
        'JOIN providers p ON r.provider_id = p.id ' +
        'WHERE r.user_id = ? AND r.status = "issued"';
    
    const params = [user_id];
    
    if (startDate && endDate) {
        sql += ' AND r.issued_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    try {
        const reservations = await query(sql, params);
        const formattedReservations = reservations.map(reservation => ({
            ...reservation,
            reservation_date: reservation.reservation_date.toISOString().split('T')[0],
            issued_date: reservation.issued_date.toISOString().split('T')[0],
            status: 'Delivered',  // For history the status is always "Delivered"
        }));
        res.json(formattedReservations);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving reservation history' });
    }
});

// Retrieve the history of issued reservations for a provider within a date range
router.get('/provider/:provider_id/history', async (req, res) => {
    const { provider_id } = req.params;
    const { startDate, endDate } = req.query;

    let sql =
        'SELECT r.id, r.issued_date, r.quantity, b.type, u.name AS user_name, u.email ' +
        'FROM reservations r ' +
        'JOIN boxes b ON r.box_id = b.id ' +
        'JOIN users u ON r.user_id = u.id ' +
        'WHERE r.provider_id = ? AND r.status = "issued"';

    const params = [provider_id];

    if (startDate && endDate) {
        sql += ' AND r.issued_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    try {
        const reservations = await query(sql, params);

        // format dates and add status for clarity
        const formattedReservations = reservations.map(reservation => ({
            ...reservation,
            issued_date: reservation.issued_date.toISOString().split('T')[0],
            status: 'Delivered',  // For history the status is always "Delivered"
        }));

        res.json(formattedReservations);
    } catch (err) {
        res.status(500).json({ error: 'Error retrieving reservation history' });
    }
});


export default router;
