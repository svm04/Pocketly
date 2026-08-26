const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types } = require("mongoose");

// Builds a Mongo date filter for the dashboard's totals from
// ?period=month|year (+ month/year). No/unrecognized period -> {}, i.e.
// the original all-time behaviour, so existing callers are unaffected.
const buildPeriodFilter = (req) => {
  const { period } = req.query;
  if (period !== "month" && period !== "year") {
    return { filter: {}, label: "all-time" };
  }

  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();

  if (period === "month") {
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    return {
      filter: { date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } },
      label: "month",
    };
  }

  return {
    filter: { date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } },
    label: "year",
  };
};

//get dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));
    const { filter: periodFilter, label: period } = buildPeriodFilter(req);

    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId, ...periodFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    console.log("total Income", {
      totalIncome,
      userId: isValidObjectId(userId),
    });
    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId, ...periodFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Breakdown by category/source, scoped to the same selected period —
    // this is the real "where did it go / where did it come from" analysis
    // for the Dashboard, replacing the old fixed last-30/60-day widgets.
    // Grouped case-insensitively so "Groceries" and "groceries" (entered
    // before the category picker existed) land in the same slice instead
    // of splitting the pie; $first just picks one casing to display.
    const expenseByCategory = await Expense.aggregate([
      { $match: { userId: userObjectId, ...periodFilter } },
      {
        $group: {
          _id: { $toLower: "$category" },
          category: { $first: "$category" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const incomeBySource = await Income.aggregate([
      { $match: { userId: userObjectId, ...periodFilter } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    //Fetch last 5 transactions (income and expense)
    const incomeTransactions = await Income.find({ userId })
      .sort({ date: -1 })
      .limit(5);
    const expenseTransactions = await Expense.find({ userId })
      .sort({ date: -1 })
      .limit(5);

    const lastTransactions = [
      ...incomeTransactions.map((txn) => ({
        ...txn.toObject(),
        type: "income",
      })),
      ...expenseTransactions.map((txn) => ({
        ...txn.toObject(),
        type: "expense",
      })),
    ].sort((a, b) => b.date - a.date); //sort latest first

    //Final response
    res.json({
      period,
      totalBalance:
        (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total || 0,
      expenseByCategory: expenseByCategory.map((c) => ({
        category: c.category || "Uncategorized",
        total: c.total,
      })),
      incomeBySource: incomeBySource.map((s) => ({
        source: s._id || "Unspecified",
        total: s.total,
      })),
      recentTransactions: lastTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
