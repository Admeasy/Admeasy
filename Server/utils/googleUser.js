const User = require("../models/userSchema");
const Referral = require("../models/referralSchema");
const generateUniqueReferralCode = require("./generateReferralCode");

/**
 * Find or create a user from Google profile data (OAuth web flow or native ID token).
 *
 * @param {{ googleId: string, email: string, name?: string, picture?: string, referralCode?: string }} params
 */
async function findOrCreateGoogleUser({
  googleId,
  email,
  name = "",
  picture,
  referralCode,
}) {
  if (!email) {
    throw new Error("Email not provided by Google");
  }

  // CASE 1: Existing user by googleId — just return them
  let user = await User.findOne({ googleId });
  if (user) {
    // Backfill referral code if missing (for old users)
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }
    return user;
  }

  // CASE 2: Existing user by email (linking Google to existing account)
  user = await User.findOne({ email });
  if (user) {
    user.googleId = googleId;
    if (!user.image && picture) {
      user.image = picture;
    }
    user.isVerified = true;
    // Backfill referral code if missing
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
    }
    await user.save();
    return user;
  }

  // CASE 3: Brand new user via Google

  // Validate referral code if provided
  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({
      referralCode: referralCode.toUpperCase().trim(),
    });
    if (!referrer) {
      // Silently ignore invalid code — don't block Google signup
      console.warn(
        `Google signup: invalid referral code "${referralCode}" — ignoring`,
      );
    }
  }

  // Generate unique referral code for new user
  const newUserReferralCode = await generateUniqueReferralCode();

  user = new User({
    googleId,
    email,
    name: name || "",
    image: picture || undefined,
    isVerified: true,
    referralCode: newUserReferralCode,
    referredBy: referrer ? referrer._id : null,
  });

  await user.save();

  // Self-referral guard
  if (referrer && referrer._id.toString() === user._id.toString()) {
    user.referredBy = null;
    await user.save();
    return user;
  }

  // Create pending referral record
  if (referrer) {
    await Referral.create({
      referrer: referrer._id,
      referred: user._id,
      status: "pending",
    });
  }

  return user;
}

module.exports = { findOrCreateGoogleUser };
