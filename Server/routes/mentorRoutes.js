const express = require('express');
const router = express.Router();
const Mentor = require('../models/mentorSchema');
const MentorshipRequest = require('../models/mentorshipRequestSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateMentorJWT = require('../middleware/mentorAuth');
const { verifyAdminToken } = require('../middleware/adminAuth');
const fetch = require('node-fetch');
const upload = require('../middleware/multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const verifyAdminFromCookie = (req) => {
    const token = req.cookies?.adminToken;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    } catch (err) {
        return null;
    }
};

// Helper: generate JWT with role
const generateAccessToken = (mentor) => {
    return jwt.sign(
        {
            id: mentor._id,
            role: 'mentor'  // Add role to distinguish from user
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '12hr' }
    );
}

const generateRefreshToken = (mentor) => {
    return jwt.sign(
        {
            id: mentor._id,
            role: 'mentor'  // Add role to distinguish from user
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '28d' }
    );
}

const getPublicIdFromUrl = (imageUrl) => {
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) {
        return null; // Not a valid Cloudinary URL format
    }
    const publicIdWithExtension = parts[1];
    const extensionName = path.extname(publicIdWithExtension);
    const publicId = publicIdWithExtension.replace(extensionName, '');
    return publicId;
};

// GET ALL MENTORS
router.get('/', async (req, res) => {
    try {
        const admin = verifyAdminFromCookie(req);

        // Base exclusions (always exclude auth tokens/hashes)
        let selectFields = '-password -refreshToken';

        // If NOT admin, also exclude sensitive private contact info
        if (!admin) {
            selectFields += ' -email -phone';
        }

        const mentors = await Mentor.find().select(selectFields);
        res.status(200).json(mentors);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

// REGISTER MENTOR
router.post('/register', async (req, res) => {
    try {
        const { applicantId, email, password } = req.body;

        if (!applicantId) {
            return res.status(400).json({ success: false, message: 'Applicant ID is required' });
        }

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and Password are required' });
        }

        const existing = await Mentor.findOne({ email });

        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const mentor = new Mentor({ email, password: hashedPassword });

        try {
            const response = await fetch('http://localhost:5000/api/apply/mentorship/' + applicantId, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete application:', response.status, errorText);
                return res.status(500).json({ success: false, message: 'Failed to delete application' });
            }
        } catch (fetchError) {
            console.error('Error deleting application:', fetchError);
            return res.status(500).json({ success: false, message: 'Failed to delete application' });
        }

        await mentor.save();
        const accessToken = generateAccessToken(mentor);
        const refreshToken = generateRefreshToken(mentor);
        mentor.refreshToken = refreshToken;
        await mentor.save();
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
        res.status(200).json({ success: true, message: 'Mentor registered successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

// LOGIN MENTOR
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and Password are required' });
        }

        const mentor = await Mentor.findOne({ email });

        if (!mentor) {
            return res.status(401).json('Invalid Credentials');
        }

        const authorized = await bcrypt.compare(password, mentor.password);

        if (!authorized) {
            return res.status(401).json('Invalid Credentials');
        }

        const accessToken = generateAccessToken(mentor);
        const refreshToken = generateRefreshToken(mentor);
        mentor.refreshToken = refreshToken;
        await mentor.save();
        
        // CRITICAL: Set session for Socket.io compatibility
        if (req.session) {
            req.session.mentorId = mentor._id;
            req.session.userRole = 'mentor';
            // Clear user session if exists
            delete req.session.userId;
            // Save session explicitly to ensure it's available for socket connections
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Error saving mentor session:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        
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
})

// GET CURRENT MENTOR (must be before /:username route)
router.get('/me', authenticateMentorJWT, async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.mentor.id).select('-password -refreshToken');
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        // CRITICAL: Ensure session is set for Socket.io
        if (req.session) {
            req.session.mentorId = mentor._id;
            req.session.userRole = 'mentor';
            // Clear user session if exists
            delete req.session.userId;
            // Explicitly save session
            await new Promise((resolve) => {
                req.session.save((err) => {
                    if (err) console.error('Error saving mentor session in /me:', err);
                    resolve();
                });
            });
        }

        res.json({ success: true, mentor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET CURRENT MENTOR PROFILE PICTURE
router.get('/me/pic', authenticateMentorJWT, async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.mentor.id);
        if (!mentor || !mentor.image) {
            return res.json(null);
        }

        // Return Cloudinary URL directly
        res.json(mentor.image);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET MENTOR PROFILE PICTURE BY ID
router.get('/:id/pic', async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.id);
        if (!mentor || !mentor.image) {
            return res.json(null);
        }

        // Return Cloudinary URL directly
        res.json(mentor.image);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET MENTOR BY ID (must be before /:username route to avoid conflicts)
router.get('/id/:id', async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.id).select('-password -refreshToken -email');
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET MENTOR BY USERNAME
router.get('/:username', async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ username: req.params.username }).select('-password -refreshToken -email');
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

// UPDATE MENTOR PROFILE (with image upload to Cloudinary)
router.put('/me/:id', authenticateMentorJWT, upload.single('image'), async (req, res) => {
    try {
        console.log("=== UPDATE MENTOR REQUEST ===");
        console.log("Body:", req.body);
        console.log("File:", req.file);

        const { name, username, phone, tagline, bio } = req.body;
        let competitiveExamsCleared = [];
        if (req.body.competitiveExamsCleared) {
            try {
                const parsedExams = typeof req.body.competitiveExamsCleared === 'string' ? JSON.parse(req.body.competitiveExamsCleared) : req.body.competitiveExamsCleared;
                if (Array.isArray(parsedExams)) {
                    competitiveExamsCleared = parsedExams
                        .filter(exam => exam && exam.name)
                        .map(exam => ({ name: exam.name }));
                }
            } catch (parseError) {
                console.error('Error parsing competitiveExamsCleared:', parseError);
            }
        }

        // Parse college from JSON string if provided
        let college = null;
        if (req.body.college) {
            try {
                college = typeof req.body.college === 'string' && req.body.college.trim() !== ''
                    ? JSON.parse(req.body.college)
                    : req.body.college;
            } catch (parseError) {
                console.error('Error parsing college:', parseError);
            }
        }

        // Parse course from JSON string if provided
        let course = null;
        if (req.body.course) {
            try {
                course = typeof req.body.course === 'string' && req.body.course.trim() !== ''
                    ? JSON.parse(req.body.course)
                    : req.body.course;
            } catch (parseError) {
                console.error('Error parsing course:', parseError);
            }
        }

        // Find existing mentor
        const existingMentor = await Mentor.findById(req.params.id);
        if (!existingMentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        // Check username uniqueness if username is being changed
        if (username && username !== existingMentor.username) {
            const normalizedUsername = username.trim().toLowerCase();
            // Escape special regex characters to match literally
            const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Check if username is already taken by another mentor
            const mentorWithUsername = await Mentor.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') },
                _id: { $ne: req.params.id }
            });

            // Also check if username is taken by a user
            const User = require('../models/userSchema');
            const userWithUsername = await User.findOne({
                username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
            });

            if (mentorWithUsername || userWithUsername) {
                return res.status(409).json({ success: false, message: 'Username is already taken' });
            }
        }

        const updateData = { name, username, phone, tagline, bio };
        if (college) {
            updateData.college = college;
        }
        if (course) {
            updateData.course = course;
        }
        if (competitiveExamsCleared.length > 0) {
            updateData.competitiveExamsCleared = competitiveExamsCleared;
        }

        // Handle image upload to Cloudinary
        if (req.file) {
            try {
                console.log("Uploading image to Cloudinary:", req.file.path);
                const cloudUrl = await uploadToCloudinary(req.file.path, 'mentor_profiles');
                updateData.image = cloudUrl;
                console.log("Image uploaded to Cloudinary:", cloudUrl);
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                return res.status(500).json({ success: false, message: 'Error uploading image' });
            }
        }

        const mentor = await Mentor.findByIdAndUpdate(req.params.id, updateData, { new: true });

        console.log("Mentor updated successfully");
        res.status(200).json({ success: true, message: 'Mentor updated successfully', mentor });
    } catch (error) {
        console.error("Error updating mentor:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

// REFRESH TOKEN
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies['refreshToken'];
        if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

        // Check if user exists and has this refresh token (not logged out)
        const mentor = await Mentor.findOne({ refreshToken });
        if (!mentor) {
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
            const newAccessToken = generateAccessToken(mentor);
            
            // CRITICAL: Set session for Socket.io compatibility
            if (req.session) {
                req.session.mentorId = mentor._id;
                req.session.userRole = 'mentor';
                // Clear user session if exists
                delete req.session.userId;
                // Save session explicitly to ensure it's available for socket connections
                await new Promise((resolve, reject) => {
                    req.session.save((err) => {
                        if (err) {
                            console.error('Error saving mentor session in refresh:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
            
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

// LOGOUT MENTOR
router.post('/logout', authenticateMentorJWT, async (req, res) => {
    try {
        // Clear refresh token from database
        await Mentor.findByIdAndUpdate(req.mentor.id, { refreshToken: null });

        // Clear cookies
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
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE MENTOR
router.delete('/:id', async (req, res) => {
    const admin = verifyAdminFromCookie(req);

    if (admin) {
        try {
            // Find the mentor first
            const mentor = await Mentor.findById(req.params.id);
            if (!mentor) {
                return res.status(404).json({ success: false, message: 'Mentor not found' });
            }

            if (mentor.image) {
                const publicId = getPublicIdFromUrl(mentor.image);
                await deleteFromCloudinary(publicId);
            }

            // Delete the mentor from database
            await Mentor.findByIdAndDelete(req.params.id);
            return res.json({ success: true, message: 'Mentor deleted successfully', mentorId: mentor._id });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    authenticateMentorJWT(req, res, async () => {
        try {
            if (!req.mentor || req.mentor.id !== req.params.id) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this mentor' });
            }

            // Find the mentor first
            const mentor = await Mentor.findById(req.params.id);
            if (!mentor) {
                return res.status(404).json({ success: false, message: 'Mentor not found' });
            }

            // Delete the mentor from database
            await Mentor.findByIdAndDelete(req.params.id);

            if (mentor.image) {
                const publicId = getPublicIdFromUrl(mentor.image);
                await deleteFromCloudinary(publicId);
            }

            res.status(200).json({ success: true, message: 'Mentor deleted successfully' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });
})

module.exports = router;