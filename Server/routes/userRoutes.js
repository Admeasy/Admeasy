const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/userSchema');
const  { authenticateJWT } = require('../middleware/userAuth')
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const BackblazeB2Client = require('../b2Client');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


let conn = mongoose.connect(process.env.MONGODB_USERS_URI);

conn ? console.log('Connected to Users database') : console.log('An error occurred...');

// Helper: generate JWT
function generateAccessToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '12hr' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '28d' }
    );
}

router.get('/', async (req, res) => {
    const users = User.find();
    res.json(users);
});

// SIGN UP
router.post('/signup', async (req, res) => {
    try {
        const { name, image, course, college, phone, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, image, course, college, phone, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LOG IN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 min
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({ success: true, message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LOGOUT
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if (refreshToken) {
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const newAccessToken = generateAccessToken(user);
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000
            });
            res.json({ success: true });
        } catch (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET CURRENT USER (protected)
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refreshToken');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});