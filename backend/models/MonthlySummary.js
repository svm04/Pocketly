const mongoose = require("mongoose");

// A frozen snapshot of one user's month, written once "Start New Month" (or
// the automatic monthly catch-up) closes that month out. Kept separate from
// the live Income/Expense collections so historical months stay fast to
// read and stable even as new transactions keep landing in the current
// month — this is the permanent record of "how did that month actually go."
const MonthlySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    totalIncome: { type: Number, required: true, default: 0 },
    totalExpense: { type: Number, required: true, default: 0 },
    totalBalance: { type: Number, required: true, default: 0 },
    expenseByCategory: [
      {
        category: String,
        total: Number,
        _id: false,
      },
    ],
    incomeBySource: [
      {
        source: String,
        total: Number,
        _id: false,
      },
    ],
    budgets: [
      {
        category: String,
        monthlyLimit: Number,
        spent: Number,
        status: String,
        _id: false,
      },
    ],
    closedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MonthlySummarySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("MonthlySummary", MonthlySummarySchema);
