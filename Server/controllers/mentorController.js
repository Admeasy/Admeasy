const Mentor = require("../models/mentorSchema");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

/**
 * @desc Mentor Forgot Password
 * @route POST /api/mentors/forgot-password
 */
const mentorForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const mentor = await Mentor.findOne({ email });
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found with this email." });
    }

    // Create reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    mentor.resetPasswordToken = tokenHash;
    mentor.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await mentor.save({ validateBeforeSave: false });

    // Reset URL
    const resetURL =
      process.env.NODE_ENV === "production"
        ? `https://admeasy.in/mentors/reset-password/${token}`
        : `http://localhost:5173/mentors/reset-password/${token}`;

    // Email config
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Admeasy" <${process.env.SMTP_EMAIL}>`,
        to: mentor.email,
        subject: "Admeasy Mentor Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🔐 Reset Your Mentor Password</h2>
            <p>You requested a password reset for your mentor account.</p>
            <p>This link is valid for <strong>30 minutes</strong>.</p>
            <a href="${resetURL}" style="
              display:inline-block;
              padding:12px 18px;
              background:#6b21a8;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              margin-top:12px;
            ">Reset Password</a>
            <p style="margin-top:20px;font-size:13px;">
              Or copy this link:<br/>
              <a href="${resetURL}">${resetURL}</a>
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      mentor.resetPasswordToken = undefined;
      mentor.resetPasswordExpire = undefined;
      await mentor.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Failed to send reset email." });
    }

    res.json({ message: "Password reset link sent to your email!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Mentor forgot password error" });
  }
};

/**
 * @desc Mentor Reset Password
 * @route POST /api/mentors/reset-password/:token
 */
const mentorResetPassword = async (req, res) => {
  const { password } = req.body;
  let { token } = req.params;

  // Validate password is provided
  if (!password || password.trim() === '') {
    return res.status(400).json({ message: "Password is required." });
  }

  // Validate password meets requirements
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  // Decode URL-encoded token (handles special characters like #, %, etc.)
  // Express automatically decodes URL params, but we'll decode again to be safe
  try {
    // Only decode if it looks URL-encoded (contains %)
    if (token.includes('%')) {
      token = decodeURIComponent(token);
    }
  } catch (decodeErr) {
    // If decoding fails, use original token
    console.error('Token decode error:', decodeErr);
  }

  // Validate token format (should be hex string, 64 characters for 32 bytes)
  // Hex strings only contain 0-9 and a-f
  if (!token || typeof token !== 'string' || token.length !== 64 || !/^[0-9a-f]{64}$/i.test(token)) {
    console.error('Invalid token format:', { tokenLength: token?.length, tokenType: typeof token, tokenPreview: token?.substring(0, 10) });
    return res.status(400).json({ message: "Invalid token format." });
  }

  // Hash the token for comparison
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    // Find mentor with matching token and non-expired token
    const mentor = await Mentor.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!mentor) {
      // Check if token exists but is expired
      const expiredMentor = await Mentor.findOne({
        resetPasswordToken: tokenHash,
      });
      
      if (expiredMentor) {
        return res.status(400).json({ message: "Token has expired. Please request a new password reset link." });
      }
      
      // Debug: Check if any mentors have reset tokens (for debugging)
      const mentorsWithTokens = await Mentor.countDocuments({ 
        resetPasswordToken: { $exists: true, $ne: null } 
      });
      
      console.log('Reset password debug:', {
        tokenLength: token.length,
        tokenHashLength: tokenHash.length,
        mentorsWithTokens: mentorsWithTokens,
        currentTime: Date.now()
      });
      
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    mentor.password = await bcrypt.hash(password, 10);
    mentor.resetPasswordToken = undefined;
    mentor.resetPasswordExpire = undefined;

    await mentor.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error('Mentor reset password error:', error);
    res.status(500).json({ message: "Reset password error. Try again later." });
  }
};

module.exports = {
  mentorForgotPassword,
  mentorResetPassword,
};