const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    icon: { type: String, default: "" },
    category: { type: String, required: true },
    // Optional free-text note for this specific expense, e.g. "Dinner -
    // Uber Eats" filed under the "Food" category. Purely descriptive —
    // never used for grouping/matching, so it can't split a category into
    // near-duplicates the way an untrimmed/miscased category could.
    description: { type: String, default: "", trim: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
