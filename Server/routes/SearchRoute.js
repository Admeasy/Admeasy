const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/searchController");

router.get("/search", globalSearch);

module.exports = router;
