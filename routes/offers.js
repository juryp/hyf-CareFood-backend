import express from 'express';
import query from '../config/db.js';

const router = express.Router();

// Receive offers for a period of time with additional information
router.get('/', async (req, res) => {
    const { startDate, endDate, includeTotals, onlyTotals } = req.query;

    try {
        const sql = `
            SELECT wp.provider_id, p.name AS provider_name, p.address, 
                   wp.week_start AS date, wp.standard_quantity AS standard_unit, wp.vegan_quantity AS vegan_unit, wp.diabetic_quantity AS diabetic_unit, 
                   wp.pickup_time, 
                   bs.description AS standard_description, 
                   bv.description AS vegan_description, 
                   bd.description AS diabetic_description
            FROM weekly_plans wp
            JOIN providers p ON wp.provider_id = p.id
            LEFT JOIN boxes bs ON bs.provider_id = wp.provider_id AND bs.type = 'Standard'
            LEFT JOIN boxes bv ON bv.provider_id = wp.provider_id AND bv.type = 'Vegan'
            LEFT JOIN boxes bd ON bd.provider_id = wp.provider_id AND bd.type = 'Diabetic'
            WHERE wp.week_start BETWEEN ? AND ?
        `;
        const offers = await query(sql, [startDate, endDate]);

        // If there are no offers, return an empty array
        if (offers.length === 0) {
            return res.json(offers);
        }

        // Formatting date without time
        const formattedOffers = offers.map(offer => ({
            ...offer,
            date: offer.date.toISOString().split('T')[0],  // Format the date
        }));

        // Calculating totals
        const total = {
            offersNum: 0,
            offersStandard: 0,
            offersVegan: 0,
            offersDiabetic: 0,
            offersUnit: 0,
        };

        // Using Set for unique suppliers
        const uniqueProviders = new Set();

        formattedOffers.forEach(offer => {
            uniqueProviders.add(offer.provider_id);
            total.offersStandard += offer.standard_unit;
            total.offersVegan += offer.vegan_unit;
            total.offersDiabetic += offer.diabetic_unit;
        });

        // Number of unique providers
        total.offersNum = uniqueProviders.size;

        // Sum of all units
        total.offersUnit = total.offersStandard + total.offersVegan + total.offersDiabetic;

        // If onlyTotals is 'true', return only the totals
        if (onlyTotals === 'true') {
            return res.json(total);
        }

        // If includeTotals is 'true', add the totals to the response
        if (includeTotals === 'true') {
            formattedOffers.push(total);
        }

        res.json(formattedOffers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error receiving offers' });
    }
});

export default router;
