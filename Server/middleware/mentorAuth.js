const jwt = require('jsonwebtoken');
const Mentor = require('../models/mentorSchema');
require('dotenv').config();

// Middleware: authenticate Mentor JWT and set session
async function authenticateMentorJWT(req, res, next) {
    const token = req.cookies['accessToken'];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Check if this token is for a mentor (not a user)
        if (decoded.role && decoded.role === 'user') {
            return res.status(403).json({ success: false, message: 'User token not valid for mentor routes' });
        }
        
        // Fetch full mentor object from database
        const mentor = await Mentor.findById(decoded.id || decoded._id);
        if (!mentor) {
            return res.status(401).json({ success: false, message: 'Mentor not found' });
        }
        
        req.mentor = mentor;
        
        // CRITICAL: Set session for Socket.io compatibility
        if (req.session) {
            req.session.mentorId = mentor._id;
            req.session.userRole = 'mentor';
            // Clear user session if exists
            delete req.session.userId;
            // Force session save
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving mentor session:', err);
                }
            });
        }
        
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateMentorJWT;