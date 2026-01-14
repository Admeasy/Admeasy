const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

// Middleware: authenticate JWT and set session
async function authenticateJWT(req, res, next) {
    const token = req.cookies['accessToken'];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Check if this token is for a user (not a mentor)
        if (decoded.role && decoded.role === 'mentor') {
            return res.status(403).json({ success: false, message: 'Mentor token not valid for user routes' });
        }
        
        // Fetch full user object from database
        const user = await User.findById(decoded.id || decoded._id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        req.user = user;
        
        // CRITICAL: Set session for Socket.io compatibility
        if (req.session) {
            req.session.userId = user._id;
            req.session.userRole = 'user';
            // Clear mentor session if exists
            delete req.session.mentorId;
            // Force session save - await to ensure it's saved before proceeding
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
        
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateJWT;