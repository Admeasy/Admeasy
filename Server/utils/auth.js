const jwt = require('jsonwebtoken');

function generateAccessToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role || 'user'
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '7d' }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role || 'user'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '28d' }
    );
}

// NEW: Generates a long-lived token specifically for switching accounts without a password
function generateSwitchToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role || 'user'
        },
        process.env.JWT_REFRESH_SECRET, // Reusing refresh secret
        { expiresIn: '365d' } // Valid for 1 year like Instagram
    );
}

const setTokenCookies = (res, accessToken, refreshToken) => {
    // Determine if we are in production
    const isProduction = process.env.NODE_ENV === 'production';

    console.log('Setting token cookies:', {
        isProduction,
        env: process.env.NODE_ENV
    });

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction, // Secure true in production
        sameSite: isProduction ? 'none' : 'lax', // None in production for cross-site
        domain: isProduction ? '.admeasy.in' : undefined, // Production domain
        path: '/'
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 28 * 24 * 60 * 60 * 1000 // 28 days
    });
};

const clearTokenCookies = (res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? '.admeasy.in' : undefined,
        path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateSwitchToken,
    setTokenCookies,
    clearTokenCookies
};
