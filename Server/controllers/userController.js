const User = require("../models/userSchema")
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const {emailQueue} = require('../queue/email.queue.js')
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require("../utils/auth.js");

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

    await emailQueue.add("sendResetEmail", {
      email: user.email,
      resetURL
    });

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

const switchAccount = async (req, res) => {
  const { switchToken } = req.body;

  if (!switchToken) return res.status(400).json({ message: "Switch token is required" });

  try {
    const decoded = jwt.verify(switchToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate new session cookies
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // CRITICAL FIX: Save the new refresh token to the database so frontend fetches work!
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    res.json({ user: userObj, message: "Account switched successfully" });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired switch token" });
  }
};

module.exports = { forgotPassword, resetPassword, switchAccount }