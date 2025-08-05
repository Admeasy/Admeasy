const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const multer = require('multer');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Users } = require('../db');
const { verifyAdminToken } = require('../middleware/adminAuth');

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

// Helper: check if image is a Google URL and handle accordingly
async function processUserImage(user) {
    if (!user.image) return user;

    // Check if it's a Google URL (contains googleusercontent.com)
    if (user.image.includes('googleusercontent.com')) {
        // Use proxy URL to avoid rate limiting
        user.image = `/api/users/proxy-image?url=${encodeURIComponent(user.image)}`;
        return user;
    } else {
        // It's a Backblaze file, get authorized URL
        try {
            const imageName = user.image;
            user.image = await b2.getDownloadAuthorization(imageName);
        } catch (err) {
            console.error('Error getting Backblaze authorization:', err);
            // If there's an error, return the original image field
        }
        return user;
    }
}

router.get('/', verifyAdminToken, async (req, res) => {
    const users = await User.find();
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
        req.logout(function (err) {
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

        // Process the user's image (handle Google URLs vs Backblaze files)
        const processedUser = await processUserImage(user);

        res.json({ success: true, user: processedUser });
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

        // Process the user's image (handle Google URLs vs Backblaze files)
        const processedUser = await processUserImage(updatedUser);

        res.json({ success: true, user: processedUser });
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

        if (!user.image) {
            // No image uploaded yet
            return res.json(null);
        }

        // Check if it's a Google URL (contains googleusercontent.com)
        if (user.image.includes('googleusercontent.com')) {
            // Return proxy URL to avoid rate limiting
            return res.json(`/api/users/proxy-image?url=${encodeURIComponent(user.image)}`);
        } else {
            // It's a Backblaze file, get authorized URL
            try {
                const files = await b2.listFiles(user.image);
                if (!files || files.length === 0) {
                    // No image found in Backblaze
                    return res.json(null);
                }
                const fileName = files[0].fileName;
                const auth = await b2.getDownloadAuthorization(fileName);
                res.json(auth.url);
            } catch (err) {
                console.error('Error getting Backblaze authorization:', err);
                res.status(500).json({ success: false, message: 'Error retrieving image' });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// PROXY GOOGLE IMAGE (to avoid rate limiting)
router.get('/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL parameter is required' });
        }

        // Only allow Google user content URLs for security
        if (!url.includes('googleusercontent.com')) {
            return res.status(403).json({ success: false, message: 'Only Google user content URLs are allowed' });
        }

        // Fetch the image from Google
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: `Failed to fetch image: ${response.status} ${response.statusText}`
            });
        }

        // Get the image buffer
        const buffer = await response.arrayBuffer();

        // Set appropriate headers
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Send the image
        res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('Error proxying image:', err);
        res.status(500).json({ success: false, message: 'Error proxying image' });
    }
});

// GET AUTHORIZED IMAGE URL FOR OTHER USER (for admin/unlock functionality)
router.get('/:userId/image', verifyAdminToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.image) {
            return res.json(null);
        }

        // Check if it's a Google URL (contains googleusercontent.com)
        if (user.image.includes('googleusercontent.com')) {
            // Return proxy URL to avoid rate limiting
            return res.json(`/api/users/proxy-image?url=${encodeURIComponent(user.image)}`);
        } else {
            // It's a Backblaze file, get authorized URL
            try {
                const files = await b2.listFiles(user.image);
                if (!files || files.length === 0) {
                    return res.json(null);
                }
                const fileName = files[0].fileName;
                const auth = await b2.getDownloadAuthorization(fileName);
                res.json(auth.url);
            } catch (err) {
                console.error('Error getting Backblaze authorization:', err);
                res.status(500).json({ success: false, message: 'Error retrieving image' });
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete manually uploaded image if present and not a Google image
        if (user.image && !user.image.includes('googleusercontent.com')) {
            try {
                await b2.deleteFiles(user.image);
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Unable to delete User image.' });
            }
        }
        // If this is self-deletion, flush and destroy the session
        if (req.user && req.user._id && req.user._id.toString() === req.params.userId && req.session && req.logout) {
            req.logout(function (err) {
                if (err) {
                    console.error('Error logging out user:', err);
                }
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Error destroying session:', err);
                    }
                });
            });
        }

        await User.findByIdAndDelete(req.params.userId);

        // Remove all sessions for this user from the session store
        try {
            const sessionCollection = Users.collection('sessions');
            await sessionCollection.deleteMany({ "session": { $regex: req.params.userId } });
        } catch (err) {
            console.error('Error deleting user sessions from MongoDB:', err);
        }

        res.json({ success: true, message: 'User and image deleted successfully (if applicable)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
})

module.exports = router;