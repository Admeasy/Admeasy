const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const authenticateJWT = require('../middleware/userAuth')
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// UPDATE CURRENT USER (protected)
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });

        // Log in the user by setting cookies
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 28 * 24 * 60 * 60 * 1000 // 28 days
        });

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
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 28 * 24 * 60 * 60 * 1000 // 28 days
        });
        res.json({ success: true, message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LOGOUT
router.post('/logout', async (req, res) => {
    try {
        // Passport logout (for Google/session users)
        req.logout(function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            req.session?.destroy(() => {
                // Clear cookies as before
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                res.clearCookie('refreshToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                res.json({ success: true, message: 'Logged out' });
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });
        
        // Check if user exists and has this refresh token (not logged out)
        const user = await User.findOne({ refreshToken });
        if (!user) {
            // User has logged out or token is invalid, clear cookies
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            return res.status(403).json({ success: false, message: 'User has logged out' });
        }
        
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const newAccessToken = generateAccessToken(user);
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 12 * 60 * 60 * 1000 // 12 hours
            });
            res.json({ success: true });
        } catch (err) {
            // Refresh token is invalid or expired, clear cookies
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET CURRENT USER (supports both session and JWT)
router.get('/me', async (req, res) => {
    try {
        let user = null;
        if (req.user) {
            // Passport session user
            user = await User.findById(req.user.id || req.user._id).select('-password -refreshToken');
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // JWT fallback
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id).select('-password -refreshToken');
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        } else if (req.cookies['accessToken']) {
            // JWT in cookie fallback
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id).select('-password -refreshToken');
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        }
        if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// UPDATE CURRENT USER (supports both session and JWT)
router.put('/me', upload.single('image'), async (req, res) => {
    try {
        let user = null;
        if (req.user) {
            // Passport session user
            user = await User.findById(req.user.id || req.user._id);
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // JWT fallback
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id);
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        } else if (req.cookies['accessToken']) {
            // JWT in cookie fallback
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id);
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        }
        if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const { name, institute, course, phone, gender } = req.body;
        if (name) user.name = name;
        if (institute) user.institute = institute;
        if (course) user.course = course;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;
        // Handle image upload if file provided
        if (req.file) {
            const ext = path.extname(req.file.originalname).toLowerCase();
            const fileName = `users/${user._id + ext}`;
            await b2.uploadBuffer(req.file.buffer, fileName);
            user.image = fileName;
        }

        await user.save();
        const updatedUser = await User.findById(user._id).select('-password -refreshToken');

        if (updatedUser.image) {
            imageName = updatedUser.image;
            updatedUser.image = b2.getDownloadAuthorization(imageName);
        }

        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET USER PROFILE PICTURE (supports both session and JWT)
router.get('/me/pic', async (req, res) => {
    try {
        let user = null;
        if (req.user) {
            // Passport session user
            user = await User.findById(req.user.id || req.user._id);
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // JWT fallback
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id);
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        } else if (req.cookies['accessToken']) {
            // JWT in cookie fallback
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id);
            } catch (jwtErr) {
                // Token is invalid or expired, clear it
                res.clearCookie('accessToken', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax'
                });
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        }
        if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const files = await b2.listFiles(user.image);
        if (!files || files.length === 0) {
            // No image uploaded yet
            return res.json(null); // or send a default image URL if you want
        }
        const fileName = files[0].fileName;
        const auth = await b2.getDownloadAuthorization(fileName);
        res.json(auth.url);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;