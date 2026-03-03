import express from 'express';
import pool from '../db/connection.js';
import { auth, sellerOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get all listings with search, filter, pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            min_price,
            max_price,
            condition,
            location,
            sort = 'newest',
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = 'WHERE l.status = "active"';
        const params = [];

        if (search) {
            whereClause += ' AND (l.title LIKE ? OR l.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            whereClause += ' AND c.slug = ?';
            params.push(category);
        }

        if (min_price) {
            whereClause += ' AND l.price >= ?';
            params.push(Number(min_price));
        }

        if (max_price) {
            whereClause += ' AND l.price <= ?';
            params.push(Number(max_price));
        }

        if (condition) {
            whereClause += ' AND l.`condition` = ?';
            params.push(condition);
        }

        if (location) {
            whereClause += ' AND l.location LIKE ?';
            params.push(`%${location}%`);
        }

        let orderClause = 'ORDER BY l.created_at DESC';
        if (sort === 'price_low') orderClause = 'ORDER BY l.price ASC';
        if (sort === 'price_high') orderClause = 'ORDER BY l.price DESC';
        if (sort === 'popular') orderClause = 'ORDER BY l.views_count DESC';

        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM listings l JOIN categories c ON l.category_id = c.id ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // Get listings
        const [listings] = await pool.query(
            `SELECT l.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
              u.name as seller_name, u.location as seller_location,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.seller_id = u.id
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
            [...params, Number(limit), Number(offset)]
        );

        res.json({
            listings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Get listings error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get single listing
router.get('/:id', async (req, res) => {
    try {
        const [listings] = await pool.query(
            `SELECT l.*, c.name as category_name, c.slug as category_slug,
              u.name as seller_name, u.email as seller_email, u.phone as seller_phone, 
              u.location as seller_location, u.avatar as seller_avatar, u.created_at as seller_joined
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.seller_id = u.id
       WHERE l.id = ?`,
            [req.params.id]
        );

        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        // Increment views
        await pool.query('UPDATE listings SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

        // Get images
        const [images] = await pool.query(
            'SELECT * FROM listing_images WHERE listing_id = ? ORDER BY sort_order',
            [req.params.id]
        );

        res.json({ ...listings[0], images });
    } catch (err) {
        console.error('Get listing error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create listing with images
router.post('/', auth, sellerOnly, upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category_id, location, condition } = req.body;

        if (!title || !price || !category_id) {
            return res.status(400).json({ message: 'Title, price, and category are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO listings (seller_id, category_id, title, description, price, location, `condition`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, category_id, title, description || '', Number(price), location || '', condition || 'used']
        );

        const listingId = result.insertId;

        // Save images
        if (req.files && req.files.length > 0) {
            const imageValues = req.files.map((file, index) => [
                listingId,
                `/uploads/${file.filename}`,
                index === 0 ? true : false,
                index,
            ]);
            await pool.query(
                'INSERT INTO listing_images (listing_id, image_url, is_primary, sort_order) VALUES ?',
                [imageValues]
            );
        }

        const [newListing] = await pool.query('SELECT * FROM listings WHERE id = ?', [listingId]);
        const [images] = await pool.query('SELECT * FROM listing_images WHERE listing_id = ?', [listingId]);

        res.status(201).json({ ...newListing[0], images });
    } catch (err) {
        console.error('Create listing error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update listing
router.put('/:id', auth, sellerOnly, async (req, res) => {
    try {
        const { title, description, price, category_id, location, condition, status } = req.body;

        // Verify ownership
        const [listings] = await pool.query('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [
            req.params.id,
            req.user.id,
        ]);
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found or not authorized.' });
        }

        await pool.query(
            'UPDATE listings SET title = ?, description = ?, price = ?, category_id = ?, location = ?, `condition` = ?, status = ? WHERE id = ?',
            [
                title || listings[0].title,
                description || listings[0].description,
                price || listings[0].price,
                category_id || listings[0].category_id,
                location || listings[0].location,
                condition || listings[0].condition,
                status || listings[0].status,
                req.params.id,
            ]
        );

        const [updated] = await pool.query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('Update listing error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete listing (soft)
router.delete('/:id', auth, sellerOnly, async (req, res) => {
    try {
        const [listings] = await pool.query('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [
            req.params.id,
            req.user.id,
        ]);
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found or not authorized.' });
        }

        await pool.query('UPDATE listings SET status = "removed" WHERE id = ?', [req.params.id]);
        res.json({ message: 'Listing removed successfully.' });
    } catch (err) {
        console.error('Delete listing error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get current user's listings
router.get('/user/me', auth, async (req, res) => {
    try {
        const [listings] = await pool.query(
            `SELECT l.*, c.name as category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       WHERE l.seller_id = ? AND l.status != "removed"
       ORDER BY l.created_at DESC`,
            [req.user.id]
        );
        res.json(listings);
    } catch (err) {
        console.error('Get user listings error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
