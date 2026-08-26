const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  startNewMonth,
  getMonthlySummary,
} = require("../controllers/monthlyRolloverController");

const router = express.Router();

router.post("/start-new-month", protect, startNewMonth);
router.get("/summary", protect, getMonthlySummary);

module.exports = router;
