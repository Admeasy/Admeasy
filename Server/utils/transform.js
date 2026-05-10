const fs = require("fs");
const path = require("path");

const rawData = require("./CutOff_UG_Round_One.json");

const CATEGORY_MAP = {
  UR: "GENERAL",
  OBC: "OBC",
  SC: "SC",
  ST: "ST",
  EWS: "EWS",
  PwBD: "PWBD"
};

const normalizeCourse = (course) => {

  return course
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*Hons\.?\s*\)/gi, " (Hons.)")
    .replace(/\s*\(\s*Prog\.?\s*\)/gi, " (Prog.)")
    .trim();

};

const detectStream = (course) => {

  const lower = course.toLowerCase();

  if (
    lower.includes("b.sc") ||
    lower.includes("physics") ||
    lower.includes("chemistry") ||
    lower.includes("mathematics") ||
    lower.includes("computer")
  ) {
    return "Science";
  }

  if (
    lower.includes("b.com") ||
    lower.includes("economics") ||
    lower.includes("business") ||
    lower.includes("management")
  ) {
    return "Commerce";
  }

  return "Arts";

};

const transformed = [];

rawData.forEach((item) => {

  const course = normalizeCourse(
    item["PROGRAM NAME"]
  );

  const stream = detectStream(course);

  Object.entries(CATEGORY_MAP).forEach(([key, value]) => {

    const cutoff = item[key];

    // Skip null values
    if (
      cutoff === null ||
      cutoff === undefined ||
      cutoff === ""
    ) {
      return;
    }

    transformed.push({

      year: 2025,

      university: "Delhi University",

      collegeName:
        item["COLLEGE NAME"].trim(),

      course,

      category: value,

      stream,

      round: 1,

      closingScore: Number(cutoff),

      source: {
        type: "official"
      }

    });

  });

});

const outputPath = path.join(
  __dirname,
  "transformed.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(transformed, null, 2)
);

console.log(
  `DONE: ${transformed.length} records generated`
);