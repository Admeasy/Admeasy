const express = require("express");
const router = express.Router();
const {
  getWalletBalance,
  getTransactionHistory,
} = require("../controllers/walletController");
const { authenticateRequired } = require("../middleware/combinedAuth");

// All wallet routes require authentication
router.get("/balance", authenticateRequired, getWalletBalance);
router.get("/transactions", authenticateRequired, getTransactionHistory);

module.exports = router;
