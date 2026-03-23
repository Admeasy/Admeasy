const User = require('../models/userSchema');

/**
 * Find or create a user from Google profile data (OAuth web flow or native ID token).
 * Mirrors the logic previously inline in passport-google-oauth20 strategy.
 *
 * @param {{ googleId: string, email: string, name?: string, picture?: string }} params
 */
async function findOrCreateGoogleUser({ googleId, email, name = '', picture }) {
    if (!email) {
        throw new Error('Email not provided by Google');
    }

    let user = await User.findOne({ googleId });
    if (user) {
        return user;
    }

    user = await User.findOne({ email });

    if (user) {
        user.googleId = googleId;
        if (!user.image && picture) {
            user.image = picture;
        }
        user.isVerified = true;
        await user.save();
        return user;
    }

    user = new User({
        googleId,
        email,
        name: name || '',
        image: picture || undefined,
        isVerified: true,
    });

    await user.save();
    return user;
}

module.exports = { findOrCreateGoogleUser };
