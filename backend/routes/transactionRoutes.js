const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAllTransactions,
  exportTransactionsExcel,
  exportMonthlyReportExcel,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/get", protect, getAllTransactions);
router.get("/export/excel", protect, exportTransactionsExcel);
router.get("/export/monthly-report", protect, exportMonthlyReportExcel);

module.exports = router;
