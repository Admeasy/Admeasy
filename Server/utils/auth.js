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
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
    });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies
};
