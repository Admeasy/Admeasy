/**
 * controllers/adminSuggestionController.js
 *
 * Admin APIs for Feature 3 — Suggestion Funnel Tracking
 *
 * Routes (add to adminRoutes.js):
 *   GET /api/admin/suggestions/funnel
 *   GET /api/admin/suggestions/dropped
 *   GET /api/admin/suggestions/mentor/:id
 */

const SuggestionInteraction = require("../models/suggestionInteraction");
const Mentor = require("../models/mentorSchema");

// ─────────────────────────────────────────────────────────────
// 1. GET /api/admin/suggestions/funnel
//    Platform-wide funnel conversion rates.
//    Shows how many suggestions reach each stage.
// ─────────────────────────────────────────────────────────────
exports.getFunnelStats = async (req, res) => {
  try {
    const total = await SuggestionInteraction.countDocuments();
    const profileViewed = await SuggestionInteraction.countDocuments({
      profileViewedAt: { $ne: null },
    });
    const followed = await SuggestionInteraction.countDocuments({
      followedAt: { $ne: null },
    });
    const chatInitiated = await SuggestionInteraction.countDocuments({
      chatInitiatedAt: { $ne: null },
    });
    const mentorResponded = await SuggestionInteraction.countDocuments({
      mentorRespondedAt: { $ne: null },
    });
    const subscribed = await SuggestionInteraction.countDocuments({
      subscribedAt: { $ne: null },
    });
    const dropped = await SuggestionInteraction.countDocuments({
      outcome: "dropped",
    });

    const pct = (n) =>
      total > 0 ? ((n / total) * 100).toFixed(1) + "%" : "0%";

    return res.status(200).json({
      success: true,
      funnel: {
        total,
        profileViewed: { count: profileViewed, rate: pct(profileViewed) },
        followed: { count: followed, rate: pct(followed) },
        chatInitiated: { count: chatInitiated, rate: pct(chatInitiated) },
        mentorResponded: { count: mentorResponded, rate: pct(mentorResponded) },
        subscribed: { count: subscribed, rate: pct(subscribed) },
        dropped: { count: dropped, rate: pct(dropped) },
      },
    });
  } catch (err) {
    console.error("[getFunnelStats]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. GET /api/admin/suggestions/dropped
//    All dropped records with mentor info.
//    Useful for identifying which mentors are ghosting students.
// ─────────────────────────────────────────────────────────────
exports.getDroppedSuggestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      SuggestionInteraction.find({ outcome: "dropped" })
        .sort({ chatInitiatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SuggestionInteraction.countDocuments({ outcome: "dropped" }),
    ]);

    // Enrich with mentor names
    const mentorIds = [...new Set(records.map((r) => r.mentorId.toString()))];
    const mentors = await Mentor.find({ _id: { $in: mentorIds } })
      .select("_id name username email")
      .lean();
    const mentorMap = {};
    mentors.forEach((m) => {
      mentorMap[m._id.toString()] = m;
    });

    const enriched = records.map((r) => ({
      ...r,
      mentor: mentorMap[r.mentorId.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      records: enriched,
    });
  } catch (err) {
    console.error("[getDroppedSuggestions]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. GET /api/admin/suggestions/mentor/:id
//    Per-mentor funnel breakdown — how well a specific mentor
//    converts suggested students.
// ─────────────────────────────────────────────────────────────
exports.getMentorFunnel = async (req, res) => {
  try {
    const mentorId = req.params.id;

    const mentor = await Mentor.findById(mentorId)
      .select("name username email rating responseRate")
      .lean();

    if (!mentor) {
      return res
        .status(404)
        .json({ success: false, message: "Mentor not found" });
    }

    const records = await SuggestionInteraction.find({ mentorId }).lean();
    const total = records.length;

    const count = (fn) => records.filter(fn).length;
    const pct = (n) =>
      total > 0 ? ((n / total) * 100).toFixed(1) + "%" : "0%";

    const profileViewed = count((r) => r.profileViewedAt);
    const followed = count((r) => r.followedAt);
    const chatInitiated = count((r) => r.chatInitiatedAt);
    const mentorResponded = count((r) => r.mentorRespondedAt);
    const subscribed = count((r) => r.subscribedAt);
    const dropped = count((r) => r.outcome === "dropped");
    const pending = count((r) => r.outcome === "pending");
    const engaged = count((r) => r.outcome === "engaged");

    return res.status(200).json({
      success: true,
      mentor,
      funnel: {
        total,
        profileViewed: { count: profileViewed, rate: pct(profileViewed) },
        followed: { count: followed, rate: pct(followed) },
        chatInitiated: { count: chatInitiated, rate: pct(chatInitiated) },
        mentorResponded: { count: mentorResponded, rate: pct(mentorResponded) },
        subscribed: { count: subscribed, rate: pct(subscribed) },
      },
      outcomes: {
        pending,
        engaged,
        subscribed,
        dropped,
      },
    });
  } catch (err) {
    console.error("[getMentorFunnel]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
