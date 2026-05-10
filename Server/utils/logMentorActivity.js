const MentorActivityLog = require("../models/mentorActivityLog");

function logMentorActivity(mentorId, eventType, metadata = {}) {
  MentorActivityLog.create({ mentorId, eventType, metadata }).catch((err) =>
    console.error(`[mentorActivity] failed to log ${eventType}:`, err),
  );
}

module.exports = { logMentorActivity };
