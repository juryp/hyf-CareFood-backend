import express from 'express';
import query from '../config/db.js';

const router = express.Router();

// Route to create a new user
router.post('/register/user', async (req, res) => {
    try {
        let { login, name, email, phone, password, preferences } = req.body;

        // If login is not specified, then we use email as login
        if (!login) {
            login = email;
        }

        const newUser = await query(
            `INSERT INTO users (login, name, email, phone, password, preferences) VALUES (?, ?, ?, ?, ?, ?)`,
            [login, name, email, phone, password, preferences]
        );

        const userId = newUser.insertId;

        res.json({
            message: `User ${login} created successfully`,
            id: userId,
            role: 'user',
            login
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Route to create a new provider
router.post('/register/provider', async (req, res) => {
    try {
        let { name, login, email, phone, password, address, coordinates, description } = req.body;

        // If login is not specified, then we use email as login
        if (!login) {
            login = email;
        }

        const newProvider = await query(
            `INSERT INTO providers (name, login, email, phone, password, address, coordinates, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, login, email, phone, password, address, coordinates, description]
        );

        const providerId = newProvider.insertId;

        res.json({
            message: `Provider ${login} created successfully`,
            id: providerId,
            role: 'provider',
            login
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating provider' });
    }
});

// Universal login route for both users and providers
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        // check both login and email for the user
        const userResult = await query(
            `SELECT id, login, name, preferences FROM users WHERE (login = ? OR email = ?) AND password = ?`,
            [login, login, password]
        );

        if (userResult.length > 0) {
            return res.json({
                message: 'User logged in successfully',
                id: userResult[0].id,
                role: 'user',
                login: userResult[0].login,
                name: userResult[0].name,
                preferences: userResult[0].preferences
            });
        }

        // check both login and email for the provider
        const providerResult = await query(
            `SELECT id, login, name, email, address FROM providers WHERE (login = ? OR email = ?) AND password = ?`,
            [login, login, password]
        );

        if (providerResult.length > 0) {
            return res.json({
                message: 'Provider logged in successfully',
                id: providerResult[0].id,
                role: 'provider',
                login: providerResult[0].login,
                name: providerResult[0].name,
                email: providerResult[0].email,
                address: providerResult[0].address
            });
        }

        // If login or email does not work
        res.status(401).json({ message: 'Invalid login or password' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during login' });
    }
});

export default router;
