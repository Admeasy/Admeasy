/**
 * Google ID token login (native Capacitor + optional REST clients).
 * Verifies JWT with google-auth-library, mirrors email-login session cookies.
 */
const { OAuth2Client } = require("google-auth-library");
const { findOrCreateGoogleUser } = require("../utils/googleUser");
const { checkOnboardingStatus } = require("../utils/onboardingValidation");
const {
  generateAccessToken,
  generateRefreshToken,
  generateSwitchToken,
  setTokenCookies,
} = require("../utils/auth.js");

/**
 * POST body: { idToken: string } or { id_token: string }
 * @type {import('express').RequestHandler}
 */
async function postGoogleIdTokenLogin(req, res) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: "Google Sign-In is not configured (GOOGLE_CLIENT_ID).",
      });
    }

    const raw = req.body || {};
    const idToken = raw.idToken || raw.id_token;
    const referralCode = raw.referralCode || null;
    if (!idToken || typeof idToken !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "idToken is required" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Google token" });
    }

    const email = payload.email;
    const googleId = payload.sub;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Google did not return an email" });
    }
    if (payload.email_verified === false) {
      return res.status(400).json({
        success: false,
        message: "Please use a Google account with a verified email.",
      });
    }

    let user = await findOrCreateGoogleUser({
      googleId,
      email,
      name: payload.name || "",
      picture: payload.picture || undefined,
      referralCode: referralCode || undefined,
    });

    if (!user.isVerified) {
      user.isVerified = true;
      user.emailVerifyToken = undefined;
      user.emailVerifyExpiry = undefined;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const switchToken = generateSwitchToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    const onboardingStatus = checkOnboardingStatus(user);

    return res.json({
      success: true,
      message: "Logged in successfully",
      switchToken,
      requiresOnboarding: onboardingStatus.requiresOnboarding,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      onboardingStatus: {
        isComplete: onboardingStatus.isComplete,
        missingFields: onboardingStatus.missingFields || [],
      },
    });
  } catch (err) {
    console.error("Google ID token auth error:", err);
    return res.status(401).json({
      success: false,
      message: "Google sign-in failed. Please try again.",
    });
  }
}

module.exports = { postGoogleIdTokenLogin };
