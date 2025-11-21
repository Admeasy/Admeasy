const express = require('express');
const router = express.Router();
const Mentor = require('../models/mentorSchema');
const MentorshipRequest = require('../models/mentorshipRequestSchema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const BackblazeB2Client = require('../b2Client');
const b2 = new BackblazeB2Client();
const multer = require('multer');
const authenticateMentorJWT = require('../middleware/mentorAuth');
const { verifyAdminToken } = require('../middleware/adminAuth');


const storage = multer.memoryStorage();
const upload = multer({ storage });

const verifyAdminFromCookie = (req) => {
    const token = req.cookies?.adminToken;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    } catch (err) {
        return null;
    }
};

const generateAccessToken = (mentor) => {
    return jwt.sign({ id: mentor._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '12hr' });
}

const generateRefreshToken = (mentor) => {
    return jwt.sign({ id: mentor._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '28d' });
}

router.get('/', async (req, res) => {
    try {
        const mentors = await Mentor.find();
        res.status(200).json(mentors);
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
})

// GET CURRENT MENTOR (must be before /:username route)
router.get('/me', authenticateMentorJWT, async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.mentor.id).select('-password -refreshToken');
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
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

        // It's a Backblaze file, get authorized URL
        try {
            const files = await b2.listFiles(mentor.image);
            if (!files || files.length === 0) {
                // No image found in Backblaze
                return res.json(null);
            }
            const fileName = files[0].fileName;
            const auth = await b2.getDownloadAuthorization(fileName);
            res.json(auth.url);
        } catch (err) {
            console.error('Error getting mentor image from B2:', err);
            return res.json(null);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET MENTOR PROFILE PICTURE BY USERNAME (must be before /:username route)
router.get('/:username/pic', async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ username: req.params.username });
        if (!mentor || !mentor.image) {
            return res.json(null);
        }

        // It's a Backblaze file, get authorized URL
        try {
            const files = await b2.listFiles(mentor.image);
            if (!files || files.length === 0) {
                // No image found in Backblaze
                return res.json(null);
            }
            const fileName = files[0].fileName;
            const auth = await b2.getDownloadAuthorization(fileName);
            res.json(auth.url);
        } catch (err) {
            console.error('Error getting mentor image from B2:', err);
            return res.json(null);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/:username', async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ username: req.params.username });
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        res.status(200).json(mentor);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and Password are required' });
        }

        const existing = await Mentor.findOne({ email });

        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const mentor = new Mentor({ email, password: hashedPassword });
        await mentor.save();

        const response = await fetch('/api/application/mentorship/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) {
            return res.status(500).json({ success: false, message: 'Failed to delete application' });
        }

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

router.put('/me/:username', authenticateMentorJWT, upload.single('image'), async (req, res) => {
    try {
        const { name, username, phone, tagline, bio } = req.body;
        let competitiveExamsAttempted = [];
        if (req.body.competitiveExamsAttempted) {
            try {
                competitiveExamsAttempted = JSON.parse(req.body.competitiveExamsAttempted);
            } catch (parseError) {
                console.error('Error parsing competitiveExamsAttempted:', parseError);
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

        const updateData = { name, username, phone, tagline, bio };
        if (college) {
            updateData.college = college;
        }
        if (course) {
            updateData.course = course;
        }
        if (competitiveExamsAttempted.length > 0) {
            updateData.competitiveExamsAttempted = competitiveExamsAttempted;
        }

        let mentor = await Mentor.findOneAndUpdate({ username: req.params.username }, updateData, { new: true });
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        if (req.file) {
            const extname = path.extname(req.file.originalname).toLowerCase();
            const fileName = 'mentors/' + req.params.username + extname;
            await b2.uploadBuffer(req.file.buffer, fileName);
            mentor.image = fileName;
        }
        await mentor.save();
        res.status(200).json({ success: true, message: 'Mentor updated successfully' });
    } catch (error) {
        console.log(error);
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

router.post('/logout', authenticateMentorJWT, async (req, res) => {
    try {
        req.logout(function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
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
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:username', async (req, res) => {
    const admin = verifyAdminFromCookie(req);

    if (admin) {
        try {
            const mentor = await Mentor.findOneAndDelete({ username: req.params.username });
            if (!mentor) {
                return res.status(404).json({ success: false, message: 'Mentor not found' });
            }
            return res.json({ success: true, message: 'Mentor deleted successfully', mentorId: mentor._id });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    authenticateMentorJWT(req, res, async () => {
        try {
            if (!req.mentor || req.mentor.username !== req.params.username) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this mentor' });
            }
            await Mentor.findOneAndDelete({ username: req.params.username });
            res.status(200).json({ success: true, message: 'Mentor deleted successfully' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });
})

module.exports = router;