const express = require('express');
const router = express.Router();
const Ad = require('../models/adSchema');
const AdRequest = require('../models/adRequestSchema');
const Advertiser = require('../models/advertiserSchema');
const { verifyAdminToken } = require('../middleware/adminAuth.js');
const { authenticateAdvertiserJWT } = require('../middleware/advertiserAuth.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper to get optional user/mentor from token
async function getOptionalUser(req) {
    const token = req.cookies?.accessToken;
    if (!token) return null;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.role === 'mentor') {
            const Mentor = require('../models/mentorSchema');
            return await Mentor.findById(decoded.id || decoded._id).lean();
        } else {
            const User = require('../models/userSchema');
            return await User.findById(decoded.id || decoded._id).lean();
        }
    } catch (err) {
        return null;
    }
}

// TRACK AD VIEW
router.post('/:adId/view', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.adId);
        if (!ad || ad.status !== 'live') {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        const viewer = await getOptionalUser(req);

        // Always record a view event for accurate per-day analytics
        ad.views.push({
            userId: viewer && viewer.role === 'user' ? viewer._id : null,
            mentorId: viewer && viewer.role === 'mentor' ? viewer._id : null,
            viewedAt: new Date()
        });

        // Increment total views count (counts every impression, not just unique viewers)
        ad.viewsCount += 1;
        await ad.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Track view error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// TRACK AD CLICK
router.post('/:adId/click', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.adId);
        if (!ad || ad.status !== 'live') {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        const clicker = await getOptionalUser(req);
        
        ad.clicks.push({
            userId: clicker && clicker.role === 'user' ? clicker._id : null,
            mentorId: clicker && clicker.role === 'mentor' ? clicker._id : null,
            clickedAt: new Date()
        });
        ad.clicksCount += 1;
        await ad.save();

        res.json({ success: true, url: ad.externalLink.url });
    } catch (error) {
        console.error('Track click error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// LIKE AD
router.post('/:adId/like', async (req, res) => {
    try {
        const liker = await getOptionalUser(req);
        if (!liker) {
            return res.status(401).json({ success: false, message: 'Please log in to like ads' });
        }

        const ad = await Ad.findById(req.params.adId);
        if (!ad || ad.status !== 'live') {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        const likerId = liker._id.toString();
        const existingLikeIndex = ad.likes.findIndex(l => {
            const lId = (l.userId || l.mentorId)?.toString();
            return lId === likerId;
        });

        let isLiked;
        if (existingLikeIndex >= 0) {
            // Unlike
            ad.likes.splice(existingLikeIndex, 1);
            ad.likesCount = Math.max(0, ad.likesCount - 1);
            isLiked = false;
        } else {
            // Like
            ad.likes.push({
                userId: liker.role === 'user' ? liker._id : null,
                mentorId: liker.role === 'mentor' ? liker._id : null,
                createdAt: new Date()
            });
            ad.likesCount += 1;
            isLiked = true;
        }

        await ad.save();

        res.json({
            success: true,
            isLiked,
            likesCount: ad.likesCount
        });
    } catch (error) {
        console.error('Like ad error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET AD BY ID
router.get('/:adId', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.adId)
            .populate('advertiserId', 'name username image')
            .lean();

        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        const viewer = await getOptionalUser(req);
        let isLiked = false;
        if (viewer) {
            const viewerId = viewer._id.toString();
            isLiked = ad.likes.some(l => {
                const lId = (l.userId || l.mentorId)?.toString();
                return lId === viewerId;
            });
        }

        res.json({
            success: true,
            ad: {
                ...ad,
                isLiked
            }
        });
    } catch (error) {
        console.error('Get ad error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE AD (ADVERTISER)
router.delete('/:adId', authenticateAdvertiserJWT, async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.adId);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        if (ad.advertiserId.toString() !== req.advertiser._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Ad.findByIdAndDelete(req.params.adId);
        res.json({ success: true, message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Delete ad error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: GET ALL ADS
router.get('/admin/all', verifyAdminToken, async (req, res) => {
    try {
        const ads = await Ad.find()
            .populate('advertiserId', 'name username email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            ads
        });
    } catch (error) {
        console.error('Get all ads error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: GET LIVE ADS
router.get('/admin/live', verifyAdminToken, async (req, res) => {
    try {
        const ads = await Ad.find({ status: 'live' })
            .populate('advertiserId', 'name username email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            ads
        });
    } catch (error) {
        console.error('Get live ads error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: DELETE AD
router.delete('/admin/:adId', verifyAdminToken, async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.adId);
        res.json({ success: true, message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Delete ad error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: GET AD REQUESTS
router.get('/admin/requests', verifyAdminToken, async (req, res) => {
    try {
        const adRequests = await AdRequest.find({ status: 'pending' })
            .populate('advertiserId', 'name username email')
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

// ADMIN: APPROVE AD REQUEST
router.post('/admin/requests/:requestId/approve', verifyAdminToken, async (req, res) => {
    try {
        const adRequest = await AdRequest.findById(req.params.requestId);
        if (!adRequest) {
            return res.status(404).json({ success: false, message: 'Ad request not found' });
        }

        if (adRequest.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Ad request already processed' });
        }

        // Create ad from request
        const ad = new Ad({
            advertiserId: adRequest.advertiserId,
            content: adRequest.content,
            image: adRequest.image,
            externalLink: {
                url: adRequest.externalLink.url,
                linkText: adRequest.externalLink.linkText || null,
                preview: adRequest.externalLink.preview || {}
            },
            status: 'live',
            approvedAt: new Date()
        });

        await ad.save();

        // Update request status
        adRequest.status = 'approved';
        adRequest.reviewedAt = new Date();
        adRequest.reviewedBy = 'admin'; // You can get admin info from req if needed
        await adRequest.save();

        res.json({
            success: true,
            message: 'Ad approved and published successfully',
            ad
        });
    } catch (error) {
        console.error('Approve ad request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN: REJECT AD REQUEST
router.post('/admin/requests/:requestId/reject', verifyAdminToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const adRequest = await AdRequest.findById(req.params.requestId);
        
        if (!adRequest) {
            return res.status(404).json({ success: false, message: 'Ad request not found' });
        }

        if (adRequest.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Ad request already processed' });
        }

        adRequest.status = 'rejected';
        adRequest.reviewedAt = new Date();
        adRequest.reviewedBy = 'admin';
        adRequest.rejectionReason = reason || 'Ad does not meet our guidelines';

        await adRequest.save();

        res.json({
            success: true,
            message: 'Ad request rejected',
            adRequest
        });
    } catch (error) {
        console.error('Reject ad request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET RANDOM ADS FOR FEED
router.get('/feed/random', async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const ads = await Ad.find({ status: 'live' })
            .populate('advertiserId', 'name username image')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit, 10))
            .lean();

        // Determine current viewer (user or mentor) from auth, if any
        const viewer = await getOptionalUser(req);
        
        // Always set isLiked for all ads (false if not logged in or not liked)
        const adsWithLikeState = ads.map(ad => {
            let isLiked = false;
            if (viewer) {
                const viewerId = viewer._id.toString();
                isLiked = (ad.likes || []).some(l => {
                    const lId = (l.userId || l.mentorId)?.toString();
                    return lId === viewerId;
                });
            }

            return {
                ...ad,
                isLiked: isLiked === true // Ensure it's always a boolean
            };
        });

        // Shuffle ads randomly
        const shuffled = adsWithLikeState.sort(() => Math.random() - 0.5);

        res.json({
            success: true,
            ads: shuffled
        });
    } catch (error) {
        console.error('Get random ads error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
