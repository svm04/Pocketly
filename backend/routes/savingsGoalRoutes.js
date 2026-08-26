const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  addGoal,
  getAllGoals,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} = require("../controllers/savingsGoalController");

const router = express.Router();

router.post("/add", protect, addGoal);
router.get("/get", protect, getAllGoals);
router.put("/:id", protect, updateGoal);
router.put("/:id/contribute", protect, contributeToGoal);
router.delete("/:id", protect, deleteGoal);

module.exports = router;
