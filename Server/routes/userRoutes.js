const express = require('express');
const { resetPassword, forgotPassword } = require('../controllers/userController.js')
const { sendEmailVerification, verifyEmail } = require('../controllers/emailverify.js')
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/auth');
const router = express.Router();
const User = require('../models/userSchema');
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const multer = require('multer');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Users } = require('../db.js');
const { verifyAdminToken } = require('../middleware/adminAuth');
const passport = require('../middleware/passport');
const { authenticateRequired, requireSelfOrAdmin } = require('../middleware/combinedAuth');
// UPDATE CURRENT USER (protected)
const storage = multer.memoryStorage();
const upload = multer({ storage });


// Helper: Get frontend URL for redirects (works for both dev and production)
function getFrontendUrl() {
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
    }
    // Default based on environment
    return process.env.NODE_ENV === 'production' ? 'https://admeasy.in' : 'http://localhost:5173';
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
        const { email, password, username } = req.body;

        // Validate
        if (!email || !password || !username) {
            return res
                .status(400)
                .json({ success: false, message: 'Email, password, and username are required' });
        }

        // Check existing user by email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res
                .status(409)
                .json({ success: false, message: 'Email already registered' });
        }

        // Check availability of username
        const normalizedUsername = username.trim().toLowerCase();
        const existingUsername = await User.findOne({
            username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (existingUsername) {
            return res
                .status(409)
                .json({ success: false, message: 'Username is already taken' });
        }

        // Also check if username is taken by a mentor
        const Mentor = require('../models/mentorSchema');
        const existingMentorUsername = await Mentor.findOne({
            username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (existingMentorUsername) {
            return res
                .status(409)
                .json({ success: false, message: 'Username is already taken' });
        }

        // Hash password & create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, username: normalizedUsername });

        // Generate tokens
        await user.save();

        // Generate tokens and log in automatically
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        setTokenCookies(res, accessToken, refreshToken);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        // Set session for Socket.io
        if (req.session) {
            req.session.userId = user._id;
            req.session.userRole = 'user';
            // Clear mentor session if exists
            delete req.session.mentorId;
            // Explicitly save session
            await new Promise((resolve) => {
                req.session.save((err) => {
                    if (err) console.error('Error saving user session in signup:', err);
                    resolve();
                });
            });
        }

        // Response
        return res.status(201).json({
            id: user._id,
            success: true,
            message: 'User registered successfully.',
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Complete onboarding and save user data
router.post('/onboarding', async (req, res) => {
    try {
        // get user from token if exists(user might be logged in from signup)
        let user = null;
        if (req.cookies['accessToken']) {
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id);
            } catch (jwtErr) {
                // token invalid,user needs to create account
            }
        }

        // If user doesn't exist, create new account
        if (!user) {
            const { email, password, username } = req.body;
            if (!email || !password || !username) {
                return res.status(400).json({ success: false, message: 'Email, password, and username are required for new accounts' });
            }

            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Email already registered. Please log in first.' });
            }

            // Check availability of username
            const normalizedUsername = username.trim().toLowerCase();
            const existingUsername = await User.findOne({
                username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });

            if (existingUsername) {
                return res.status(409).json({ success: false, message: 'Username is already taken' });
            }

            const Mentor = require('../models/mentorSchema');
            const existingMentorUsername = await Mentor.findOne({
                username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });

            if (existingMentorUsername) {
                return res.status(409).json({ success: false, message: 'Username is already taken' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({ email, password: hashedPassword, username: normalizedUsername });
        }

        // Check if user has already completed onboarding
        if (user.hasCompletedOnboarding) {
            return res.status(403).json({ success: false, message: 'Onboarding already completed' });
        }

        // Extract onboarding data from request body
        const {
            name,
            gender,
            languages,
            city,
            phone,
            username,
            educationType,
            board,
            universityName,
            class: userClass,
            stream,
            schoolName,
            courseLevel,
            courseDetails,
            collegeName,
            examsPreparingFor,
            reasonForAdmeasy,
            reasonForAdmeasyInput
        } = req.body;

        // Update user with onboarding data
        if (name) user.name = name;
        if (gender) user.gender = gender;
        if (languages && Array.isArray(languages)) user.languages = languages;
        if (city) user.city = city;
        if (phone) user.phone = typeof phone === 'string' ? parseInt(phone) : phone;

        // Handle username update if provided and not already set
        if (username && !user.username) {
            const normalizedUsername = username.trim().toLowerCase();
            const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Check uniqueness
            const existingUser = await User.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
            });
            const Mentor = require('../models/mentorSchema');
            const existingMentor = await Mentor.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
            });

            if (existingUser || existingMentor) {
                return res.status(409).json({ success: false, message: 'Username is already taken' });
            }
            user.username = normalizedUsername;
        }

        if (educationType) user.educationType = educationType;
        if (board) user.board = board;
        if (universityName) user.universityName = universityName;
        if (userClass) user.class = userClass;
        if (stream) user.stream = stream;
        if (schoolName) user.schoolName = schoolName;
        if (courseLevel) user.courseLevel = courseLevel;
        if (courseDetails) user.courseDetails = courseDetails;
        if (collegeName) user.collegeName = collegeName;
        if (examsPreparingFor && Array.isArray(examsPreparingFor)) user.examsPreparingFor = examsPreparingFor;
        if (reasonForAdmeasy) user.reasonForAdmeasy = reasonForAdmeasy;
        if (reasonForAdmeasyInput) user.reasonForAdmeasyInput = reasonForAdmeasyInput;

        // Set institute and course based on education type
        if (educationType === 'school' && schoolName) {
            user.institute = schoolName;
            if (userClass) {
                user.course = `Class ${userClass}`;
                if (stream) {
                    user.course += ` (${stream})`;
                }
            }
        } else if (educationType === 'college' && collegeName) {
            user.institute = collegeName;
            if (courseDetails) {
                user.course = courseDetails;
            }
        }

        // Mark onboarding as completed
        user.hasCompletedOnboarding = true;

        // Generate tokens if user is new
        if (!user.refreshToken) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            user.refreshToken = refreshToken;
            setTokenCookies(res, accessToken, refreshToken);
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Onboarding completed successfully', user: await User.findById(user._id).select('-password -refreshToken') });
    } catch (err) {
        console.error('Onboarding error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// CHECK ONBOARDING STATUS - Check if user can access onboarding
router.get('/onboarding/status', async (req, res) => {
    try {
        let user = null;
        if (req.cookies['accessToken']) {
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id).select('hasCompletedOnboarding email');
            } catch (jwtErr) {
                // Not logged in, can access onboarding
                return res.json({ success: true, canAccess: true, reason: 'not_logged_in' });
            }
        }

        if (!user) {
            // Not logged in, can access onboarding
            return res.json({ success: true, canAccess: true, reason: 'not_logged_in' });
        }

        // If user has completed onboarding, they cannot access it
        // if (user.hasCompletedOnboarding) {
        //     return res.json({ success: true, canAccess: false, reason: 'already_completed' });
        // }

        // User is logged in but hasn't completed onboarding
        return res.json({ success: true, canAccess: true, reason: 'not_completed' });
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
        // Check if user signed up with Google (no password)
        if (!user.password) {
            return res.status(401).json({ success: false, message: 'This account was created with Google. Please sign in with Google.' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email address to log in.', isNotVerified: true });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();

        // CRITICAL: Set session for Socket.io compatibility
        if (req.session) {
            req.session.userId = user._id;
            req.session.userRole = 'user';
            // Clear mentor session if exists
            delete req.session.mentorId;
            // Save session explicitly to ensure it's available for socket connections
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Error saving user session:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        setTokenCookies(res, accessToken, refreshToken);
        res.json({ success: true, message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GOOGLE OAUTH ROUTES
// Initiate Google OAuth
router.get('/auth/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({ success: false, message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
    }
    // Store the original URL or any state if needed
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent',
        session: false // Disable sessions, use JWT instead
    })(req, res, next);
});

// Google OAuth callback
router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${getFrontendUrl()}/login?error=google_auth_failed`,
        session: false // Disable sessions, use JWT instead
    }),
    async (req, res) => {
        try {
            // Safety check: ensure user is authenticated
            if (!req.user) {
                console.error('Google OAuth callback: req.user is undefined');
                return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
            }

            // Generate JWT tokens for the authenticated user
            const accessToken = generateAccessToken(req.user);
            const refreshToken = generateRefreshToken(req.user);
            req.user.refreshToken = refreshToken;
            await req.user.save();

            // CRITICAL: Set session for Socket.io compatibility
            if (req.session) {
                req.session.userId = req.user._id;
                req.session.userRole = 'user';
                // Clear mentor session if exists
                delete req.session.mentorId;
                // Save session explicitly to ensure it's available for socket connections
                await new Promise((resolve, reject) => {
                    req.session.save((err) => {
                        if (err) {
                            console.error('Error saving user session:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }

            // Set cookies
            setTokenCookies(res, accessToken, refreshToken);

            // Redirect to frontend
            const frontendUrl = getFrontendUrl();
            // Check if user has completed onboarding
            if (req.user.hasCompletedOnboarding) {
                res.redirect(`${frontendUrl}/?oauth_success=true`);
            } else {
                res.redirect(`${frontendUrl}/onboarding?oauth_success=true`);
            }
        } catch (err) {
            console.error('Google OAuth callback error:', err);
            res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
        }
    }
);

// LOGOUT
router.post('/logout', async (req, res) => {
    try {
        // Get refresh token from cookie to identify user
        const refreshToken = req.cookies['refreshToken'];

        // Clear refresh token from database if it exists
        if (refreshToken) {
            try {
                await User.updateOne(
                    { refreshToken: refreshToken },
                    { $unset: { refreshToken: 1 } }
                );

            } catch (dbErr) {
                // Log error but don't fail logout if DB update fails
                console.error('Error clearing refresh token from database:', dbErr);
            }
        }

        // Clear cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
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

        // CRITICAL: Ensure session is set for Socket.io
        if (req.session) {
            req.session.userId = user._id;
            req.session.userRole = 'user';
            // Clear mentor session if exists
            delete req.session.mentorId;
            // Explicitly save session
            await new Promise((resolve) => {
                req.session.save((err) => {
                    if (err) console.error('Error saving user session in /me:', err);
                    resolve();
                });
            });
        }

        // Process the user's image (handle Google URLs vs Backblaze files)
        const processedUser = await processUserImage(user);

        res.json({ success: true, user: processedUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET CURRENT USER VERIFICATION STATUS (for email verification modal polling)
router.get('/me/verification-status', async (req, res) => {
    try {
        let user = null;

        // Check for JWT in cookie (primary method for newly signed up users)
        if (req.cookies['accessToken']) {
            const token = req.cookies['accessToken'];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id).select('isVerified');
            } catch (jwtErr) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            // JWT in header fallback
            const token = req.headers.authorization.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                user = await User.findById(decoded.id).select('isVerified');
            } catch (jwtErr) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        res.json({ success: true, isVerified: user.isVerified });
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

        const {
            name, institute, course, phone, gender,
            languages, city, educationType, board, universityName,
            class: userClass, stream, schoolName, courseLevel, courseDetails,
            collegeName, examsPreparingFor, reasonForAdmeasy, reasonForAdmeasyInput
        } = req.body;

        if (name) user.name = name;

        // Check username uniqueness if username is being changed
        if (req.body.username !== undefined && req.body.username !== user.username) {
            const normalizedUsername = req.body.username.trim().toLowerCase();
            // Escape special regex characters to match literally
            const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Check if username is already taken by another user
            const userWithUsername = await User.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') },
                _id: { $ne: user._id }
            });

            // Also check if username is taken by a mentor
            const Mentor = require('../models/mentorSchema');
            const mentorWithUsername = await Mentor.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
            });

            if (userWithUsername || mentorWithUsername) {
                return res.status(409).json({ success: false, message: 'Username is already taken' });
            }

            user.username = req.body.username;
        }

        if (institute) user.institute = institute;
        if (course) user.course = course;
        if (phone) user.phone = typeof phone === 'string' ? parseInt(phone) : phone;
        if (gender) user.gender = gender;

        // Onboarding fields - handle JSON strings from FormData
        if (languages !== undefined) {
            try {
                user.languages = typeof languages === 'string' ? JSON.parse(languages) : (Array.isArray(languages) ? languages : []);
            } catch {
                user.languages = Array.isArray(languages) ? languages : [];
            }
        }
        if (city !== undefined) user.city = city;
        if (educationType) user.educationType = educationType;
        if (board) user.board = board;
        if (universityName) user.universityName = universityName;
        if (userClass) user.class = userClass;
        if (stream) user.stream = stream;
        if (schoolName) user.schoolName = schoolName;
        if (courseLevel) user.courseLevel = courseLevel;
        if (courseDetails) user.courseDetails = courseDetails;
        if (collegeName) user.collegeName = collegeName;
        if (examsPreparingFor !== undefined) {
            try {
                user.examsPreparingFor = typeof examsPreparingFor === 'string' ? JSON.parse(examsPreparingFor) : (Array.isArray(examsPreparingFor) ? examsPreparingFor : []);
            } catch {
                user.examsPreparingFor = Array.isArray(examsPreparingFor) ? examsPreparingFor : [];
            }
        }
        if (reasonForAdmeasy) user.reasonForAdmeasy = reasonForAdmeasy;
        if (reasonForAdmeasyInput) user.reasonForAdmeasyInput = reasonForAdmeasyInput;
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
        console.log(err);
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

router.delete(
    '/:userId',
    authenticateRequired,
    requireSelfOrAdmin,
    async (req, res) => {
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
            const isSelf =
                req.user &&
                req.user._id &&
                req.user._id.toString() === req.params.userId;

            if (isSelf && req.logout) {
                await new Promise((resolve) => {
                    req.logout((err) => {
                        if (err) {
                            console.error('Error logging out user:', err);
                        }
                        resolve();
                    });
                });

                if (req.session) {
                    await new Promise((resolve) => {
                        req.session.destroy((err) => {
                            if (err) {
                                console.error('Error destroying session:', err);
                            }
                            resolve();
                        });
                    });
                }
            }


            await User.findByIdAndDelete(req.params.userId);

            // Remove all sessions for this user from the session store
            try {
                const sessionCollection = Users.collection('sessions');
                await sessionCollection.deleteMany({
                    "session.userId": req.params.userId
                });
            } catch (err) {
                console.error('Error deleting user sessions from MongoDB:', err);
            }

            res.json({ success: true, message: 'User and image deleted successfully (if applicable)' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })

// EMAIL VERIFICATION
router.post("/send-verification-email", sendEmailVerification);
router.get("/verify-email/:token", verifyEmail);

// RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// GET USER BY ID (for mentors who have chats with the user, or users viewing their own profile)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const token = req.cookies['accessToken'];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // Check if this is a mentor by checking if there's a mentor with this ID
        // OPTIMIZED: Using lean() and parallel queries where possible
        const Mentor = require('../models/mentorSchema');
        const mentor = await Mentor.findById(decoded.id).lean();

        if (mentor) {
            // It's a mentor - verify they have a chat with this user
            const Chat = require('../models/chatSchema');
            const chat = await Chat.findOne({
                userId,
                mentorId: decoded.id,
                isActive: true
            }).lean();

            if (!chat) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view details of users you have chats with'
                });
            }
        } else {
            // It's a regular user - they can only view their own profile
            if (decoded.id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only view your own profile'
                });
            }
        }

        // Find the user - OPTIMIZED: Using lean() for faster queries
        const user = await User.findById(userId).select('-password -refreshToken').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Process image if needed
        const processedUser = await processUserImage(user);

        res.json(processedUser);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/users/:targetId/follow
 * Follow a user or mentor (authenticated users and mentors can follow anyone)
 */
router.post('/:targetId/follow', async (req, res) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const targetId = req.params.targetId;
        const Mentor = require('../models/mentorSchema');

        // Get the follower (can be user or mentor)
        let follower = null;
        let followerType = null;

        if (decoded.role === 'mentor') {
            follower = await Mentor.findById(decoded.id || decoded._id);
            followerType = 'mentor';
        } else {
            follower = await User.findById(decoded.id || decoded._id);
            followerType = 'user';
        }

        if (!follower) {
            return res.status(404).json({ success: false, message: 'Follower not found' });
        }

        // Prevent self-follow
        if (follower._id.toString() === targetId) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        // Find the target (can be user or mentor)
        let target = await User.findById(targetId);
        let targetType = 'user';

        if (!target) {
            target = await Mentor.findById(targetId);
            targetType = 'mentor';
        }

        if (!target) {
            return res.status(404).json({ success: false, message: 'Target user or mentor not found' });
        }

        // Initialize arrays if they don't exist (for existing records)
        if (!follower.following) {
            follower.following = [];
        }
        if (!target.followers) {
            target.followers = [];
        }

        // Check if already following
        const isFollowing = follower.following.some(
            id => id.toString() === targetId
        );

        if (isFollowing) {
            // Unfollow
            follower.following = follower.following.filter(
                id => id.toString() !== targetId
            );
            target.followers = target.followers.filter(
                id => id.toString() !== follower._id.toString()
            );
            await follower.save();
            await target.save();

            return res.json({
                success: true,
                message: 'Unfollowed successfully',
                isFollowing: false,
                followersCount: target.followers.length
            });
        } else {
            // Follow
            follower.following.push(target._id);
            target.followers.push(follower._id);
            await follower.save();
            await target.save();

            return res.json({
                success: true,
                message: 'Followed successfully',
                isFollowing: true,
                followersCount: target.followers.length
            });
        }
    } catch (error) {
        console.error('Error following/unfollowing:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * GET /api/users/:targetId/follow-status
 * Check if current user/mentor is following a target user or mentor (optional auth)
 */
router.get('/:targetId/follow-status', async (req, res) => {
    try {
        const token = req.cookies?.accessToken;
        let isFollowing = false;
        const targetId = req.params.targetId;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                const Mentor = require('../models/mentorSchema');

                // Get the current user/mentor
                let currentUser = null;
                if (decoded.role === 'mentor') {
                    currentUser = await Mentor.findById(decoded.id || decoded._id);
                } else {
                    currentUser = await User.findById(decoded.id || decoded._id);
                }

                if (currentUser && currentUser.following) {
                    isFollowing = currentUser.following.some(
                        id => id.toString() === targetId
                    );
                }
            } catch (err) {
                // Token invalid, user not logged in
            }
        }

        // Find the target (can be user or mentor) to get followers count
        const Mentor = require('../models/mentorSchema');
        let target = await User.findById(targetId);

        if (!target) {
            target = await Mentor.findById(targetId);
        }

        const followersCount = target && target.followers ? target.followers.length : 0;

        res.json({
            success: true,
            isFollowing,
            followersCount
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * GET /api/users/:targetId/followers
 * Get list of followers for a user or mentor
 */
router.get('/:targetId/followers', authenticateRequired, async (req, res) => {
    try {
        const targetId = req.params.targetId;
        const Mentor = require('../models/mentorSchema');

        // Find the target (can be user or mentor)
        let target = await User.findById(targetId);

        if (!target) {
            target = await Mentor.findById(targetId);
        }

        if (!target) {
            return res.status(404).json({ success: false, message: 'User or mentor not found' });
        }

        const followersIds = target.followers || [];

        // Fetch followers (can be users or mentors)
        const followers = [];
        for (const id of followersIds) {
            let follower = await User.findById(id).select('name username image imageUrl _id');
            if (!follower) {
                follower = await Mentor.findById(id).select('name username image imageUrl _id');
                if (follower) {
                    follower = follower.toObject();
                    follower.type = 'mentor';
                }
            } else {
                follower = follower.toObject();
                follower.type = 'user';
            }

            if (follower) {
                followers.push(follower);
            }
        }

        res.json({
            success: true,
            followers,
            count: followers.length
        });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

/**
 * GET /api/users/:targetId/following
 * Get list of users/mentors that the target is following
 */
router.get('/:targetId/following', authenticateRequired, async (req, res) => {
    try {
        const targetId = req.params.targetId;
        const Mentor = require('../models/mentorSchema');

        // Find the target (can be user or mentor)
        let target = await User.findById(targetId);

        if (!target) {
            target = await Mentor.findById(targetId);
        }

        if (!target) {
            return res.status(404).json({ success: false, message: 'User or mentor not found' });
        }

        const followingIds = target.following || [];

        // Fetch following (can be users or mentors)
        const following = [];
        for (const id of followingIds) {
            let followed = await User.findById(id).select('name username image imageUrl _id');
            if (!followed) {
                followed = await Mentor.findById(id).select('name username image imageUrl _id');
                if (followed) {
                    followed = followed.toObject();
                    followed.type = 'mentor';
                }
            } else {
                followed = followed.toObject();
                followed.type = 'user';
            }

            if (followed) {
                following.push(followed);
            }
        }

        res.json({
            success: true,
            following,
            count: following.length
        });
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;