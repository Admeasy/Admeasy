const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/searchController");

const apiCache = require('../middleware/apiCache');

router.get("/search", apiCache(600), globalSearch);

module.exports = router;
