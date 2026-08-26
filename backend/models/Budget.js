const mongoose = require("mongoose");

// One budget per user per category *per month* — each document is pinned
// to a specific year/month, so past months keep their own record of what
// the limit was and (via getBudgetStatus) how it played out. Older budgets
// created before this existed are backfilled into "the current month" once
// at server startup — see budgetController.backfillLegacyBudgets.
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
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", BudgetSchema);
