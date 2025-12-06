const jwt = require('jsonwebtoken');
const Mentor = require('../models/mentorSchema');
require('dotenv').config();

async function authenticateMentorJWT(req, res, next) {
    try {
        const token = req.cookies['accessToken'];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token' });
        }

        // Decode token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Fetch REAL mentor from DB
        const mentor = await Mentor.findById(decoded.id);

        if (!mentor) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.mentor = mentor; // ⭐ IMPORTANT: assign full mentor object
        next();

    } catch (err) {
        console.error("JWT Auth Error:", err);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateMentorJWT;
