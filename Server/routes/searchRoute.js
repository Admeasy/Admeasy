const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/searchController");
const { authenticateOptional } = require('../middleware/combinedAuth');

const apiCache = require('../middleware/apiCache');

router.get("/search", authenticateOptional, apiCache(600), globalSearch);

module.exports = router;
