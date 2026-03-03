import express from 'express';
import pool from '../db/connection.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
