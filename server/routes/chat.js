import express from 'express';
import pool from '../db/connection.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
    try {
        const [conversations] = await pool.query(
            `SELECT c.*, 
              l.title as listing_title, l.price as listing_price,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as listing_image,
              buyer.name as buyer_name, buyer.avatar as buyer_avatar,
              seller.name as seller_name, seller.avatar as seller_avatar,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM conversations c
       JOIN listings l ON c.listing_id = l.id
       JOIN users buyer ON c.buyer_id = buyer.id
       JOIN users seller ON c.seller_id = seller.id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY last_message_time DESC`,
            [req.user.id, req.user.id, req.user.id]
        );
        res.json(conversations);
    } catch (err) {
        console.error('Get conversations error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Start or get existing conversation
router.post('/conversations', auth, async (req, res) => {
    try {
        const { listing_id } = req.body;

        // Get the listing to find seller
        const [listings] = await pool.query('SELECT * FROM listings WHERE id = ?', [listing_id]);
        if (listings.length === 0) {
            return res.status(404).json({ message: 'Listing not found.' });
        }

        const listing = listings[0];
        if (listing.seller_id === req.user.id) {
            return res.status(400).json({ message: 'Cannot start conversation with yourself.' });
        }

        // Check if conversation already exists
        const [existing] = await pool.query(
            'SELECT * FROM conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?',
            [listing_id, req.user.id, listing.seller_id]
        );

        if (existing.length > 0) {
            return res.json(existing[0]);
        }

        // Create new conversation
        const [result] = await pool.query(
            'INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)',
            [listing_id, req.user.id, listing.seller_id]
        );

        const [newConv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
        res.status(201).json(newConv[0]);
    } catch (err) {
        console.error('Create conversation error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Get messages in a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
    try {
        // Verify user is part of the conversation
        const [convs] = await pool.query(
            'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)',
            [req.params.id, req.user.id, req.user.id]
        );
        if (convs.length === 0) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        // Mark messages as read
        await pool.query(
            'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
            [req.params.id, req.user.id]
        );

        const [messages] = await pool.query(
            `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
            [req.params.id]
        );
        res.json(messages);
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
