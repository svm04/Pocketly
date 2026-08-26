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

    //Get income transactions in the last 60 days
    const last60DaysIncomeTransactions = await Income.find({
      userId,
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    //Get total income in the last 60 days
    const totalIncomeLast60Days = last60DaysIncomeTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    //Get expense transactions in the last 30 days
    const last30DaysExpenseTransactions = await Expense.find({
      userId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    //Get total expense in the last 30 days
    const totalExpenseLast30Days = last30DaysExpenseTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

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
      last30DaysExpenses: {
        total: totalExpenseLast30Days,
        transactions: last30DaysExpenseTransactions,
      },
      last60DaysIncome: {
        total: totalIncomeLast60Days,
        transactions: last60DaysIncomeTransactions,
      },
      recentTransactions: lastTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
