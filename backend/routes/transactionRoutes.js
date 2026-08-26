const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAllTransactions,
  exportTransactionsExcel,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/get", protect, getAllTransactions);
router.get("/export/excel", protect, exportTransactionsExcel);

module.exports = router;
