const jwt = require('jsonwebtoken');
require('dotenv').config();
const Advertiser = require('../models/advertiserSchema');

// Middleware: authenticate JWT for advertisers
async function authenticateAdvertiserJWT(req, res, next) {
    const token = req.cookies['advertiserAccessToken'];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Check if this token is for an advertiser
        if (decoded.role && decoded.role !== 'advertiser') {
            return res.status(403).json({ success: false, message: 'Invalid token for advertiser routes' });
        }
        
        // Fetch full advertiser object from database
        const advertiser = await Advertiser.findById(decoded.id || decoded._id);
        if (!advertiser) {
            return res.status(401).json({ success: false, message: 'Advertiser not found' });
        }
        
        req.advertiser = advertiser;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

module.exports = { authenticateAdvertiserJWT };
