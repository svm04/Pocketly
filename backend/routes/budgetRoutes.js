const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
} = require("../controllers/budgetController");

const router = express.Router();

router.post("/add", protect, addBudget);
router.get("/status", protect, getBudgetStatus);
router.put("/:id", protect, updateBudget);
router.delete("/:id", protect, deleteBudget);

module.exports = router;
