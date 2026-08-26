const express = require("express");

const {
  addExpense,
  updateExpense,
  getAllExpense,
  getExpenseMonthlySummary,
  getExpenseCategories,
  deleteExpense,
  downloadExpenseExcel,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/get", protect, getAllExpense);
router.get("/monthly-summary", protect, getExpenseMonthlySummary);
router.get("/categories", protect, getExpenseCategories);
router.get("/downloadexcel", protect, downloadExpenseExcel);
router.put("/:id", protect, updateExpense);
router.delete("/:id", protect, deleteExpense);

module.exports = router;
