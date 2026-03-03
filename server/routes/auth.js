import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import { auth } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, location, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required.' });
        }

        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, phone, location, role) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, password_hash, phone || null, location || null, role]
        );

        const token = jwt.sign(
            { id: result.insertId, email, role, name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: result.insertId, name, email, phone, location, role },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, phone, location, role, avatar, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error('Get me error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, location } = req.body;
        await pool.query(
            'UPDATE users SET name = ?, phone = ?, location = ? WHERE id = ?',
            [name, phone, location, req.user.id]
        );
        const [users] = await pool.query(
            'SELECT id, name, email, phone, location, role, avatar, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json(users[0]);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
