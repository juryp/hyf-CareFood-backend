import express from 'express';
import query from '../config/db.js';

const router = express.Router();

// GET request to retrieve current box types and descriptions for a provider
router.get('/get-boxes/:provider_id', async (req, res) => {
    const { provider_id } = req.params;

    try {
        // Check if any boxes exist for this provider
        const checkBoxes = await query(`SELECT * FROM boxes WHERE provider_id = ?`, [provider_id]);

        // If no boxes exist, insert empty entries for all types (Standard, Vegan, Diabetic)
        if (checkBoxes.length === 0) {
            const boxTypes = ['Standard', 'Vegan', 'Diabetic'];
            const insertQueries = boxTypes.map(boxType => {
                return query(
                    `INSERT INTO boxes (provider_id, type, description) VALUES (?, ?, '')`,
                    [provider_id, boxType]
                );
            });
            await Promise.all(insertQueries);
        }

        // Retrieve all boxes for this provider after potential insertion
        const updatedBoxes = await query(`SELECT * FROM boxes WHERE provider_id = ?`, [provider_id]);

        // Retrieve pickup time from the most recent plan if it exists
        const pickupTimeQuery = `
            SELECT pickup_time 
            FROM weekly_plans 
            WHERE provider_id = ? 
            ORDER BY week_start DESC 
            LIMIT 1
        `;
        const pickupTimeResult = await query(pickupTimeQuery, [provider_id]);

        const response = {
            boxes: updatedBoxes.map(box => ({
                type: box.type,
                description: box.description,
            })),
            pickup_time: pickupTimeResult.length > 0 ? pickupTimeResult[0].pickup_time : null
        };

        res.json(response);

    } catch (err) {
        res.status(500).json({ error: 'Error retrieving boxes and pickup time' });
    }
});

// Adding a quantity of boxes of a certain type on a certain date with an optional pickup_time and a change in description
router.put('/add-boxes', async (req, res) => {
    const { provider_id, date, type, quantity, pickup_time, description } = req.body;

    let column;
    let boxTypeString;
    switch (type) {
        case 1: // Standard type
            column = 'standard_quantity';
            boxTypeString = 'Standard';
            break;
        case 2: // Vegan type
            column = 'vegan_quantity';
            boxTypeString = 'Vegan';
            break;
        case 3: // Diabetic type
            column = 'diabetic_quantity';
            boxTypeString = 'Diabetic';
            break;
        default:
            return res.status(400).json({ error: 'Invalid box type' });
    }

    try {
        // Check the availability of all types of boxes for the provider
        const checkBoxes = await query(`SELECT * FROM boxes WHERE provider_id = ?`, [provider_id]);

        // If there are no records in boxes for the provider, we create them for all types
        if (checkBoxes.length === 0) {
            const boxTypes = ['Standard', 'Vegan', 'Diabetic'];
            for (const box of boxTypes) {
                const initialDescription = box === boxTypeString ? description || '' : '';
                await query(
                    `INSERT INTO boxes (provider_id, type, description) VALUES (?, ?, ?)`,
                    [provider_id, box, initialDescription]
                );
            }
        }

        // If the description is passed, we update the description of the specific box type
        if (description && description.trim() !== '') {
            const updateDescriptionSql = `
                UPDATE boxes
                SET description = ?
                WHERE provider_id = ? AND type = ?
            `;
            await query(updateDescriptionSql, [description, provider_id, boxTypeString]);
        }

        // Checking if a plan is available for a given date
        const checkPlan = await query(
            `SELECT * FROM weekly_plans WHERE provider_id = ? AND week_start = ?`,
            [provider_id, date]
        );

        // If there is no record, we need to insert one
        if (checkPlan.length === 0) {
            let finalPickupTime = pickup_time;

            // If no pickup_time was passed, retrieve an existing one for the provider
            if (!pickup_time) {
                const checkExistingPickupTime = await query(
                    `SELECT pickup_time FROM weekly_plans WHERE provider_id = ? LIMIT 1`,
                    [provider_id]
                );

                if (checkExistingPickupTime.length > 0) {
                    finalPickupTime = checkExistingPickupTime[0].pickup_time;
                } else {
                    return res.status(400).json({ error: 'Pickup time is required for a new plan and no default time exists' });
                }
            }

            await query(
                `INSERT INTO weekly_plans (provider_id, week_start, standard_quantity, vegan_quantity, diabetic_quantity, pickup_time) VALUES (?, ?, 0, 0, 0, ?)`,
                [provider_id, date, finalPickupTime]
            );
        }

        // Update the number of boxes in the corresponding column
        const updatePlanSql = `
            UPDATE weekly_plans
            SET ${column} = ${column} + ?
            WHERE provider_id = ? AND week_start = ?
        `;
        const result = await query(updatePlanSql, [quantity, provider_id, date]);

        // Check if the update was successful
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Plan not found for the given provider and date' });
        }

        // If pickup_time is passed, update it
        if (pickup_time) {
            const updatePickupTimeSql = `
                UPDATE weekly_plans
                SET pickup_time = ?
                WHERE provider_id = ? AND week_start = ?
            `;
            await query(updatePickupTimeSql, [pickup_time, provider_id, date]);
        }

        res.json({ message: 'Box quantity updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error updating box quantity and description' });
    }
});

export default router;
