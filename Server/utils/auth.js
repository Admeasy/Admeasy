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
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
        path: '/'
    });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies
};
