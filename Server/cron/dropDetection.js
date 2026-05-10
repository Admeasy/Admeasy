/**
 * cron/dropDetection.js
 *
 * Nightly job — finds suggestion funnel records where:
 *   - chatInitiatedAt exists (student reached out)
 *   - mentorRespondedAt is null (mentor never replied)
 *   - chatInitiatedAt was more than 48 hours ago
 *   - outcome is still 'pending' or 'engaged' (not already resolved)
 *
 * Marks these as outcome: 'dropped', dropReason: 'no_mentor_response'.
 *
 * HOW TO RUN:
 * Option A — node-cron (recommended, add to index.js):
 *   const cron = require('node-cron');
 *   const { runDropDetection } = require('./cron/dropDetection');
 *   cron.schedule('0 2 * * *', runDropDetection); // runs at 2am every night
 *
 * Option B — run manually:
 *   node -e "require('./cron/dropDetection').runDropDetection()"
 */

const SuggestionInteraction = require("../models/suggestionInteraction");

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

async function runDropDetection() {
  const startedAt = new Date();
  console.log(`[dropDetection] Starting run at ${startedAt.toISOString()}`);

  try {
    const cutoff = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);

    const result = await SuggestionInteraction.updateMany(
      {
        chatInitiatedAt: { $ne: null, $lt: cutoff },
        mentorRespondedAt: null,
        outcome: { $in: ["pending", "engaged"] },
      },
      {
        $set: {
          outcome: "dropped",
          dropReason: "no_mentor_response",
        },
      },
    );

    console.log(
      `[dropDetection] Done. Marked ${result.modifiedCount} records as dropped (no_mentor_response).`,
    );

    return {
      success: true,
      markedDropped: result.modifiedCount,
      ranAt: startedAt,
    };
  } catch (err) {
    console.error("[dropDetection] Failed:", err);
    return { success: false, error: err.message, ranAt: startedAt };
  }
}

module.exports = { runDropDetection };
