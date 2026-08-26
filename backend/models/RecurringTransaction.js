const mongoose = require("mongoose");

const RecurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["income", "expense"], required: true },
    // "source" for income, "category" for expense — kept as one field so
    // the same model/UI can drive both.
    title: { type: String, required: true },
    icon: { type: String, default: "" },
    amount: { type: Number, required: true },
    frequency: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    startDate: { type: Date, required: true },
    nextRunDate: { type: Date, required: true },
    lastRunDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecurringTransaction", RecurringTransactionSchema);
