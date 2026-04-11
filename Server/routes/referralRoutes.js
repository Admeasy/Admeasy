const express = require("express");
const router = express.Router();
const {
  getMyReferralCode,
  validateReferralCode,
  getReferralStats,
  dismissFirstCoinPopup,
} = require("../controllers/referralController");
const { authenticateRequired } = require("../middleware/combinedAuth");

// ── PUBLIC (no auth) ──────────────────────────────────
// Called by signup form on blur to validate a referral code
router.post("/validate", validateReferralCode);

// ── PROTECTED (auth required) ─────────────────────────
router.get("/my-code", authenticateRequired, getMyReferralCode);
router.get("/stats", authenticateRequired, getReferralStats);
router.post("/dismiss-popup", authenticateRequired, dismissFirstCoinPopup);

module.exports = router;
