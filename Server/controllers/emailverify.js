const User = require('../models/userSchema');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/auth');

/**
 * Send email verification link to user
 */
const sendEmailVerification = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found with this email." });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Email is already verified." });
        }

        // Create verification token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        user.emailVerifyToken = tokenHash;
        user.emailVerifyExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save({ validateBeforeSave: false });

        // VERIFY URL
        let verifyURL =
            process.env.NODE_ENV === "production"
                ? `https://admeasy.in/verify-email/${token}`
                : `http://localhost:5173/verify-email/${token}`;

        // SEND EMAIL with retry logic
        const transporter = nodemailer.createTransport({
            host: "smtp.zoho.in",
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS,
            },
            // Connection timeout
            connectionTimeout: 10000,
            // Socket timeout
            socketTimeout: 10000,
        });

        // Retry logic for email sending
        const maxRetries = 3;
        let lastError = null;
        let emailSent = false;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await transporter.sendMail({
                    from: `"Admeasy" <${process.env.SMTP_EMAIL}>`,
                    to: user.email,
                    subject: "Verify Your Admeasy Account",
                    text: `Please verify your email address by clicking the following link: ${verifyURL}`,
                    html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #f4f7f6;">
                        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #2c3e50; font-size: 28px; font-weight: 700; margin: 0;">Welcome to Admeasy!</h1>
                            </div>
                            <p style="font-size: 16px; color: #505e6b; line-height: 1.6; margin-bottom: 25px;">
                                Thanks for signing up! We're excited to have you join our community. Before you get started, we just need to confirm that this is your email address.
                            </p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${verifyURL}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #4e6bff 0%, #3a52d4 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 15px rgba(78, 107, 255, 0.3); transition: transform 0.2s;">
                                    Verify Email Address
                                </a>
                            </div>
                            <p style="font-size: 14px; color: #7f8c8d; line-height: 1.6;">
                                This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
                            </p>
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;" />
                            <p style="font-size: 12px; color: #bdc3c7; text-align: center; margin: 0;">
                                &copy; ${new Date().getFullYear()} Admeasy. All rights reserved.<br>
                                Helping Students Make Better Decisions.
                            </p>
                        </div>
                    </div>
                    `
                });
                emailSent = true;
                break; // Success, exit retry loop
            } catch (emailErr) {
                lastError = emailErr;
                console.error(`Email send attempt ${attempt}/${maxRetries} failed:`, emailErr.message);
                
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                }
            }
        }

        if (!emailSent) {
            // All retries failed - clean up token but don't fail the request
            // User can request a new verification email
            user.emailVerifyToken = undefined;
            user.emailVerifyExpiry = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("Email send failed after all retries:", lastError);
            return res.status(500).json({ 
                success: false, 
                message: "Failed to send verification email. Please try requesting a new verification email." 
            });
        }

        res.json({ success: true, message: "Verification email sent successfully!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Send verification email error" });
    }
};

/**
 * Verify user email with token and automatically log them in
 */
const verifyEmail = async (req, res) => {
    const { token } = req.params;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    try {
        const user = await User.findOne({
            emailVerifyToken: tokenHash
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
        }

        // If user is already verified, just return success
        if (user.isVerified) {
            return res.json({ success: true, message: "Email is already verified! You can proceed to your dashboard." });
        }

        // If token has expired
        if (user.emailVerifyExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Verification link has expired. Please request a new one." });
        }

        user.isVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyExpiry = undefined;

        // Generate tokens for auto-login
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();

        // Handle session for socket.io compatibility (similar to login)
        if (req.session) {
            req.session.userId = user._id;
            req.session.userRole = 'user';
            if (req.session.mentorId) delete req.session.mentorId;

            await new Promise((resolve) => {
                req.session.save((err) => {
                    if (err) console.error('Error saving session during verification:', err);
                    resolve();
                });
            });
        }

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        // Check onboarding status
        const { checkOnboardingStatus } = require('../utils/onboardingValidation');
        const onboardingStatus = checkOnboardingStatus(user);

        res.json({
            success: true,
            message: "Email verified successfully! You are now logged in.",
            user: {
                _id: user._id,
                email: user.email,
                username: user.username,
                name: user.name,
                isVerified: user.isVerified,
                hasCompletedOnboarding: user.hasCompletedOnboarding || false
            },
            requiresOnboarding: onboardingStatus.requiresOnboarding,
            onboardingStatus: {
                isComplete: onboardingStatus.isComplete,
                hasCompletedOnboarding: user.hasCompletedOnboarding || false,
                missingFields: onboardingStatus.missingFields
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Email verification error" });
    }
};

module.exports = {
    sendEmailVerification,
    verifyEmail,
};
