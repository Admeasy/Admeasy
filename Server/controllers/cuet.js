const CuetCutoffs = require("../models/CuetCutoffSchema");

// -----------------------------------
// CONSTANTS
// -----------------------------------

const DEFAULT_STUDENT_MAX_MARKS = 800;
const DEFAULT_COLLEGE_MAX_MARKS = 800;
const MAX_MARKS_UPPER_CAP = 10000;

// -----------------------------------
// HELPERS
// -----------------------------------

const sanitizeText = (text = "") => {
  return text
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s().,&-]/g, "");
};

const round2 = (n) => {
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
};

/**
 * Resolves max marks for the student's score sheet.
 * Invalid / missing → DEFAULT_STUDENT_MAX_MARKS (legacy 800).
 */
const resolveStudentMaxMarks = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return {
      value: DEFAULT_STUDENT_MAX_MARKS,
      usedFallback: true,
      invalidSent: false
    };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_MARKS_UPPER_CAP) {
    return {
      value: DEFAULT_STUDENT_MAX_MARKS,
      usedFallback: true,
      invalidSent: true
    };
  }
  return {
    value: n,
    usedFallback: false,
    invalidSent: false
  };
};

/**
 * Per-cutoff max marks from DB; invalid → legacy default.
 */
const resolveCollegeMaxMarks = (college) => {
  const n = Number(college?.maxMarks);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_MARKS_UPPER_CAP) {
    return { value: DEFAULT_COLLEGE_MAX_MARKS, usedFallback: true };
  }
  return { value: n, usedFallback: false };
};

const toPercentage = (score, maxMarks) => {
  if (!Number.isFinite(score) || !Number.isFinite(maxMarks) || maxMarks <= 0) {
    return null;
  }
  return (score / maxMarks) * 100;
};

/**
 * HIGH / MEDIUM / LOW from normalized margin (percentage points above cutoff).
 */
const getChanceLevel = (percentageDifference) => {
  const diff = Number(percentageDifference);
  if (!Number.isFinite(diff)) {
    return { label: "LOW", color: "red" };
  }

  if (diff >= 3) {
    return { label: "HIGH", color: "green" };
  }

  if (diff >= -2) {
    return { label: "MEDIUM", color: "yellow" };
  }

  return { label: "LOW", color: "red" };
};

/**
 * Recommendation bucket using percentage bands (not raw marks).
 * Priority: safe → target → dream (mutually exclusive).
 */
const getRecommendationBucket = (studentPercent, cutoffPercent) => {
  const sp = studentPercent;
  const cp = cutoffPercent;
  if (!Number.isFinite(sp) || !Number.isFinite(cp)) {
    return "dream";
  }
  if (sp >= cp + 3) return "safe";
  if (sp >= cp - 2 && sp < cp + 3) return "target";
  return "dream";
};

// -----------------------------------
// CONTROLLER
// -----------------------------------

exports.predictCollege = async (req, res) => {

  try {

    let {
      score,
      maxMarks: bodyMaxMarks,
      category,
      stream,
      course,
      limit = 25
    } = req.body;

    // -----------------------------------
    // VALIDATION
    // -----------------------------------

    if (
      score === undefined ||
      !category ||
      !course
    ) {
      return res.status(400).json({
        success: false,
        message:
          "score, category and course are required"
      });
    }

    score = Number(score);

    if (isNaN(score)) {
      return res.status(400).json({
        success: false,
        message: "Invalid score"
      });
    }

    const studentMaxMeta = resolveStudentMaxMarks(bodyMaxMarks);
    const studentMaxMarks = studentMaxMeta.value;

    if (score < 0 || score > studentMaxMarks) {
      return res.status(400).json({
        success: false,
        message:
          `Score must be between 0 and ${studentMaxMarks}` +
          (studentMaxMeta.usedFallback
            ? " (max marks defaulted to 800; send a valid maxMarks if your total is different)"
            : "")
      });
    }

    const studentPercentRaw = toPercentage(score, studentMaxMarks);
    const studentPercentage = round2(studentPercentRaw);

    category = sanitizeText(
      category.toUpperCase()
    );

    course = sanitizeText(course);

    if (stream) {
      stream = sanitizeText(stream);
    }

    // -----------------------------------
    // DEBUG LOGS
    // -----------------------------------

    console.log("Incoming Filters:", {
      score,
      maxMarks: studentMaxMarks,
      maxMarksFallback: studentMaxMeta.usedFallback,
      studentPercentage,
      category,
      stream,
      course
    });

    // -----------------------------------
    // BUILD QUERY
    // -----------------------------------

    const query = {
      category: {
        $regex: new RegExp(
          `^${category}$`,
          "i"
        )
      },

      course: {
        $regex: course.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        $options: "i"
      }
    };

    // Optional stream filter
    if (stream) {
      query.stream = {
        $regex: new RegExp(
          `^${stream}$`,
          "i"
        )
      };
    }

    console.log("Mongo Query:", query);

    // -----------------------------------
    // FETCH DATA
    // -----------------------------------

    const colleges = await CuetCutoffs
      .find(query)
      .sort({
        closingScore: -1
      })
      .lean();

    console.log(
      `Found ${colleges.length} colleges`
    );

    // -----------------------------------
    // NO RESULTS
    // -----------------------------------

    if (!colleges.length) {

      const availableCourses =
        await CuetCutoffs.distinct(
          "course"
        );

      return res.status(404).json({
        success: false,
        message:
          "No colleges found for selected course/category",

        debug: {
          receivedCourse: course,
          receivedCategory: category,
          sampleCourses:
            availableCourses.slice(0, 20)
        }
      });
    }

    // -----------------------------------
    // PROCESS RESULTS (normalized comparison)
    // -----------------------------------

    const processed = colleges.map(
      (college) => {

        const collegeMaxMeta = resolveCollegeMaxMarks(college);
        const collegeMaxMarks = collegeMaxMeta.value;

        const closingRaw = Number(college.closingScore);
        const closingScore = Number.isFinite(closingRaw) ? closingRaw : NaN;

        const cutoffPercentRaw = Number.isFinite(closingScore)
          ? toPercentage(
            closingScore,
            collegeMaxMarks
          )
          : null;
        const cutoffPercentage = round2(cutoffPercentRaw);

        let percentageDifference = null;
        if (
          Number.isFinite(studentPercentRaw) &&
          Number.isFinite(cutoffPercentRaw)
        ) {
          percentageDifference = round2(
            studentPercentRaw - cutoffPercentRaw
          );
        }

        const eligible =
          Number.isFinite(studentPercentRaw) &&
          Number.isFinite(cutoffPercentRaw) &&
          studentPercentRaw >= cutoffPercentRaw;

        const chance = getChanceLevel(percentageDifference);

        const rawMarksDifference = Number.isFinite(closingScore)
          ? Number(
            (
              score -
              closingScore
            ).toFixed(2)
          )
          : null;

        const bucket = getRecommendationBucket(
          studentPercentRaw,
          cutoffPercentRaw
        );

        return {

          id: college._id,

          collegeName:
            college.collegeName,

          university:
            college.university,

          course:
            college.course,

          stream:
            college.stream,

          category:
            college.category,

          round:
            college.round,

          year:
            college.year,

          cutoff:
            Number.isFinite(closingScore)
              ? Number(closingScore.toFixed(2))
              : null,

          cutoffMaxMarks: collegeMaxMarks,

          studentMaxMarks,

          studentPercentage,

          cutoffPercentage,

          percentageDifference,

          difference: rawMarksDifference,

          eligible,

          chance,

          _recommendationBucket: bucket

        };

      }
    );

    // -----------------------------------
    // SORT RESULTS
    // -----------------------------------

    processed.sort((a, b) => {

      // Eligible colleges first (normalized)
      if (
        a.eligible &&
        !b.eligible
      ) return -1;

      if (
        !a.eligible &&
        b.eligible
      ) return 1;

      // Then closest in percentage space
      const da = Number.isFinite(a.percentageDifference)
        ? Math.abs(a.percentageDifference)
        : Infinity;
      const db = Number.isFinite(b.percentageDifference)
        ? Math.abs(b.percentageDifference)
        : Infinity;
      return da - db;

    });

    // -----------------------------------
    // SPLIT RESULTS (percentage-based)
    // -----------------------------------

    const dream = [];
    const target = [];
    const safe = [];

    processed.forEach((college) => {

      const bucket = college._recommendationBucket;

      if (bucket === "safe") {
        safe.push(college);
      } else if (bucket === "target") {
        target.push(college);
      } else {
        dream.push(college);
      }

    });

    const stripInternal = (row) => {
      const { _recommendationBucket, ...rest } = row;
      return rest;
    };

    const safeOut = safe.map(stripInternal);
    const targetOut = target.map(stripInternal);
    const dreamOut = dream.map(stripInternal);

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    return res.status(200).json({

      success: true,

      filters: {
        score,
        maxMarks: studentMaxMarks,
        maxMarksWasDefaulted: studentMaxMeta.usedFallback,
        maxMarksInvalidIgnored: studentMaxMeta.invalidSent,
        studentPercentage,
        category,
        stream,
        course
      },

      totalResults:
        processed.length,

      breakdown: {
        safe: safeOut.length,
        target: targetOut.length,
        dream: dreamOut.length
      },

      recommendations: {

        safe:
          safeOut.slice(0, limit),

        target:
          targetOut.slice(0, limit),

        dream:
          dreamOut.slice(0, limit)

      }

    });

  }

  catch (err) {

    console.log(
      "CUET Prediction Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal Server Error"
    });

  }

};

// Courses function 

exports.getCourses = async (req, res) => {

  try {

    const { stream } = req.query;

    // -------------------------
    // BUILD FILTER
    // -------------------------

    const filter = {};

    if (stream && stream !== "All") {
      filter.stream = {
        $regex: new RegExp(`^${sanitizeText(stream)}$`, "i")
      };
    }

    // -------------------------
    // FETCH DISTINCT COURSES
    // -------------------------

    let courses = await CuetCutoffs.distinct(
      "course",
      filter
    );

    // -------------------------
    // CLEAN + SORT
    // -------------------------

    courses = courses
      .filter(Boolean)
      .map((course) => course.trim())
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    // -------------------------
    // RESPONSE
    // -------------------------

    return res.status(200).json({

      success: true,

      count: courses.length,

      courses: courses.map((course) => ({
        id: course
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-"),

        name: course
      }))

    });

  }

  catch (err) {

    console.log(
      "Get Courses Error:",
      err
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch courses"

    });

  }

};
