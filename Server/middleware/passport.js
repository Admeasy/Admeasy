const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { findOrCreateGoogleUser } = require('../utils/googleUser');
require('dotenv').config();

// Google OAuth Strategy
// Note: The callback URL should be configured in Google Cloud Console
// For development: http://localhost:5000/api/users/auth/google/callback
// For production: https://admeasy.in/api/users/auth/google/callback

// Construct callback URL based on environment
const getCallbackURL = () => {
  // Use BACKEND_URL if provided, otherwise construct from environment
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/api/users/auth/google/callback`;
  }
  // In production, use the full URL from FRONTEND_URL or default to admeasy.in
  if (process.env.NODE_ENV === 'production') {
    // Default production URL
    return 'https://admeasy.in/api/users/auth/google/callback';
  }
  // Development - use localhost
  return 'http://localhost:5000/api/users/auth/google/callback';
};

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set. Google OAuth will not work.');
} else {
  const callbackURL = getCallbackURL();

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        return done(new Error('Email not provided by Google'), null);
      }

      const user = await findOrCreateGoogleUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName || profile.name?.givenName || '',
        picture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// No express-session / serializeUser — Google flow uses session:false; app auth is JWT-only.
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });

module.exports = passport;