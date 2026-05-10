/**
 * utils/matchScorer.js
 *
 * Scores a mentor against a student's UserProfile.
 * Returns { score: Number, reasons: String[] }
 *
 * Scoring weights:
 *   +25 per examInterest overlap with mentor.examsCoaching
 *   +15 per subjectInterest overlap with mentor.topTags (or subjectInterests on mentor if added later)
 *   +10  same city
 *   +10 per shared language
 *   +15  mentor active in last 7 days (lastActiveAt)
 *   +10  mentor rating >= 4
 *   EXCLUDE if mentor._id is in studentProfile.followedMentors
 */

const WEIGHTS = {
  examMatch: 25,
  subjectMatch: 15,
  sameCity: 10,
  languageMatch: 10,
  recentlyActive: 15,
  highRating: 10,
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalise a value to lowercase string for case-insensitive comparison.
 * Handles plain strings and objects with a `.name` property (e.g. competitiveExamsCleared).
 */
function normalise(val) {
  if (!val) return "";
  if (typeof val === "string") return val.trim().toLowerCase();
  if (typeof val === "object" && val.name) return val.name.trim().toLowerCase();
  return String(val).trim().toLowerCase();
}

/**
 * Returns the intersection of two arrays after normalisation.
 */
function overlap(arrA = [], arrB = []) {
  const setB = new Set(arrB.map(normalise));
  return arrA.map(normalise).filter((v) => v && setB.has(v));
}

/**
 * scoreMentor
 *
 * @param {Object} studentProfile  — Mongoose doc or plain object from UserProfile collection
 * @param {Object} mentor          — Mongoose doc or plain object from Mentor collection
 * @returns {{ score: number, reasons: string[] } | null}
 *   Returns null when the mentor must be excluded (already followed).
 */
function scoreMentor(studentProfile, mentor) {
  // --- Exclusion check ---
  const followedIds = (studentProfile.followedMentors || []).map((id) =>
    id.toString(),
  );
  if (followedIds.includes(mentor._id.toString())) {
    return null; // already followed — exclude from suggestions
  }

  let score = 0;
  const reasons = [];

  // --- Exam interest overlap ---
  const mentorExams = mentor.examsCoaching || [];
  const studentExams = studentProfile.examInterests || [];
  const examMatches = overlap(studentExams, mentorExams);
  if (examMatches.length > 0) {
    const points = examMatches.length * WEIGHTS.examMatch;
    score += points;
    reasons.push(
      `Coaches ${examMatches.join(", ")} (${examMatches.length} exam match${
        examMatches.length > 1 ? "es" : ""
      })`,
    );
  }

  // --- Subject interest overlap (uses studentProfile.subjectInterests vs mentor topTags) ---
  // Mentors don't have an explicit subjectTags field yet — matching against their
  // competitiveExamsCleared names as a proxy, or extend mentor schema later.
  const mentorSubjectTags = [
    ...(mentor.subjectTags || []),
    ...(mentor.competitiveExamsCleared || []),
  ];
  const studentSubjects = studentProfile.subjectInterests || [];
  const subjectMatches = overlap(studentSubjects, mentorSubjectTags);
  if (subjectMatches.length > 0) {
    const points = subjectMatches.length * WEIGHTS.subjectMatch;
    score += points;
    reasons.push(`Subject expertise aligns: ${subjectMatches.join(", ")}`);
  }

  // --- City match ---
  const studentCity = normalise(studentProfile.city || "");
  const mentorCity = normalise(mentor.city || "");
  if (studentCity && mentorCity && studentCity === mentorCity) {
    score += WEIGHTS.sameCity;
    reasons.push(`Based in ${mentor.city}`);
  }

  // --- Language overlap ---
  const langMatches = overlap(
    studentProfile.languages || [],
    mentor.languages || [],
  );
  if (langMatches.length > 0) {
    const points = langMatches.length * WEIGHTS.languageMatch;
    score += points;
    reasons.push(`Teaches in ${langMatches.join(", ")}`);
  }

  // --- Recently active (last 7 days) ---
  if (mentor.lastActiveAt) {
    const msSinceActive = Date.now() - new Date(mentor.lastActiveAt).getTime();
    if (msSinceActive <= SEVEN_DAYS_MS) {
      score += WEIGHTS.recentlyActive;
      reasons.push("Active in the last 7 days");
    }
  }

  // --- High rating ---
  if (mentor.rating != null && mentor.rating >= 4) {
    score += WEIGHTS.highRating;
    reasons.push(`Rated ${mentor.rating}/5`);
  }

  return { score, reasons };
}

module.exports = { scoreMentor };
