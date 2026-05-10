const express = require("express");
const router = express.Router();
const Mentor = require("../models/mentorSchema");
const MentorshipRequest = require("../models/mentorshipRequestSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const authenticateMentorJWT = require("../middleware/mentorAuth");
const { verifyAdminToken } = require("../middleware/adminAuth");
const fetch = require("node-fetch");
const upload = require("../middleware/multer");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/cloudinary");
const {
  mentorForgotPassword,
  mentorResetPassword,
} = require("../controllers/mentorController");
const { clearTokenCookies, setTokenCookies } = require("../utils/auth");
const MentorActivityLog = require("../models/mentorActivityLog");
const {
  getMentorSuggestions,
} = require("../controllers/mentorMatchController");
const { authenticateRequired } = require("../middleware/combinedAuth");
const { logMentorActivity } = require("../utils/logMentorActivity");

const verifyAdminFromCookie = (req) => {
  const token = req.cookies?.adminToken;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_ADMIN_SECRET);
  } catch (err) {
    return null;
  }
};

// Helper: generate JWT with role
const generateAccessToken = (mentor) => {
  return jwt.sign(
    {
      id: mentor._id,
      role: "mentor", // Add role to distinguish from user
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" },
  );
};

const generateRefreshToken = (mentor) => {
  return jwt.sign(
    {
      id: mentor._id,
      role: "mentor", // Add role to distinguish from user
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "28d" },
  );
};

const getPublicIdFromUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  try {
    return extractPublicId(imageUrl);
  } catch (error) {
    return null;
  }
};

// GET ALL MENTORS
router.get("/", async (req, res) => {
  try {
    const admin = verifyAdminFromCookie(req);

    // Base exclusions (always exclude auth tokens/hashes)
    let selectFields = "-password -refreshToken";

    // If NOT admin, also exclude sensitive private contact info
    if (!admin) {
      selectFields += " -email -phone";
    }

    const mentors = await Mentor.find().select(selectFields);
    res.status(200).json(mentors);
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal Server Error");
  }
});

// REGISTER MENTOR
router.post("/register", async (req, res) => {
  try {
    const { applicantId, email, password } = req.body;

    if (!applicantId) {
      return res
        .status(400)
        .json({ success: false, message: "Applicant ID is required" });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password are required" });
    }

    const existing = await Mentor.findOne({ email });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const mentor = new Mentor({ email, password: hashedPassword });

    try {
      const response = await fetch(
        "http://localhost:5000/api/apply/mentorship/" + applicantId,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to delete application:",
          response.status,
          errorText,
        );
        return res
          .status(500)
          .json({ success: false, message: "Failed to delete application" });
      }
    } catch (fetchError) {
      console.error("Error deleting application:", fetchError);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete application" });
    }

    await mentor.save();
    const accessToken = generateAccessToken(mentor);
    const refreshToken = generateRefreshToken(mentor);
    mentor.refreshToken = refreshToken;
    await mentor.save();
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
    });
    res
      .status(200)
      .json({ success: true, message: "Mentor registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", mentorForgotPassword);

// RESET PASSWORD
router.post("/reset-password/:token", mentorResetPassword);

// LOGIN MENTOR
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password are required" });
    }

    const mentor = await Mentor.findOne({ email });

    if (!mentor) {
      return res.status(401).json("Invalid Credentials");
    }

    const authorized = await bcrypt.compare(password, mentor.password);

    if (!authorized) {
      return res.status(401).json("Invalid Credentials");
    }

    const accessToken = generateAccessToken(mentor);
    const refreshToken = generateRefreshToken(mentor);
    mentor.refreshToken = refreshToken;
    await mentor.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
    });

    // -- 2a. Update lastActiveAt on the Mentor document --
    // (fire-and-forget — do not await, do not block the response)
    Mentor.findByIdAndUpdate(mentor._id, { lastActiveAt: new Date() }).catch(
      (err) => console.error("[login] lastActiveAt update failed:", err),
    );

    // -- 2b. Log the login event --
    // (fire-and-forget — wrapped in try/catch, never throws)
    (async () => {
      try {
        await MentorActivityLog.create({
          mentorId: mentor._id,
          eventType: "login",
          metadata: {
            ip: req.ip,
            userAgent: req.headers["user-agent"] || null,
          },
        });
      } catch (err) {
        console.error("[login] activity log failed:", err);
      }
    })();

    res.json({ success: true, message: "Logged in successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET CURRENT MENTOR (must be before /:username route)
router.get("/me", authenticateMentorJWT, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.mentor.id).select(
      "-password -refreshToken",
    );
    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }

    res.json({ success: true, mentor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET CURRENT MENTOR PROFILE PICTURE
router.get("/me/pic", authenticateMentorJWT, async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor || !mentor.image) {
      return res.json(null);
    }

    // Return Cloudinary URL directly
    res.json(mentor.image);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET MENTOR PROFILE PICTURE BY ID
router.get("/:id/pic", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor || !mentor.image) {
      return res.json(null);
    }

    // Return Cloudinary URL directly
    res.json(mentor.image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET MENTOR LEADERBOARD (must be before /id/:id or /:username)
router.get("/stats/leaderboard", authenticateMentorJWT, async (req, res) => {
  try {
    const Post = require("../models/postSchema");

    // Aggregate to get posts count and rating per mentor
    const mentors = await Mentor.find({}).select("name username image rating");

    const leaderboardData = await Promise.all(
      mentors.map(async (m) => {
        const postsCount = await Post.countDocuments({ mentorId: m._id });
        const rating =
          m.rating !== undefined && m.rating !== null ? m.rating : 5.0;
        const score = postsCount + rating / 2;
        return {
          _id: m._id,
          name: m.name,
          username: m.username,
          image: m.image,
          postsCount,
          rating,
          score,
        };
      }),
    );
    // Sort descending by score, then ascending by posts if tied
    leaderboardData.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.postsCount - a.postsCount;
    });

    // Assign rank
    const rankedData = leaderboardData.map((data, index) => ({
      ...data,
      rank: index + 1,
    }));

    res.status(200).json({ success: true, leaderboard: rankedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// GET MENTOR BY ID (must be before /:username route to avoid conflicts)
router.get("/id/:id", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id).select(
      "-password -refreshToken -email",
    );
    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }
    res.status(200).json(mentor);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});
// GET MENTOR SUGGESTIONS
router.get("/suggestions", authenticateRequired, getMentorSuggestions);

// GET MENTOR BY USERNAME
router.get("/:username", async (req, res) => {
  try {
    const mentor = await Mentor.findOne({
      username: req.params.username,
    }).select("-password -refreshToken -email");
    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }
    // Track profile view for suggestion funnel (only if viewer is a student)
    try {
      const token = req.cookies?.accessToken;
      if (token) {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded.role !== "mentor") {
          // Viewer is a student — update funnel record if one exists
          const { trackProfileViewed } = require("../utils/suggestionFunnel");
          trackProfileViewed(decoded.id || decoded._id, mentor._id);
        }
      }
    } catch (_) {
      // Non-fatal — invalid/missing token means anonymous visitor, skip
    }
    res.status(200).json(mentor);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// UPDATE MENTOR PROFILE (with image upload to Cloudinary)
router.put(
  "/me/:id",
  authenticateMentorJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("=== UPDATE MENTOR REQUEST ===");
      console.log("Body:", req.body);
      console.log("File:", req.file);

      const { name, username, phone, tagline, bio, dateOfBirth } = req.body;
      let competitiveExamsCleared = [];
      let shouldUpdateExams = false;
      if (req.body.competitiveExamsCleared) {
        shouldUpdateExams = true;
        try {
          const parsedExams =
            typeof req.body.competitiveExamsCleared === "string"
              ? JSON.parse(req.body.competitiveExamsCleared)
              : req.body.competitiveExamsCleared;
          if (Array.isArray(parsedExams)) {
            competitiveExamsCleared = parsedExams
              .filter((exam) => exam && exam.name)
              .map((exam) => ({ name: exam.name }));
          }
        } catch (parseError) {
          console.error("Error parsing competitiveExamsCleared:", parseError);
          shouldUpdateExams = false;
        }
      }

      // Parse college from JSON string if provided
      let college = null;
      if (req.body.college) {
        try {
          college =
            typeof req.body.college === "string" &&
            req.body.college.trim() !== ""
              ? JSON.parse(req.body.college)
              : req.body.college;
        } catch (parseError) {
          console.error("Error parsing college:", parseError);
        }
      }

      // Parse course from JSON string if provided
      let course = null;
      if (req.body.course) {
        try {
          course =
            typeof req.body.course === "string" && req.body.course.trim() !== ""
              ? JSON.parse(req.body.course)
              : req.body.course;
        } catch (parseError) {
          console.error("Error parsing course:", parseError);
        }
      }

      // Find existing mentor
      const existingMentor = await Mentor.findById(req.params.id);
      if (!existingMentor) {
        return res
          .status(404)
          .json({ success: false, message: "Mentor not found" });
      }

      // Check username uniqueness if username is being changed
      if (username && username !== existingMentor.username) {
        const normalizedUsername = username.trim().toLowerCase();
        // Escape special regex characters to match literally
        const escapedUsername = normalizedUsername.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );

        // Check if username is already taken by another mentor
        const mentorWithUsername = await Mentor.findOne({
          username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
          _id: { $ne: req.params.id },
        });

        // Also check if username is taken by a user
        const User = require("../models/userSchema");
        const userWithUsername = await User.findOne({
          username: { $regex: new RegExp(`^${escapedUsername}$`, "i") },
        });

        if (mentorWithUsername || userWithUsername) {
          return res
            .status(409)
            .json({ success: false, message: "Username is already taken" });
        }
      }

      const updateData = { name, username, phone, tagline, bio };
      if (dateOfBirth) {
        const dobDate = new Date(dateOfBirth);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100);

        if (dobDate > today) {
          return res.status(400).json({
            success: false,
            message: "Date of Birth cannot be in the future",
          });
        }
        if (dobDate < minDate) {
          return res.status(400).json({
            success: false,
            message: "Date of Birth is invalid (too old)",
          });
        }
        updateData.dateOfBirth = dateOfBirth;
      } else if (dateOfBirth === "") {
        updateData.dateOfBirth = null;
      }
      if (college) {
        updateData.college = college;
      }
      if (course) {
        updateData.course = course;
      }
      if (shouldUpdateExams) {
        updateData.competitiveExamsCleared = competitiveExamsCleared;
      }

      // Handle image upload to Cloudinary
      if (req.file) {
        try {
          console.log("Uploading image to Cloudinary:", req.file.path);
          const cloudUrl = await uploadToCloudinary(
            req.file.path,
            "mentor_profiles",
          );
          updateData.image = cloudUrl;
          console.log("Image uploaded to Cloudinary:", cloudUrl);
        } catch (uploadError) {
          console.error("Error uploading to Cloudinary:", uploadError);
          return res
            .status(500)
            .json({ success: false, message: "Error uploading image" });
        }
      }

      const mentor = await Mentor.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      console.log("Mentor updated successfully");
      res.status(200).json({
        success: true,
        message: "Mentor updated successfully",
        mentor,
      });
    } catch (error) {
      console.error("Error updating mentor:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },
);

// REFRESH TOKEN
// REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken)
      return res
        .status(401)
        .json({ success: false, message: "No refresh token" });

    // ROLE CHECK: Verify if this is a Mentor token before checking DB to avoid clearing User cookies
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      // Verify failed (expired or invalid)
      // SAFELY check if it was a User token before clearing cookies
      const unsafeDecoded = jwt.decode(refreshToken);
      const role = unsafeDecoded?.role;

      // If it has a role and it's NOT mentor (e.g. 'user'), PRESERVE COOKIES
      if (role && role !== "mentor") {
        return res
          .status(403)
          .json({ success: false, message: "Role mismatch" });
      }

      // It was a mentor token (or unknown), so safe to clear
      clearTokenCookies(res);
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    // Verify succeeded
    if (decoded.role !== "mentor") {
      return res.status(403).json({ success: false, message: "Role mismatch" });
    }

    // Check if user exists and has this refresh token (not logged out)
    const mentor = await Mentor.findOne({ refreshToken });
    if (!mentor) {
      // User has logged out or token is invalid, clear cookies
      clearTokenCookies(res);
      return res
        .status(403)
        .json({ success: false, message: "User has logged out" });
    }

    const newAccessToken = generateAccessToken(mentor);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? ".admeasy.in" : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOGOUT MENTOR
router.post("/logout", authenticateMentorJWT, async (req, res) => {
  try {
    // Clear refresh token from database
    await Mentor.findByIdAndUpdate(req.mentor.id, { refreshToken: null });

    // Clear cookies
    clearTokenCookies(res);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE MENTOR
router.delete("/:id", async (req, res) => {
  const admin = verifyAdminFromCookie(req);

  if (admin) {
    try {
      // Find the mentor first
      const mentor = await Mentor.findById(req.params.id);
      if (!mentor) {
        return res
          .status(404)
          .json({ success: false, message: "Mentor not found" });
      }

      if (mentor.image) {
        const publicId = getPublicIdFromUrl(mentor.image);
        await deleteFromCloudinary(publicId);
      }

      // Delete the mentor from database
      await Mentor.findByIdAndDelete(req.params.id);
      return res.json({
        success: true,
        message: "Mentor deleted successfully",
        mentorId: mentor._id,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  authenticateMentorJWT(req, res, async () => {
    try {
      if (!req.mentor || req.mentor.id !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this mentor",
        });
      }

      // Find the mentor first
      const mentor = await Mentor.findById(req.params.id);
      if (!mentor) {
        return res
          .status(404)
          .json({ success: false, message: "Mentor not found" });
      }

      // Delete the mentor from database
      await Mentor.findByIdAndDelete(req.params.id);

      if (mentor.image) {
        const publicId = getPublicIdFromUrl(mentor.image);
        await deleteFromCloudinary(publicId);
      }

      res
        .status(200)
        .json({ success: true, message: "Mentor deleted successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  });
});

module.exports = router;
