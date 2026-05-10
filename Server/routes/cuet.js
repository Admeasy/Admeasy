const express = require("express");

const router = express.Router();

const {
  predictCollege,
  getCourses
} = require("../controllers/cuet");

// Predict colleges
router.post(
  "/predict",
  predictCollege
);
router.get("/courses",getCourses)

module.exports = router;