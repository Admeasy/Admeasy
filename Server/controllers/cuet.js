const CuetCutoffs = require("../models/CuetCutoffSchema");

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

const getChanceLevel = (score, cutoff) => {

  const diff = score - cutoff;

  if (diff >= 25) {
    return {
      label: "HIGH",
      color: "green"
    };
  }

  if (diff >= 5) {
    return {
      label: "MEDIUM",
      color: "yellow"
    };
  }

  return {
    label: "LOW",
    color: "red"
  };
};

// -----------------------------------
// CONTROLLER
// -----------------------------------

exports.predictCollege = async (req, res) => {

  try {

    let {
      score,
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

    if (score < 0 || score > 800) {
      return res.status(400).json({
        success: false,
        message:
          "Score must be between 0 and 800"
      });
    }

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
    // PROCESS RESULTS
    // -----------------------------------

    const processed = colleges.map(
      (college) => {

        const chance =
          getChanceLevel(
            score,
            college.closingScore
          );

        const difference =
          Number(
            (
              score -
              college.closingScore
            ).toFixed(2)
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

          cutoff:
            Number(
              college.closingScore.toFixed(2)
            ),

          difference,

          eligible:
            score >=
            college.closingScore,

          chance

        };

      }
    );

    // -----------------------------------
    // SORT RESULTS
    // -----------------------------------

    processed.sort((a, b) => {

      // Eligible colleges first
      if (
        a.eligible &&
        !b.eligible
      ) return -1;

      if (
        !a.eligible &&
        b.eligible
      ) return 1;

      // Then closest cutoff
      return (
        Math.abs(a.difference) -
        Math.abs(b.difference)
      );

    });

    // -----------------------------------
    // SPLIT RESULTS
    // -----------------------------------

    const dream = [];
    const target = [];
    const safe = [];

    processed.forEach((college) => {

      if (
        college.chance.label === "LOW"
      ) {
        dream.push(college);
      }

      else if (
        college.chance.label === "MEDIUM"
      ) {
        target.push(college);
      }

      else {
        safe.push(college);
      }

    });

    // -----------------------------------
    // RESPONSE
    // -----------------------------------

    return res.status(200).json({

      success: true,

      filters: {
        score,
        category,
        stream,
        course
      },

      totalResults:
        processed.length,

      breakdown: {
        safe: safe.length,
        target: target.length,
        dream: dream.length
      },

      recommendations: {

        safe:
          safe.slice(0, limit),

        target:
          target.slice(0, limit),

        dream:
          dream.slice(0, limit)

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