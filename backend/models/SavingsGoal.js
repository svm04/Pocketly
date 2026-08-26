const mongoose = require("mongoose");

const SavingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    icon: { type: String, default: "" },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavingsGoal", SavingsGoalSchema);
