const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary.js');
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/auth.js');
const Advertiser = require('../models/advertiserSchema');
const Ad = require('../models/adSchema');
const AdRequest = require('../models/adRequestSchema');
const { authenticateAdvertiserJWT } = require('../middleware/advertiserAuth.js');
const { verifyAdminToken } = require('../middleware/adminAuth.js');
const { generateLinkPreview } = require('../utils/linkPreview.js');
require('dotenv').config();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to generate tokens for advertisers
function generateAdvertiserTokens(advertiser) {
    const accessToken = jwt.sign(
        {
            id: advertiser._id,
            email: advertiser.email,
            role: 'advertiser'
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '12h' }
    );
    
    const refreshToken = jwt.sign(
        {
            id: advertiser._id,
            email: advertiser.email,
            role: 'advertiser'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '28d' }
    );
    
    return { accessToken, refreshToken };
}

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, username } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }

        // Check existing advertiser by email
        const existingEmail = await Advertiser.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Check username if provided
        if (username) {
            const normalizedUsername = username.trim().toLowerCase();
            const existingUsername = await Advertiser.findOne({
                username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
            if (existingUsername) {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create advertiser
        const advertiser = new Advertiser({
            name,
            email,
            password: hashedPassword,
            username: username ? username.trim().toLowerCase() : null
        });

        await advertiser.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateAdvertiserTokens(advertiser);
        advertiser.refreshToken = refreshToken;
        await advertiser.save();

        // Set cookies
        res.cookie('advertiserAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });
        
        res.cookie('advertiserRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 28 * 24 * 60 * 60 * 1000 // 28 days
        });

        res.status(201).json({
            success: true,
            message: 'Advertiser account created successfully',
            advertiser: {
                _id: advertiser._id,
                name: advertiser.name,
                email: advertiser.email,
                username: advertiser.username
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email or username already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const advertiser = await Advertiser.findOne({ email }).select('+password');
        if (!advertiser) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const authorized = await bcrypt.compare(password, advertiser.password);
        if (!authorized) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateAdvertiserTokens(advertiser);
        advertiser.refreshToken = refreshToken;
        await advertiser.save();

        // Set cookies
        res.cookie('advertiserAccessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000
        });
        
        res.cookie('advertiserRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 28 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful',
            advertiser: {
                _id: advertiser._id,
                name: advertiser.name,
                email: advertiser.email,
                username: advertiser.username,
                image: advertiser.image,
                bio: advertiser.bio,
                website: advertiser.website
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// LOGOUT
router.post('/logout', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const advertiser = await Advertiser.findById(req.advertiser._id);
        if (advertiser) {
            advertiser.refreshToken = null;
            await advertiser.save();
        }

        res.clearCookie('advertiserAccessToken');
        res.clearCookie('advertiserRefreshToken');
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET CURRENT ADVERTISER
router.get('/me', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const advertiser = await Advertiser.findById(req.advertiser._id);
        res.json({
            success: true,
            advertiser: {
                _id: advertiser._id,
                name: advertiser.name,
                email: advertiser.email,
                username: advertiser.username,
                image: advertiser.image,
                bio: advertiser.bio,
                website: advertiser.website,
                createdAt: advertiser.createdAt
            }
        });
    } catch (error) {
        console.error('Get advertiser error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// UPDATE PROFILE
router.put('/profile', authenticateAdvertiserJWT, upload.single('image'), async (req, res) => {
    try {
        const advertiser = await Advertiser.findById(req.advertiser._id);
        const { name, username, bio, website } = req.body;

        if (name) advertiser.name = name;
        if (bio !== undefined) advertiser.bio = bio;
        if (website !== undefined) advertiser.website = website;

        // Handle username change
        if (username && username !== advertiser.username) {
            const normalizedUsername = username.trim().toLowerCase();
            const existingUsername = await Advertiser.findOne({
                username: { $regex: new RegExp(`^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                _id: { $ne: advertiser._id }
            });
            if (existingUsername) {
                return res.status(409).json({ success: false, message: 'Username already taken' });
            }
            advertiser.username = normalizedUsername;
        }

        // Handle image upload
        if (req.file) {
            try {
                // Delete old image if exists
                if (advertiser.image && advertiser.image.includes('cloudinary.com')) {
                    await deleteFromCloudinary(advertiser.image);
                }
                // Upload new image
                const imageUrl = await uploadToCloudinary(req.file.buffer, 'advertisers');
                console.log('Image uploaded:', imageUrl);
                advertiser.image = imageUrl;
                console.log('Advertiser image set to:', advertiser.image);
            } catch (error) {
                console.error('Image upload error:', error);
                return res.status(500).json({ success: false, message: 'Failed to upload image' });
            }
        }

        await advertiser.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            advertiser: {
                _id: advertiser._id,
                name: advertiser.name,
                email: advertiser.email,
                username: advertiser.username,
                image: advertiser.image,
                bio: advertiser.bio,
                website: advertiser.website
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// CREATE AD REQUEST
router.post('/ads', authenticateAdvertiserJWT, upload.single('image'), async (req, res) => {
    try {
        const { content, externalLink, linkText } = req.body;

        if (!content || !externalLink) {
            return res.status(400).json({ success: false, message: 'Content and external link are required' });
        }

        let imageUrl = null;
        if (req.file) {
            try {
                imageUrl = await uploadToCloudinary(req.file.buffer, 'ads');
                console.log('Ad image uploaded:', imageUrl);
            } catch (error) {
                console.error('Image upload error:', error);
                return res.status(500).json({ success: false, message: 'Failed to upload image' });
            }
        }

        // Get link preview
        let linkPreviewData = {};
        try {
            linkPreviewData = await generateLinkPreview(externalLink) || {};
        } catch (error) {
            console.error('Link preview error:', error);
            linkPreviewData = {};
        }

        // Create ad request
        const adRequest = new AdRequest({
            advertiserId: req.advertiser._id,
            content,
            image: imageUrl,
            externalLink: {
                url: externalLink,
                linkText: linkText || null,
                preview: linkPreviewData
            }
        });

        await adRequest.save();

        res.status(201).json({
            success: true,
            message: 'Ad request submitted successfully. It will go live once approved by the Admeasy team.',
            adRequest: {
                _id: adRequest._id,
                content: adRequest.content,
                image: adRequest.image,
                externalLink: adRequest.externalLink,
                status: adRequest.status,
                createdAt: adRequest.createdAt
            }
        });
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// GET SINGLE AD BY ID (ADVERTISER)
router.get('/ads/:adId', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.adId)
            .populate('advertiserId', 'name username image')
            .lean();

        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        // Verify ownership
        if (ad.advertiserId._id.toString() !== req.advertiser._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.json({
            success: true,
            ad
        });
    } catch (error) {
        console.error('Get ad error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// UPDATE AD (ADVERTISER)
router.put('/ads/:adId', authenticateAdvertiserJWT, upload.single('image'), async (req, res) => {
    try {
        const { content, externalLink, linkText } = req.body;

        const ad = await Ad.findById(req.params.adId);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        // Verify ownership
        if (ad.advertiserId.toString() !== req.advertiser._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Only allow editing if ad is live (not pending approval)
        if (ad.status !== 'live') {
            return res.status(400).json({ success: false, message: 'Can only edit live ads' });
        }

        if (content) ad.content = content;
        if (externalLink) {
            // Get link preview
            let linkPreviewData = {};
            try {
                linkPreviewData = await generateLinkPreview(externalLink) || {};
            } catch (error) {
                console.error('Link preview error:', error);
                linkPreviewData = {};
            }

            // Ensure preview is always an object, preserve existing if new one is empty
            const existingPreview = ad.externalLink?.preview || {};
            ad.externalLink = {
                url: externalLink,
                linkText: linkText !== undefined ? (linkText || null) : (ad.externalLink?.linkText || null),
                preview: Object.keys(linkPreviewData).length > 0 ? linkPreviewData : existingPreview
            };
        } else if (linkText !== undefined) {
            // Update linkText only, preserve existing preview
            ad.externalLink = {
                url: ad.externalLink?.url || '',
                linkText: linkText || null,
                preview: ad.externalLink?.preview || {}
            };
        }

        // Handle image update
        if (req.file) {
            try {
                // Delete old image if exists
                if (ad.image) {
                    await deleteFromCloudinary(ad.image);
                }
                // Upload new image
                const imageUrl = await uploadToCloudinary(req.file.buffer, 'ads');
                console.log('Ad image uploaded:', imageUrl);
                ad.image = imageUrl;
            } catch (error) {
                console.error('Image upload error:', error);
                return res.status(500).json({ success: false, message: 'Failed to upload image' });
            }
        }

        ad.isEdited = true;
        ad.editedAt = new Date();
        await ad.save();

        res.json({
            success: true,
            message: 'Ad updated successfully',
            ad
        });
    } catch (error) {
        console.error('Update ad error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// GET ADVERTISER'S ADS
router.get('/ads', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const { sort = 'latest' } = req.query;
        let sortQuery = { createdAt: -1 };

        switch (sort) {
            case 'most-viewed':
                sortQuery = { viewsCount: -1 };
                break;
            case 'most-liked':
                sortQuery = { likesCount: -1 };
                break;
            case 'most-clicked':
                sortQuery = { clicksCount: -1 };
                break;
            case 'best-performing':
                // Best performing = combination of views, clicks, and likes
                sortQuery = { 
                    $expr: { 
                        $add: [
                            { $multiply: ['$viewsCount', 1] },
                            { $multiply: ['$clicksCount', 3] },
                            { $multiply: ['$likesCount', 2] }
                        ]
                    }
                };
                break;
            case 'latest':
            default:
                sortQuery = { createdAt: -1 };
        }

        const ads = await Ad.find({ advertiserId: req.advertiser._id })
            .populate('advertiserId', 'name username image')
            .sort(sortQuery)
            .lean();

        res.json({
            success: true,
            ads
        });
    } catch (error) {
        console.error('Get ads error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET ADVERTISER'S AD REQUESTS
router.get('/ad-requests', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const adRequests = await AdRequest.find({ advertiserId: req.advertiser._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            adRequests
        });
    } catch (error) {
        console.error('Get ad requests error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET DASHBOARD STATS
router.get('/dashboard/stats', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const { period = 'month' } = req.query; // 'month' or 'year'
        const now = new Date();
        let startDate;

        if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const ads = await Ad.find({
            advertiserId: req.advertiser._id,
            status: 'live'
        }).lean();

        // Calculate stats
        let totalViews = 0;
        let totalClicks = 0;
        let totalLikes = 0;

        const viewsByDate = {};
        const clicksByDate = {};
        const likesByDate = {};

        for (const ad of ads) {
            // Count views in period
            const viewsInPeriod = ad.views.filter(v => {
                const viewDate = new Date(v.viewedAt);
                return viewDate >= startDate;
            });
            totalViews += viewsInPeriod.length;

            // Count clicks in period
            const clicksInPeriod = ad.clicks.filter(c => {
                const clickDate = new Date(c.clickedAt);
                return clickDate >= startDate;
            });
            totalClicks += clicksInPeriod.length;

            // Count likes in period
            const likesInPeriod = ad.likes.filter(l => {
                const likeDate = new Date(l.createdAt);
                return likeDate >= startDate;
            });
            totalLikes += likesInPeriod.length;

            // Group by date for charts
            viewsInPeriod.forEach(v => {
                const date = new Date(v.viewedAt).toISOString().split('T')[0];
                viewsByDate[date] = (viewsByDate[date] || 0) + 1;
            });

            clicksInPeriod.forEach(c => {
                const date = new Date(c.clickedAt).toISOString().split('T')[0];
                clicksByDate[date] = (clicksByDate[date] || 0) + 1;
            });

            likesInPeriod.forEach(l => {
                const date = new Date(l.createdAt).toISOString().split('T')[0];
                likesByDate[date] = (likesByDate[date] || 0) + 1;
            });
        }

        res.json({
            success: true,
            stats: {
                totalViews,
                totalClicks,
                totalLikes,
                viewsByDate,
                clicksByDate,
                likesByDate
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET ADVERTISER BY USERNAME
router.get('/:username', async (req, res) => {
    try {
        const advertiser = await Advertiser.findOne({ username: req.params.username });
        if (!advertiser) {
            return res.status(404).json({ success: false, message: 'Advertiser not found' });
        }

        const adsCount = await Ad.countDocuments({ 
            advertiserId: advertiser._id, 
            status: 'live' 
        });

        res.json({
            success: true,
            advertiser: {
                _id: advertiser._id,
                name: advertiser.name,
                username: advertiser.username,
                image: advertiser.image,
                bio: advertiser.bio,
                website: advertiser.website,
                adsCount
            }
        });
    } catch (error) {
        console.error('Get advertiser error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET ADVERTISER'S ADS (PUBLIC)
router.get('/:username/ads', async (req, res) => {
    try {
        const advertiser = await Advertiser.findOne({ username: req.params.username });
        if (!advertiser) {
            return res.status(404).json({ success: false, message: 'Advertiser not found' });
        }

        const ads = await Ad.find({ 
            advertiserId: advertiser._id, 
            status: 'live' 
        })
        .populate('advertiserId', 'name username image')
        .sort({ createdAt: -1 })
        .lean();

        res.json({
            success: true,
            ads
        });
    } catch (error) {
        console.error('Get advertiser ads error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: GET ALL ADVERTISERS
router.get('/admin/all', verifyAdminToken, async (req, res) => {
    try {
        const advertisers = await Advertiser.find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            advertisers
        });
    } catch (error) {
        console.error('Get all advertisers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: DELETE ADVERTISER
router.delete('/admin/:id', verifyAdminToken, async (req, res) => {
    try {
        await Advertiser.findByIdAndDelete(req.params.id);
        // Also delete all ads by this advertiser
        await Ad.deleteMany({ advertiserId: req.params.id });
        await AdRequest.deleteMany({ advertiserId: req.params.id });
        
        res.json({ success: true, message: 'Advertiser deleted successfully' });
    } catch (error) {
        console.error('Delete advertiser error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
