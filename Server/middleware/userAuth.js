const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');
require('dotenv').config();

// Middleware: authenticate JWT (pure JWT, no sessions)
async function authenticateJWT(req, res, next) {
    const token = req.cookies['accessToken'] || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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

        // MANDATORY: Check email verification status
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email address to access this resource.',
                isNotVerified: true
            });
        }

        // MANDATORY: Check onboarding completion
        const { checkOnboardingStatus } = require('../utils/onboardingValidation');
        const onboardingStatus = checkOnboardingStatus(user);

        if (onboardingStatus.requiresOnboarding) {
            return res.status(403).json({
                success: false,
                message: 'Please complete your onboarding to access this resource.',
                code: 'ONBOARDING_REQUIRED',
                isOnboardingIncomplete: true,
                missingFields: onboardingStatus.missingFields,
                errors: onboardingStatus.errors
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

module.exports = authenticateJWT;