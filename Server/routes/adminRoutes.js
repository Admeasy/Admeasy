const express = require("express");
const router = express.Router();
const { adminAuth, verifyAdminToken } = require("../middleware/adminAuth");
const School = require("../models/schoolSchema");
const {
  getMentorActivity,
  getInactiveMentors,
  getEngagementSummary,
} = require("../controllers/adminActivityController");
const {
  getFunnelStats,
  getDroppedSuggestions,
  getMentorFunnel,
} = require("../controllers/adminSuggestionController");

// Admin login route
router.post("/login", adminAuth);

// Protected admin routes
router.get("/verify", verifyAdminToken, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// Logout route
router.post("/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.json({ success: true, message: "Logged out successfully" });
});

// ================= SCHOOLS (Admin only) =================
router.get("/schools", verifyAdminToken, async (req, res) => {
  try {
    const schools = await School.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, schools });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// All activity logs for a specific mentor
// Usage: GET /api/admin/mentor-activity?mentorId=664abc123...
router.get("/mentor-activity", verifyAdminToken, getMentorActivity);

// Mentors inactive for N days (default 15) — also the Feature 4 contract endpoint
// Usage: GET /api/admin/mentors/inactive?days=15
router.get("/mentors/inactive", verifyAdminToken, getInactiveMentors);

// Engagement summary across all mentors
// Usage: GET /api/admin/mentors/engagement-summary
router.get(
  "/mentors/engagement-summary",
  verifyAdminToken,
  getEngagementSummary,
);

// Suggestion funnel stats
// Usage: GET /api/admin/suggestions/funnel
router.get("/suggestions/funnel", verifyAdminToken, getFunnelStats);

// Dropped suggestions
// Usage: GET /api/admin/suggestions/dropped
router.get("/suggestions/dropped", verifyAdminToken, getDroppedSuggestions);

// Mentor funnel stats
// Usage: GET /api/admin/suggestions/mentor/:id
router.get("/suggestions/mentor/:id", verifyAdminToken, getMentorFunnel);

module.exports = router;
