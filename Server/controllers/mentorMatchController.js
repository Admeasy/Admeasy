/**
 * controllers/mentorMatchController.js
 *
 * GET /api/mentors/suggestions
 * Protected by authenticateRequired (combinedAuth middleware).
 *
 * 1. Reads the logged-in student's UserProfile.
 * 2. Fetches all mentors where isEligibleForSuggestions: true.
 * 3. Scores each mentor via matchScorer, excludes already-followed mentors.
 * 4. Sorts descending by score, returns top N with matchScore + matchReasons.
 */

const UserProfile = require("../models/userProfileSchema");
const Mentor = require("../models/mentorSchema");
const { scoreMentor } = require("../utils/matchScorer");
const { trackSuggestionShown } = require("../utils/suggestionFunnel");

// How many suggestions to return by default
const DEFAULT_LIMIT = 10;

async function getMentorSuggestions(req, res) {
  try {
    const studentId = req.user._id; // set by authenticateRequired middleware
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_LIMIT, 50);

    // --- 1. Load student profile ---
    const studentProfile = await UserProfile.findOne({
      userId: studentId,
    }).lean();

    if (!studentProfile) {
      // Profile not built yet — return empty suggestions, not an error
      return res.status(200).json({
        success: true,
        suggestions: [],
        message:
          "Complete your profile to get personalised mentor suggestions.",
      });
    }

    // Attach city / languages from raw User doc if not on profile
    // (UserProfile may not store these; they live on the User model)
    // We merge them in so matchScorer can use them transparently.
    if (!studentProfile.city || !studentProfile.languages) {
      try {
        const User = require("../models/userSchema");
        const user = await User.findById(studentId)
          .select("city languages")
          .lean();
        if (user) {
          studentProfile.city = studentProfile.city || user.city;
          studentProfile.languages = studentProfile.languages?.length
            ? studentProfile.languages
            : user.languages || [];
        }
      } catch (_) {
        // Non-fatal — continue without city/language enrichment
      }
    }

    // --- 2. Fetch eligible mentors ---
    const mentors = await Mentor.find({ isEligibleForSuggestions: true })
      .select(
        "name username image tagline city languages examsCoaching competitiveExamsCleared rating lastActiveAt responseRate college course",
      )
      .lean();

    if (!mentors.length) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    // --- 3. Score each mentor ---
    const scored = [];
    for (const mentor of mentors) {
      const result = scoreMentor(studentProfile, mentor);
      if (result === null) continue; // excluded (already followed)
      scored.push({
        mentor,
        matchScore: result.score,
        matchReasons: result.reasons,
      });
    }

    // --- 4. Sort descending by score, take top N ---
    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topSuggestions = scored.slice(0, limit);

    // Shape the response — expose only the fields the frontend needs
    const suggestions = topSuggestions.map(
      ({ mentor, matchScore, matchReasons }) => ({
        _id: mentor._id,
        name: mentor.name,
        username: mentor.username,
        image: mentor.image,
        tagline: mentor.tagline,
        city: mentor.city,
        college: mentor.college,
        course: mentor.course,
        rating: mentor.rating,
        responseRate: mentor.responseRate,
        examsCoaching: mentor.examsCoaching,
        lastActiveAt: mentor.lastActiveAt,
        matchScore,
        matchReasons,
      }),
    );

    const suggestedMentorIds = suggestions.map((s) => s._id);
    trackSuggestionShown(studentId, suggestedMentorIds);

    return res.status(200).json({ success: true, suggestions });
  } catch (err) {
    console.error("[getMentorSuggestions] error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = { getMentorSuggestions };
