const express = require("express");
const {
  resetPassword,
  forgotPassword,
  switchAccount,
} = require("../controllers/userController.js");
const {
  sendEmailVerification,
  verifyEmail,
} = require("../controllers/emailverify.js");
const {
  generateAccessToken,
  generateRefreshToken,
  generateSwitchToken,
  setTokenCookies,
} = require("../utils/auth.js");
const router = express.Router();
const User = require("../models/userSchema.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const multer = require("multer");
const BackblazeB2Client = require("../b2Client.js");
const b2 = new BackblazeB2Client();
const path = require("path");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/cloudinary.js");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users } = require("../db.js");
const NotificationService = require("../services/notificationService.js");
const { verifyAdminToken } = require("../middleware/adminAuth.js");
const passport = require("../middleware/passport.js");
const {
  authenticateRequired,
  requireSelfOrAdmin,
} = require("../middleware/combinedAuth.js");
const path = require("path");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/cloudinary.js");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users } = require("../db.js");
const NotificationService = require("../services/notificationService.js");
const { verifyAdminToken } = require("../middleware/adminAuth.js");
const passport = require("../middleware/passport.js");
const {
  authenticateRequired,
  authenticateUserOrAdmin,
  requireSelfOrAdmin,
} = require("../middleware/combinedAuth.js");
const {
  postGoogleIdTokenLogin,
} = require("../controllers/googleIdTokenAuthController.js");
// UPDATE CURRENT USER (protected)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: Get frontend URL for redirects (works for both dev and production)
// Helper: Get frontend URL for redirects (works for both dev and production)
function getFrontendUrl() {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  // Default to production URL in production, or localhost in dev
  if (process.env.NODE_ENV === "production") {
    return "https://admeasy.in";
  }
  return "http://localhost:5173";
}

// Helper: Extract public_id from Cloudinary URL
function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") return null;
  try {
    return extractPublicId(url);
  } catch (error) {
    return null;
  }
}

// Helper: check if image is a Google URL, Cloudinary URL, or Backblaze file and handle accordingly
async function processUserImage(user) {
  if (!user.image) return user;

  // Check if it's a Google URL (contains googleusercontent.com)
  if (user.image.includes("googleusercontent.com")) {
    // Use proxy URL to avoid rate limiting
    user.image = `/api/users/proxy-image?url=${encodeURIComponent(user.image)}`;
    return user;
  } else if (user.image.includes("cloudinary.com")) {
    // It's a Cloudinary URL, return as-is (already public)
    return user;
  } else {
    // It's a Backblaze file, get authorized URL (for backward compatibility)
    try {
      const imageName = user.image;
      user.image = await b2.getDownloadAuthorization(imageName);
    } catch (err) {
      console.error("Error getting Backblaze authorization:", err);
      // If there's an error, return the original image field
    }
    return user;
  }
}

router.get("/", verifyAdminToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// SIGN UP
router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, captchaToken } = req.body;

    //verify captch token with googe
    if (!captchaToken) {
      return res.status(400).json({
        sucess: false,
        message: `Please complete the captcha verification!`,
      });
    }

    const captchaVerifyRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" },
    );

    const captchaData = await captchaVerifyRes.json();

    if (!captchaData.success) {
      return res.status(400).json({
        success: false,
        message: `Captcha verification failed. Please try again.`,
      });
    }

    // Validate
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and username are required",
      });
    }

    // Check existing user by email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    // Check availability of username
    const normalizedUsername = username.trim().toLowerCase();
    const existingUsername = await User.findOne({
      username: {
        $regex: new RegExp(
          `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
    });

    if (existingUsername) {
      return res
        .status(409)
        .json({ success: false, message: "Username is already taken" });
    }

    // Also check if username is taken by a mentor
    const Mentor = require("../models/mentorSchema.js");
    const existingMentorUsername = await Mentor.findOne({
      username: {
        $regex: new RegExp(
          `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      },
    });

    if (existingMentorUsername) {
      return res
        .status(409)
        .json({ success: false, message: "Username is already taken" });
    }

    // Hash password & create user (isVerified defaults to false)
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      username: normalizedUsername,
      isVerified: false, // Explicitly set to false
    });

    // Save user first
    await user.save();

    // Send verification email immediately after signup
    try {
      const crypto = require("crypto");
      const nodemailer = require("nodemailer");

      // Create verification token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      user.emailVerifyToken = tokenHash;
      user.emailVerifyExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save({ validateBeforeSave: false });

      // VERIFY URL
      const getFrontendUrl = () => {
        return process.env.NODE_ENV === "production"
          ? "https://admeasy.in"
          : "http://localhost:5173";
      };
      const verifyURL = `${getFrontendUrl()}/verify-email/${token}`;

      // SEND EMAIL with retry logic
      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      const maxRetries = 3;
      let emailSent = false;
      let lastError = null;

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
                        `,
          });
          emailSent = true;
          break;
        } catch (emailErr) {
          lastError = emailErr;
          console.error(
            `Verification email send attempt ${attempt}/${maxRetries} failed:`,
            emailErr.message,
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      if (!emailSent) {
        // Clean up token if email failed
        user.emailVerifyToken = undefined;
        user.emailVerifyExpiry = undefined;
        await user.save({ validateBeforeSave: false });
        console.error(
          "Failed to send verification email during signup after all retries:",
          lastError,
        );
        // Don't fail signup - user can request resend
      }
    } catch (emailErr) {
      console.error(
        "Error sending verification email during signup:",
        emailErr,
      );
      // Continue even if email sending fails - user can request resend later
    }

    // DO NOT auto-login unverified users
    // Return success but user must verify email before accessing protected routes
    return res.status(201).json({
      id: user._id,
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      requiresVerification: true,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Complete onboarding and save user data
router.post("/onboarding", async (req, res) => {
  try {
    // get user from token if exists(user might be logged in from signup)
    let user = null;
    if (req.cookies["accessToken"]) {
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // token invalid,user needs to create account
      }
    }

    // If user doesn't exist from token, find them by email
    if (!user) {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required to complete onboarding",
        });
      }

      user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please create an account first.",
        });
      }

      // Verify password for security since we rely on an unauthenticated request matching an email
      if (password && user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials. Please try logging in directly.",
          });
        }
      } else if (!password && user.password) {
        return res.status(401).json({
          success: false,
          message: "Please provide your password to complete onboarding.",
        });
      }
    }

    // Check if user has already completed onboarding
    if (user.hasCompletedOnboarding) {
      return res
        .status(403)
        .json({ success: false, message: "Onboarding already completed" });
    }

    // Extract onboarding data from request body
    const {
      name,
      gender,
      languages,
      city,
      phone,
      username,
      educationType,
      board,
      universityName,
      class: userClass,
      stream,
      schoolName,
      courseLevel,
      courseDetails,
      collegeName,
      examsPreparingFor,
      reasonForAdmeasy,
      reasonForAdmeasyInput,
    } = req.body;

    // Update user with onboarding data
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (languages && Array.isArray(languages)) user.languages = languages;
    if (city) user.city = city;
    if (phone) user.phone = typeof phone === "string" ? parseInt(phone) : phone;

    // Handle username update if provided and not already set
    if (username && !user.username) {
      const normalizedUsername = username.trim().toLowerCase();
      const escapedUsername = normalizedUsername.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      // Check uniqueness
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      });
      const Mentor = require("../models/mentorSchema.js");
      const existingMentor = await Mentor.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      });

      if (existingUser || existingMentor) {
        return res
          .status(409)
          .json({ success: false, message: "Username is already taken" });
      }
      user.username = normalizedUsername;
    }

    user.educationType = educationType || user.educationType;
    user.board = board || null;
    user.universityName = universityName || null;
    user.class = userClass || null;
    user.stream = stream || null;
    user.schoolName = schoolName || null;
    user.courseLevel = courseLevel || null;
    user.courseDetails = courseDetails || null;
    user.collegeName = collegeName || null;

    if (examsPreparingFor && Array.isArray(examsPreparingFor))
      user.examsPreparingFor = examsPreparingFor;
    user.reasonForAdmeasy = reasonForAdmeasy || null;
    user.reasonForAdmeasyInput = reasonForAdmeasyInput || null;

    // Set institute and course based on education type
    if (educationType === "school") {
      if (schoolName) user.institute = schoolName;
      else if (board) user.institute = board;

      if (userClass) {
        user.course = `Class ${userClass}`;
        if (stream) {
          user.course += ` (${stream})`;
        }
      }
    } else if (educationType === "college") {
      if (universityName) user.institute = universityName;
      else if (collegeName) user.institute = collegeName;

      if (courseDetails) {
        user.course = courseDetails;
      }
    }

    // Validate onboarding completion before marking as complete
    const {
      validateOnboardingCompletion,
    } = require("../utils/onboardingValidation");
    const validation = validateOnboardingCompletion(user);

    if (!validation.isComplete) {
      return res.status(400).json({
        success: false,
        message: `Missing required field: ${validation.missingFields[0]}`,
        field: validation.missingFields[0],
        missingFields: validation.missingFields,
        errors: validation.errors,
      });
    }

    // Mark onboarding as completed only if validation passes
    user.hasCompletedOnboarding = true;

    // Generate tokens if user is not currently authenticated via cookies
    // We verified them via password earlier, so we can log them in on this device
    if (!req.cookies["accessToken"]) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      setTokenCookies(res, accessToken, refreshToken);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      user: await User.findById(user._id).select("-password -refreshToken"),
      hasCompletedOnboarding: true,
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// CHECK ONBOARDING STATUS - Check if user can access onboarding and get completion status
router.get("/onboarding/status", async (req, res) => {
  try {
    let user = null;
    if (req.cookies["accessToken"]) {
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Not logged in, can access onboarding
        return res.json({
          success: true,
          canAccess: true,
          reason: "not_logged_in",
          requiresOnboarding: false,
        });
      }
    }

    if (!user) {
      // Not logged in, can access onboarding
      return res.json({
        success: true,
        canAccess: true,
        reason: "not_logged_in",
        requiresOnboarding: false,
      });
    }

    // Check onboarding completion status
    const { checkOnboardingStatus } = require("../utils/onboardingValidation");
    const onboardingStatus = checkOnboardingStatus(user);

    // User can access onboarding if it's incomplete
    // User cannot access onboarding if it's already completed
    const canAccess = onboardingStatus.requiresOnboarding;

    return res.json({
      success: true,
      canAccess,
      requiresOnboarding: onboardingStatus.requiresOnboarding,
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      isComplete: onboardingStatus.isComplete,
      missingFields: onboardingStatus.missingFields || [],
      recommendedFields: onboardingStatus.recommendedFields || [],
      errors: onboardingStatus.errors || [],
      reason: canAccess ? "not_completed" : "already_completed",
    });
  } catch (err) {
    console.error("Onboarding status check error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOG IN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    // Check if user signed up with Google (no password)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "This account was created with Google. Please sign in with Google.",
      });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address to log in.",
        isNotVerified: true,
      });
    }

    // Check onboarding completion
    const { checkOnboardingStatus } = require("../utils/onboardingValidation");
    const onboardingStatus = checkOnboardingStatus(user);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const switchToken = generateSwitchToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    res.json({
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
    res.status(500).json({ success: false, message: err.message });
  }
});

// SWITCH ACCOUNT
router.post("/switch-account", switchAccount);

// GOOGLE OAUTH ROUTES
// Initiate Google OAuth
router.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }
  // Store the original URL or any state if needed
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
    session: false, // Disable sessions, use JWT instead
  })(req, res, next);
});

/** @deprecated Prefer POST /api/auth/google — kept for older app builds */
router.post("/auth/google/native", postGoogleIdTokenLogin);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${getFrontendUrl()}/login?error=google_auth_failed`,
    session: false, // Disable sessions, use JWT instead
  }),
  async (req, res) => {
    try {
      // Safety check: ensure user is authenticated
      if (!req.user) {
        console.error("Google OAuth callback: req.user is undefined");
        return res.redirect(
          `${getFrontendUrl()}/login?error=google_auth_failed`,
        );
      }

      // Generate JWT tokens for the authenticated user
      const accessToken = generateAccessToken(req.user);
      const refreshToken = generateRefreshToken(req.user);
      req.user.refreshToken = refreshToken;
      await req.user.save();

      // For Google OAuth, email is already verified by Google
      // Mark as verified if not already verified
      if (!req.user.isVerified) {
        req.user.isVerified = true;
        req.user.emailVerifyToken = undefined;
        req.user.emailVerifyExpiry = undefined;
        await req.user.save();
      }

      // Set cookies
      setTokenCookies(res, accessToken, refreshToken);

      console.log("JWT issued:", accessToken);
      console.log("Cookie sent to browser");

      // Redirect to frontend
      const frontendUrl = getFrontendUrl();

      // Check onboarding completion status
      const {
        checkOnboardingStatus,
      } = require("../utils/onboardingValidation");
      const onboardingStatus = checkOnboardingStatus(req.user);

      // Always redirect to onboarding if incomplete, regardless of flag
      if (onboardingStatus.requiresOnboarding) {
        res.redirect(
          `${frontendUrl}/onboarding?oauth_success=true&token=${accessToken}`,
        );
      } else {
        res.redirect(`${frontendUrl}/?oauth_success=true&token=${accessToken}`);
      }
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
    }
  },
);

// LOGOUT
router.post("/logout", async (req, res) => {
  try {
    // Get refresh token from cookie to identify user
    const refreshToken = req.cookies["refreshToken"];

    // Clear refresh token from database if it exists
    if (refreshToken) {
      try {
        await User.updateOne(
          { refreshToken: refreshToken },
          { $unset: { refreshToken: 1 } },
        );
      } catch (dbErr) {
        // Log error but don't fail logout if DB update fails
        console.error("Error clearing refresh token from database:", dbErr);
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) {
      // No refresh token - user is not logged in, return success but indicate no refresh happened
      return res.json({
        success: true,
        refreshed: false,
        message: "No refresh token available",
      });
    }

    // ROLE CHECK: Verify if this is a User token before checking DB to avoid clearing Mentor cookies
    const jwt = require("jsonwebtoken"); // Ensure jwt is available
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      // Verify failed (expired or invalid)
      // SAFELY check if it was a Mentor token before clearing cookies
      const unsafeDecoded = jwt.decode(refreshToken);
      if (
        unsafeDecoded &&
        unsafeDecoded.role &&
        unsafeDecoded.role !== "user"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Role mismatch" });
      }

      // It was a user token (or unknown), so safe to clear
      clearTokenCookies(res);
      return res.json({
        success: true,
        refreshed: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Verify succeeded
    if (decoded.role && decoded.role !== "user") {
      // Valid token but not for User
      return res.status(403).json({ success: false, message: "Role mismatch" });
    }

    // Check if user exists and has this refresh token (not logged out)
    const user = await User.findOne({ refreshToken });
    if (!user) {
      // User has logged out or token is invalid/revoked, clear cookies
      clearTokenCookies(res);
      return res.json({
        success: true,
        refreshed: false,
        message: "User has logged out",
      });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken(user);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? ".admeasy.in" : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    res.json({ success: true, refreshed: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET CURRENT USER (supports both session and JWT)
router.get("/me", async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      // Passport session user
      user = await User.findById(req.user.id || req.user._id).select(
        "-password -refreshToken",
      );
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // JWT fallback
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id).select(
          "-password -refreshToken",
        );
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    } else if (req.cookies["accessToken"]) {
      // JWT in cookie fallback
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id).select(
          "-password -refreshToken",
        );
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    }
    if (!user) {
      console.log("GET /me failed: User not found or not authenticated", {
        hasUser: !!req.user,
        authHeader: req.headers.authorization ? "Present" : "Missing",
        cookie: req.cookies["accessToken"] ? "Present" : "Missing",
      });
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    // Process the user's image (handle Google URLs vs Backblaze files)
    const processedUser = await processUserImage(user);

    res.json({ success: true, user: processedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET CURRENT USER VERIFICATION STATUS (for email verification modal polling)
router.get("/me/verification-status", async (req, res) => {
  try {
    let user = null;

    // Check for JWT in cookie (primary method for newly signed up users)
    if (req.cookies["accessToken"]) {
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id).select("isVerified");
      } catch (jwtErr) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // JWT in header fallback
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id).select("isVerified");
      } catch (jwtErr) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    res.json({ success: true, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE CURRENT USER (supports both session and JWT)
router.put("/me", upload.single("image"), async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      // Passport session user
      user = await User.findById(req.user.id || req.user._id);
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // JWT fallback
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    } else if (req.cookies["accessToken"]) {
      // JWT in cookie fallback
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    }
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    const {
      name,
      institute,
      course,
      phone,
      gender,
      dateOfBirth,
      languages,
      city,
      educationType,
      board,
      universityName,
      class: userClass,
      stream,
      schoolName,
      courseLevel,
      courseDetails,
      collegeName,
      examsPreparingFor,
      reasonForAdmeasy,
      reasonForAdmeasyInput,
    } = req.body;

    if (name) user.name = name;

    // Check username uniqueness if username is being changed
    if (
      req.body.username !== undefined &&
      req.body.username !== user.username
    ) {
      const normalizedUsername = req.body.username.trim().toLowerCase();
      // Escape special regex characters to match literally
      const escapedUsername = normalizedUsername.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

      // Check if username is already taken by another user
      const userWithUsername = await User.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
        _id: { $ne: user._id },
      });

      // Also check if username is taken by a mentor
      const Mentor = require("../models/mentorSchema.js");
      const mentorWithUsername = await Mentor.findOne({
        username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
      });

      if (userWithUsername || mentorWithUsername) {
        return res
          .status(409)
          .json({ success: false, message: "Username is already taken" });
      }

      user.username = req.body.username;
    }

    if (institute) user.institute = institute;
    if (course) user.course = course;
    if (phone) user.phone = typeof phone === "string" ? parseInt(phone) : phone;

    if (gender) user.gender = gender;
    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      if (dobDate > today) {
        return res.status(400).json({
          success: false,
          message: "Date of Birth cannot be in the future",
        });
      }
      user.dateOfBirth = dobDate;
    }

    // Onboarding fields - handle JSON strings from FormData
    if (languages !== undefined) {
      try {
        user.languages =
          typeof languages === "string"
            ? JSON.parse(languages)
            : Array.isArray(languages)
              ? languages
              : [];
      } catch {
        user.languages = Array.isArray(languages) ? languages : [];
      }
    }
    if (city !== undefined) user.city = city;
    if (educationType) user.educationType = educationType;
    if (board) user.board = board;
    if (universityName) user.universityName = universityName;
    if (userClass) user.class = userClass;
    if (stream) user.stream = stream;
    if (schoolName) user.schoolName = schoolName;
    if (courseLevel) user.courseLevel = courseLevel;
    if (courseDetails) user.courseDetails = courseDetails;
    if (collegeName) user.collegeName = collegeName;
    if (examsPreparingFor !== undefined) {
      try {
        user.examsPreparingFor =
          typeof examsPreparingFor === "string"
            ? JSON.parse(examsPreparingFor)
            : Array.isArray(examsPreparingFor)
              ? examsPreparingFor
              : [];
      } catch {
        user.examsPreparingFor = Array.isArray(examsPreparingFor)
          ? examsPreparingFor
          : [];
      }
    }
    if (reasonForAdmeasy) user.reasonForAdmeasy = reasonForAdmeasy;
    if (reasonForAdmeasyInput)
      user.reasonForAdmeasyInput = reasonForAdmeasyInput;
    // Handle image upload if file provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists and is a Cloudinary URL
        if (user.image && user.image.includes("cloudinary.com")) {
          const publicId = extractCloudinaryPublicId(user.image);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (deleteErr) {
              console.error("Error deleting old Cloudinary image:", deleteErr);
              // Continue with upload even if delete fails
            }
          }
        }
        // Also handle old Backblaze images for backward compatibility
        else if (
          user.image &&
          !user.image.includes("googleusercontent.com") &&
          !user.image.includes("cloudinary.com")
        ) {
          try {
            await b2.deleteFiles(user.image);
          } catch (deleteErr) {
            console.error("Error deleting old Backblaze image:", deleteErr);
            // Continue with upload even if delete fails
          }
        }

        // Upload new image to Cloudinary
        const cloudUrl = await uploadToCloudinary(req.file.buffer, "users");
        user.image = cloudUrl;
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Error uploading image" });
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    // Process the user's image (handle Google URLs vs Backblaze files)
    const processedUser = await processUserImage(updatedUser);

    res.json({ success: true, user: processedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
    console.log(err);
  }
});

// GET USER PROFILE PICTURE (supports both session and JWT)
router.get("/me/pic", async (req, res) => {
  try {
    let user = null;
    if (req.user) {
      // Passport session user
      user = await User.findById(req.user.id || req.user._id);
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // JWT fallback
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    } else if (req.cookies["accessToken"]) {
      // JWT in cookie fallback
      const token = req.cookies["accessToken"];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        user = await User.findById(decoded.id);
      } catch (jwtErr) {
        // Token is invalid or expired, clear it
        clearTokenCookies(res);
        return res
          .status(401)
          .json({ success: false, message: "Invalid or expired token" });
      }
    }
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    if (!user.image) {
      // No image uploaded yet
      return res.json(null);
    }

    // Check if it's a Google URL (contains googleusercontent.com)
    if (user.image.includes("googleusercontent.com")) {
      // Return proxy URL to avoid rate limiting
      return res.json(
        `/api/users/proxy-image?url=${encodeURIComponent(user.image)}`,
      );
    } else if (user.image.includes("cloudinary.com")) {
      // It's a Cloudinary URL, return as-is (already public)
      return res.json(user.image);
    } else {
      // It's a Backblaze file, get authorized URL (for backward compatibility)
      try {
        const files = await b2.listFiles(user.image);
        if (!files || files.length === 0) {
          // No image found in Backblaze
          return res.json(null);
        }
        const fileName = files[0].fileName;
        const auth = await b2.getDownloadAuthorization(fileName);
        res.json(auth.url);
      } catch (err) {
        console.error("Error getting Backblaze authorization:", err);
        res
          .status(500)
          .json({ success: false, message: "Error retrieving image" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PROXY GOOGLE IMAGE (to avoid rate limiting)
router.get("/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res
        .status(400)
        .json({ success: false, message: "URL parameter is required" });
    }

    // Only allow Google user content URLs for security
    if (!url.includes("googleusercontent.com")) {
      return res.status(403).json({
        success: false,
        message: "Only Google user content URLs are allowed",
      });
    }

    // Fetch the image from Google
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Failed to fetch image: ${response.status} ${response.statusText}`,
      });
    }

    // Get the image buffer
    const buffer = await response.arrayBuffer();

    // Set appropriate headers
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "image/jpeg",
    );
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send the image
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Error proxying image:", err);
    res.status(500).json({ success: false, message: "Error proxying image" });
  }
});

// GET AUTHORIZED IMAGE URL FOR OTHER USER (for admin/unlock functionality)
router.get("/:userId/image", verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.image) {
      return res.json(null);
    }

    // Check if it's a Google URL (contains googleusercontent.com)
    if (user.image.includes("googleusercontent.com")) {
      // Return proxy URL to avoid rate limiting
      return res.json(
        `/api/users/proxy-image?url=${encodeURIComponent(user.image)}`,
      );
    } else if (user.image.includes("cloudinary.com")) {
      // It's a Cloudinary URL, return as-is (already public)
      return res.json(user.image);
    } else {
      // It's a Backblaze file, get authorized URL (for backward compatibility)
      try {
        const files = await b2.listFiles(user.image);
        if (!files || files.length === 0) {
          return res.json(null);
        }
        const fileName = files[0].fileName;
        const auth = await b2.getDownloadAuthorization(fileName);
        res.json(auth.url);
      } catch (err) {
        console.error("Error getting Backblaze authorization:", err);
        res
          .status(500)
          .json({ success: false, message: "Error retrieving image" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete(
  "/:userId",
  authenticateRequired,
  requireSelfOrAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Delete image if present (handle Cloudinary, Backblaze, but not Google images)
      if (user.image && !user.image.includes("googleusercontent.com")) {
        try {
          if (user.image.includes("cloudinary.com")) {
            // Delete from Cloudinary
            const publicId = extractCloudinaryPublicId(user.image);
            if (publicId) {
              await deleteFromCloudinary(publicId);
            }
          } else {
            // Delete from Backblaze (for backward compatibility)
            await b2.deleteFiles(user.image);
          }
        } catch (err) {
          console.error("Error deleting user image:", err);
          // Continue with user deletion even if image deletion fails
        }
      }
      await User.findByIdAndDelete(req.params.userId);

      res.json({
        success: true,
        message: "User and image deleted successfully (if applicable)",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// EMAIL VERIFICATION
router.post("/send-verification-email", sendEmailVerification);
router.get("/verify-email/:token", verifyEmail);

// GET VERIFICATION STATUS (for frontend polling)
router.get("/verification-status", async (req, res) => {
  try {
    const token = req.cookies["accessToken"];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select(
      "isVerified email",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      isVerified: user.isVerified || false,
      email: user.email,
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
});

// RESET PASSWORD
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// GET USER BY ID (for mentors who have chats with the user, or users viewing their own profile)
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const token = req.cookies["accessToken"];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    // Check if this is a mentor by checking if there's a mentor with this ID
    // OPTIMIZED: Using lean() and parallel queries where possible
    const Mentor = require("../models/mentorSchema.js");
    const mentor = await Mentor.findById(decoded.id).lean();

    if (mentor) {
      // It's a mentor - verify they have a chat with this user
      const UserToMentorChat = require("../models/userToMentorChatSchema.js");
      const chat = await UserToMentorChat.findOne({
        userId,
        mentorId: decoded.id,
        isActive: true,
      }).lean();

      if (!chat) {
        return res.status(403).json({
          success: false,
          message: "You can only view details of users you have chats with",
        });
      }
    } else {
      // It's a regular user - they can only view their own profile
      if (decoded.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own profile",
        });
      }
    }

    // Find the user - OPTIMIZED: Using lean() for faster queries
    const user = await User.findById(userId)
      .select("-password -refreshToken")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Process image if needed
    const processedUser = await processUserImage(user);

    res.json(processedUser);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/users/:targetId/follow
 * Follow a user or mentor (authenticated users and mentors can follow anyone)
 */
router.post("/:targetId/follow", async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const targetId = req.params.targetId;
    const Mentor = require("../models/mentorSchema.js");

    // Get the follower (can be user or mentor)
    let follower = null;
    let followerType = null;

    if (decoded.role === "mentor") {
      follower = await Mentor.findById(decoded.id || decoded._id);
      followerType = "mentor";
    } else {
      follower = await User.findById(decoded.id || decoded._id);
      followerType = "user";
    }

    if (!follower) {
      return res
        .status(404)
        .json({ success: false, message: "Follower not found" });
    }

    // Prevent self-follow
    if (follower._id.toString() === targetId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot follow yourself" });
    }

    // Find the target (can be user or mentor)
    let target = await User.findById(targetId);
    let targetType = "user";

    if (!target) {
      target = await Mentor.findById(targetId);
      targetType = "mentor";
    }

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Target user or mentor not found" });
    }

    // Initialize arrays if they don't exist (for existing records)
    if (!follower.following) {
      follower.following = [];
    }
    if (!target.followers) {
      target.followers = [];
    }

    // Check if already following
    const isFollowing = follower.following.some(
      (id) => id.toString() === targetId,
    );

    if (isFollowing) {
      // Unfollow
      follower.following = follower.following.filter(
        (id) => id.toString() !== targetId,
      );
      target.followers = target.followers.filter(
        (id) => id.toString() !== follower._id.toString(),
      );
      await follower.save();
      await target.save();

      return res.json({
        success: true,
        message: "Unfollowed successfully",
        isFollowing: false,
        followersCount: target.followers.length,
      });
    } else {
      // Follow
      follower.following.push(target._id);
      target.followers.push(follower._id);
      await follower.save();
      await target.save();

      // Notify target using new notification system
      (async () => {
        try {
          const NotificationManager = require("../services/notificationManager");
          const isFollowBack =
            target.following &&
            target.following.some(
              (id) => id.toString() === follower._id.toString(),
            );
          const followerName = follower.name || follower.username || "Someone";

          // Determine notification type and message
          const notificationType = isFollowBack ? "FOLLOW_BACK" : "FOLLOW";
          const message = isFollowBack
            ? `${followerName} followed you back`
            : `${followerName} started following you`;

          // Get follower username for originPath
          const followerUsername = follower.username || follower._id.toString();
          const originPath = `/${followerUsername}`;

          // Determine recipient role
          const recipientRole = targetType === "mentor" ? "mentor" : "user";
          const followerRole = followerType === "mentor" ? "mentor" : "user";

          await NotificationManager.createAndSend({
            recipientId: target._id,
            recipientRole,
            actorId: follower._id,
            type: notificationType,
            entityType: "USER",
            entityId: follower._id,
            originPath,
            message,
            actorInfo: { name: followerName, username: followerUsername },
          });

          // If it's a follow-back, also notify the follower
          if (isFollowBack) {
            const targetName = target.name || target.username || "Someone";
            const targetUsername = target.username || target._id.toString();

            await NotificationManager.createAndSend({
              recipientId: follower._id,
              recipientRole: followerRole,
              actorId: target._id,
              type: "FOLLOW_BACK",
              entityType: "USER",
              entityId: target._id,
              originPath: `/${targetUsername}`,
              message: `${targetName} followed you back`,
              actorInfo: { name: targetName, username: targetUsername },
            });
          }
        } catch (notifyError) {
          console.error("Error sending follow notification:", notifyError);
        }
      })();

      return res.json({
        success: true,
        message: "Followed successfully",
        isFollowing: true,
        followersCount: target.followers.length,
      });
    }
  } catch (error) {
    console.error("Error following/unfollowing:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/users/:targetId/follow-status
 * Check if current user/mentor is following a target user or mentor (optional auth)
 */
router.get("/:targetId/follow-status", async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    let isFollowing = false;
    const targetId = req.params.targetId;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const Mentor = require("../models/mentorSchema.js");

        // Get the current user/mentor
        let currentUser = null;
        if (decoded.role === "mentor") {
          currentUser = await Mentor.findById(decoded.id || decoded._id);
        } else {
          currentUser = await User.findById(decoded.id || decoded._id);
        }

        if (currentUser && currentUser.following) {
          isFollowing = currentUser.following.some(
            (id) => id.toString() === targetId,
          );
        }
      } catch (err) {
        // Token invalid, user not logged in
      }
    }

    // Find the target (can be user or mentor) to get followers count
    const Mentor = require("../models/mentorSchema.js");
    let target = await User.findById(targetId);

    if (!target) {
      target = await Mentor.findById(targetId);
    }

    const followersCount =
      target && target.followers ? target.followers.length : 0;

    res.json({
      success: true,
      isFollowing,
      followersCount,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/users/:targetId/followers
 * Get list of followers for a user or mentor
 */
router.get("/:targetId/followers", async (req, res) => {
  try {
    const targetId = req.params.targetId;
    const Mentor = require("../models/mentorSchema.js");

    // Find the target (can be user or mentor)
    let target = await User.findById(targetId);

    if (!target) {
      target = await Mentor.findById(targetId);
    }

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User or mentor not found" });
    }

    const followersIds = target.followers || [];

    if (followersIds.length === 0) {
      return res.json({
        success: true,
        followers: [],
        count: 0,
      });
    }

    // Fetch all users and mentors in parallel using $in operator
    const [users, mentors] = await Promise.all([
      User.find({ _id: { $in: followersIds } })
        .select("name username image imageUrl _id")
        .lean(),
      Mentor.find({ _id: { $in: followersIds } })
        .select("name username image imageUrl _id")
        .lean(),
    ]);

    // Create maps for quick lookup
    const userMap = new Map(
      users.map((u) => [u._id.toString(), { ...u, type: "user" }]),
    );
    const mentorMap = new Map(
      mentors.map((m) => [m._id.toString(), { ...m, type: "mentor" }]),
    );

    // Build followers array maintaining the original order
    const followers = followersIds
      .map((id) => {
        const idStr = id.toString();
        return userMap.get(idStr) || mentorMap.get(idStr);
      })
      .filter(Boolean); // Remove any undefined entries

    res.json({
      success: true,
      followers,
      count: followers.length,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

/**
 * GET /api/users/:targetId/following
 * Get list of users/mentors that the target is following
 */
router.get("/:targetId/following", async (req, res) => {
  try {
    const targetId = req.params.targetId;
    const Mentor = require("../models/mentorSchema.js");

    // Find the target (can be user or mentor)
    let target = await User.findById(targetId);

    if (!target) {
      target = await Mentor.findById(targetId);
    }

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User or mentor not found" });
    }

    const followingIds = target.following || [];

    if (followingIds.length === 0) {
      return res.json({
        success: true,
        following: [],
        count: 0,
      });
    }

    // Fetch all users and mentors in parallel using $in operator
    const [users, mentors] = await Promise.all([
      User.find({ _id: { $in: followingIds } })
        .select("name username image imageUrl _id")
        .lean(),
      Mentor.find({ _id: { $in: followingIds } })
        .select("name username image imageUrl _id")
        .lean(),
    ]);

    // Create maps for quick lookup
    const userMap = new Map(
      users.map((u) => [u._id.toString(), { ...u, type: "user" }]),
    );
    const mentorMap = new Map(
      mentors.map((m) => [m._id.toString(), { ...m, type: "mentor" }]),
    );

    // Build following array maintaining the original order
    const following = followingIds
      .map((id) => {
        const idStr = id.toString();
        return userMap.get(idStr) || mentorMap.get(idStr);
      })
      .filter(Boolean); // Remove any undefined entries

    res.json({
      success: true,
      following,
      count: following.length,
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
