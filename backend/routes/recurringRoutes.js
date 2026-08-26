const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addRecurring,
  getAllRecurring,
  toggleRecurring,
  deleteRecurring,
} = require("../controllers/recurringController");

const router = express.Router();

router.post("/add", protect, addRecurring);
router.get("/get", protect, getAllRecurring);
router.put("/:id/toggle", protect, toggleRecurring);
router.delete("/:id", protect, deleteRecurring);

module.exports = router;
