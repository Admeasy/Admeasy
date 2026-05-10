const jwt = require('jsonwebtoken');
const Mentor = require('../models/mentorSchema');
require('dotenv').config();

// Middleware: authenticate Mentor JWT (pure JWT, no sessions)
async function authenticateMentorJWT(req, res, next) {
    const token = req.cookies['accessToken'] || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token' });
    }

    try {

        // Decode token
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
        
        // Track activity (Asynchronous to not block the request)
        Mentor.updateOne(
            { _id: mentor._id },
            { 
                $set: { 
                    lastActive: new Date(), 
                    lastNotifiedMilestone: 0 // Reset milestone as they are active
                } 
            }
        ).catch(err => console.error('Error tracking activity in mentorAuth:', err));

        next();

    } catch (err) {
        console.error("JWT Auth Error:", err);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateMentorJWT;
