const mongoose = require("mongoose");

// One budget per user per category — the limit applies every calendar
// month (spend-so-far is computed live from Expense docs, not stored here).
const BudgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true },
    icon: { type: String, default: "" },
    monthlyLimit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", BudgetSchema);
