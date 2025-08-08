const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
          const userData = {
            name: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
            password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // random password, not used
          };
          
          // Extract gender from Google profile if available
          if (profile._json && profile._json.gender) {
            const googleGender = profile._json.gender;
            // Map Google's gender values to our options
            if (googleGender === 'male') {
              userData.gender = 'Male';
            } else if (googleGender === 'female') {
              userData.gender = 'Female';
            } else {
              userData.gender = 'Rather not to say';
            }
          }
          
          user = await User.create(userData);
          isNewUser = true;
        } else {
          // Update existing user's profile photo and gender if available from Google
          let needsUpdate = false;
          
          // Always update the profile photo with fresh Google URL
          if (profile.photos && profile.photos[0] && profile.photos[0].value) {
            user.image = profile.photos[0].value;
            needsUpdate = true;
          }
          
          // Update gender if not set and available from Google
          if (!user.gender && profile._json && profile._json.gender) {
            const googleGender = profile._json.gender;
            if (googleGender === 'male') {
              user.gender = 'Male';
            } else if (googleGender === 'female') {
              user.gender = 'Female';
            } else {
              user.gender = 'Rather not to say';
            }
            needsUpdate = true;
          }
          
          // Save user if any updates were made
          if (needsUpdate) {
            await user.save();
          }
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