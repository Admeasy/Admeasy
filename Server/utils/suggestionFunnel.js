/**
 * utils/suggestionFunnel.js
 *
 * Fire-and-forget helpers for updating SuggestionInteraction records.
 * Import and call these from route handlers / controllers.
 * Never throws, never blocks the main request.
 */

const SuggestionInteraction = require("../models/suggestionInteraction");

/**
 * Internal upsert helper.
 * Creates the record if it doesn't exist, updates only null fields.
 */
async function upsertFunnelEvent(studentId, mentorId, fields) {
  // Only set fields that are currently null (first-write-wins)
  const setOnInsert = { studentId, mentorId };
  const setIfNull = {};

  for (const [key, value] of Object.entries(fields)) {
    setIfNull[key] = value;
  }

  // Use $set with $type check via findOneAndUpdate to only fill null fields
  await SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId },
    [
      {
        $set: Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [
            key,
            {
              $cond: {
                if: { $eq: [`$${key}`, null] },
                then: value,
                else: `$${key}`,
              },
            },
          ]),
        ),
      },
    ],
    { upsert: true },
  );
}

/**
 * Called when suggestions are returned to a student.
 * Creates a SuggestionInteraction record for each suggested mentor.
 */
function trackSuggestionShown(studentId, mentorIds) {
  const now = new Date();
  Promise.all(
    mentorIds.map((mentorId) =>
      SuggestionInteraction.findOneAndUpdate(
        { studentId, mentorId },
        { $setOnInsert: { studentId, mentorId, suggestedAt: now } },
        { upsert: true, new: false },
      ).catch((err) =>
        console.error("[funnel] trackSuggestionShown failed:", err),
      ),
    ),
  ).catch(() => {});
}

/**
 * Called when a student views a mentor's profile.
 */
function trackProfileViewed(studentId, mentorId) {
  SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId, profileViewedAt: null },
    { $set: { profileViewedAt: new Date() } },
  ).catch((err) => console.error("[funnel] trackProfileViewed failed:", err));
}

/**
 * Called when a student follows a mentor.
 * Also upgrades outcome to 'engaged'.
 */
function trackFollowed(studentId, mentorId) {
  SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId },
    {
      $set: {
        followedAt: new Date(),
        outcome: "engaged",
      },
    },
  ).catch((err) => console.error("[funnel] trackFollowed failed:", err));
}

/**
 * Called when a student initiates a chat with a mentor for the first time.
 */
function trackChatInitiated(studentId, mentorId) {
  SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId, chatInitiatedAt: null },
    { $set: { chatInitiatedAt: new Date(), outcome: "engaged" } },
  ).catch((err) => console.error("[funnel] trackChatInitiated failed:", err));
}

/**
 * Called when a mentor replies to a student in a suggested chat.
 */
function trackMentorResponded(studentId, mentorId) {
  SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId, mentorRespondedAt: null },
    { $set: { mentorRespondedAt: new Date() } },
  ).catch((err) => console.error("[funnel] trackMentorResponded failed:", err));
}

/**
 * Called when a student subscribes to a mentor.
 * Sets final outcome to 'subscribed'.
 */
function trackSubscribed(studentId, mentorId) {
  SuggestionInteraction.findOneAndUpdate(
    { studentId, mentorId },
    {
      $set: {
        subscribedAt: new Date(),
        outcome: "subscribed",
      },
    },
  ).catch((err) => console.error("[funnel] trackSubscribed failed:", err));
}

module.exports = {
  trackSuggestionShown,
  trackProfileViewed,
  trackFollowed,
  trackChatInitiated,
  trackMentorResponded,
  trackSubscribed,
};
