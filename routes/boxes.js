import express from 'express';
import query from '../config/db.js';

const router = express.Router();

// Добавление количества боксов определенного типа на определенную дату с опциональным временем pickup_time
router.put('/add-boxes', async (req, res) => {
    const { provider_id, week_start, type, quantity, pickup_time } = req.body;

    let column;
    switch (type) {
        case 1: // стандартный тип
            column = 'standard_quantity';
            break;
        case 2: // веган
            column = 'vegan_quantity';
            break;
        case 3: // диабетический
            column = 'diabetic_quantity';
            break;
        default:
            return res.status(400).json({ error: 'Invalid box type' });
    }

    try {
        // Проверка наличия плана на эту неделю
        const checkPlan = await query(
            `SELECT * FROM weekly_plans WHERE provider_id = ? AND week_start = ?`,
            [provider_id, week_start]
        );

        // Если не указано время pickup_time, получаем его из настроек магазина
        let finalPickupTime = pickup_time;
        if (!finalPickupTime) {
            const providerSettings = await query(
                `SELECT pickup_time FROM providers WHERE id = ?`,
                [provider_id]
            );
            if (providerSettings.length === 0 || !providerSettings[0].pickup_time) {
                return res.status(400).json({ error: 'Pickup time is not provided and not found in store settings' });
            }
            finalPickupTime = providerSettings[0].pickup_time;
        }

        // Если записи нет, создаем новую запись с нулями для всех типов боксов и включаем время pickup_time
        if (checkPlan.length === 0) {
            await query(
                `INSERT INTO weekly_plans (provider_id, week_start, standard_quantity, vegan_quantity, diabetic_quantity, pickup_time) VALUES (?, ?, 0, 0, 0, ?)`,
                [provider_id, week_start, finalPickupTime]
            );
        }

        // Обновляем количество боксов в соответствующей колонке
        const sql = `
            UPDATE weekly_plans
            SET ${column} = ${column} + ?, pickup_time = ?
            WHERE provider_id = ? AND week_start = ?
        `;
        const result = await query(sql, [quantity, finalPickupTime, provider_id, week_start]);

        // Проверяем, было ли обновление успешным
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Plan not found for the given provider and date' });
        }

        res.json({ message: 'Box quantity updated successfully', pickup_time: finalPickupTime });
    } catch (err) {
        res.status(500).json({ error: 'Error updating box quantity' });
    }
});


// Изменение описания коробки определенного типа
router.put('/update-description', async (req, res) => {
    const { provider_id, type, description } = req.body;

    try {
        const sql = `
            UPDATE boxes
            SET description = ?
            WHERE provider_id = ? AND type = ?
        `;
        const result = await query(sql, [description, provider_id, type]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Box not found for the given provider and type' });
        }

        res.json({ message: 'Box description updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating box description' });
    }
});


// Получение коробок по магазину и дате
router.get('/', async (req, res) => {
    const { provider_id, startDate, endDate } = req.query;

    try {
        const sql = `
            SELECT DISTINCT b.id, b.type, b.description, p.standard_quantity, p.vegan_quantity, p.diabetic_quantity
            FROM boxes b
            JOIN weekly_plans p ON b.provider_id = p.provider_id
            WHERE b.provider_id = ? AND p.week_start BETWEEN ? AND ?
        `;
        const boxes = await query(sql, [provider_id, startDate, endDate]);

        res.json(boxes);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка получения коробок' });
    }
});

export default router;
