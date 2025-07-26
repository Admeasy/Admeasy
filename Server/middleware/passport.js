const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const { Users } = require('../db');
const User = require('../models/userSchema');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find user by Google email
        let user = await User.findOne({ email: profile.emails[0].value });
        let isNewUser = false;
        if (!user) {
          // Create new user if not exists
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
            password: Math.random().toString(36).slice(-8), // random password, not used
          });
          isNewUser = true;
        }
        // Attach isNewUser to user object for callback
        user._isNewUser = isNewUser;
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport; 