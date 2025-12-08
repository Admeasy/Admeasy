const User = require('../models/userSchema')
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found with this email." });

    // Create reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // RESET URL
    let resetURL =
      process.env.NODE_ENV === "production"
        ? `https://admeasy.in/reset-password/${token}`
        : `http://localhost:5173/reset-password/${token}`;

    // SEND EMAIL
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
        to: user.email,
        subject: "Admeasy Password Reset",
        text: `Reset your password: ${resetURL}`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;"> <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"> <h2 style="color: #333; text-align: center; margin-bottom: 10px;"> 🔐 Reset Your Admeasy Password </h2> <p style="font-size: 15px; color: #555; line-height: 1.6;"> We received a request to reset the password for your Admeasy account. If you did not request this, you can safely ignore this email. </p> <p style="font-size: 15px; color: #555; line-height: 1.6;"> Click the button below to create a new password. This link is valid for <strong>10 minutes</strong>. </p> <a href="${resetURL}" style="display: inline-block; margin: 20px auto; padding: 12px 20px; background: #4e6bff; color: #fff; text-decoration: none; font-weight: bold; border-radius: 8px; text-align: center;"> Reset Password </a> <p style="font-size: 13px; color: #777; margin-top: 20px;"> If the button doesn't work, use this link: </p> <p style="word-break: break-all; font-size: 13px;"> <a href="${resetURL}" style="color: #4e6bff;">Click here</a> </p> <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;" /> <p style="font-size: 12px; color: #999; text-align: center;"> © ${new Date().getFullYear()} Admeasy — Helping Students Make Better Decisions. </p> </div> </div>`
      });
    } catch (emailErr) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    res.json({ message: "Password reset link sent to your email!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Forgot password error" });
  }
};

const resetPassword = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token." });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Reset password error please try later" });
  }
};

module.exports = {forgotPassword,resetPassword}