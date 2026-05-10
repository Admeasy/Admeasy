/**
 * controllers/adminActivityController.js
 *
 * Admin APIs for Feature 2 — Mentor Activity Tracking
 *
 * Routes (add to your admin router):
 *   GET /api/admin/mentor-activity?mentorId=X
 *   GET /api/admin/mentors/inactive?days=15
 *   GET /api/admin/mentors/engagement-summary
 */

const MentorActivityLog = require("../models/mentorActivityLog");
const Mentor = require("../models/mentorSchema");

// ─────────────────────────────────────────────────────────────
// 1. GET /api/admin/mentor-activity?mentorId=X
//    Returns all activity logs for a specific mentor, newest first.
// ─────────────────────────────────────────────────────────────
exports.getMentorActivity = async (req, res) => {
  try {
    const { mentorId } = req.query;

    if (!mentorId) {
      return res
        .status(400)
        .json({ success: false, message: "mentorId query param is required" });
    }

    const logs = await MentorActivityLog.find({ mentorId })
      .sort({ createdAt: -1 })
      .limit(200) // safety cap
      .lean();

    return res.status(200).json({ success: true, mentorId, logs });
  } catch (err) {
    console.error("[getMentorActivity]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. GET /api/admin/mentors/inactive?days=15
//    Returns mentors whose lastActiveAt is older than N days
//    (or who have never been active).
//    Response shape consumed by the email re-engagement service (Feature 4).
// ─────────────────────────────────────────────────────────────
exports.getInactiveMentors = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 15;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const mentors = await Mentor.find({
      $or: [{ lastActiveAt: { $lt: cutoff } }, { lastActiveAt: null }],
    })
      .select("_id email lastActiveAt name username")
      .lean();

    return res.status(200).json({
      success: true,
      days,
      count: mentors.length,
      mentors, // includes _id, email, lastActiveAt — contract for Feature 4
    });
  } catch (err) {
    console.error("[getInactiveMentors]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. GET /api/admin/mentors/engagement-summary
//    Per-mentor breakdown of event counts across all time.
//    Useful for the admin dashboard.
// ─────────────────────────────────────────────────────────────
exports.getEngagementSummary = async (req, res) => {
  try {
    // Aggregate event counts grouped by mentorId + eventType
    const raw = await MentorActivityLog.aggregate([
      {
        $group: {
          _id: { mentorId: "$mentorId", eventType: "$eventType" },
          count: { $sum: 1 },
          lastOccurrence: { $max: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$_id.mentorId",
          events: {
            $push: {
              eventType: "$_id.eventType",
              count: "$count",
              lastOccurrence: "$lastOccurrence",
            },
          },
          totalEvents: { $sum: "$count" },
        },
      },
      { $sort: { totalEvents: -1 } },
    ]);

    // Enrich with mentor name + email
    const mentorIds = raw.map((r) => r._id);
    const mentors = await Mentor.find({ _id: { $in: mentorIds } })
      .select("_id name username email lastActiveAt")
      .lean();

    const mentorMap = {};
    mentors.forEach((m) => {
      mentorMap[m._id.toString()] = m;
    });

    const summary = raw.map((r) => {
      const mentor = mentorMap[r._id.toString()] || {};
      return {
        mentorId: r._id,
        name: mentor.name || null,
        username: mentor.username || null,
        email: mentor.email || null,
        lastActiveAt: mentor.lastActiveAt || null,
        totalEvents: r.totalEvents,
        events: r.events,
      };
    });

    return res.status(200).json({ success: true, summary });
  } catch (err) {
    console.error("[getEngagementSummary]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
