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

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies
};
