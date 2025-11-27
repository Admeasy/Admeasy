const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: authenticate Mentor JWT
function authenticateMentorJWT(req, res, next) {
    const token = req.cookies['accessToken'];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.mentor = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateMentorJWT;

