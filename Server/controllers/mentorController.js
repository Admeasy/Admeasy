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
    mentor.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
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
            <p>This link is valid for <strong>10 minutes</strong>.</p>
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
  const { token } = req.params;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const mentor = await Mentor.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!mentor) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    mentor.password = await bcrypt.hash(password, 10);
    mentor.resetPasswordToken = undefined;
    mentor.resetPasswordExpire = undefined;

    await mentor.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Reset password error. Try again later." });
  }
};

module.exports = {
  mentorForgotPassword,
  mentorResetPassword,
};