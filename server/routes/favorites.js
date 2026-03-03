import express from 'express';
import pool from '../db/connection.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Toggle favorite
router.post('/:listingId', auth, async (req, res) => {
    try {
        const { listingId } = req.params;

        const [existing] = await pool.query(
            'SELECT * FROM favorites WHERE user_id = ? AND listing_id = ?',
            [req.user.id, listingId]
        );

        if (existing.length > 0) {
            await pool.query('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [
                req.user.id,
                listingId,
            ]);
            return res.json({ favorited: false, message: 'Removed from favorites.' });
        }

        await pool.query('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)', [
            req.user.id,
            listingId,
        ]);
        res.json({ favorited: true, message: 'Added to favorites.' });
    } catch (err) {
        console.error('Toggle favorite error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get user's favorites
router.get('/', auth, async (req, res) => {
    try {
        const [favorites] = await pool.query(
            `SELECT l.*, c.name as category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM favorites f
       JOIN listings l ON f.listing_id = l.id
       JOIN categories c ON l.category_id = c.id
       WHERE f.user_id = ? AND l.status = "active"
       ORDER BY f.created_at DESC`,
            [req.user.id]
        );
        res.json(favorites);
    } catch (err) {
        console.error('Get favorites error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
