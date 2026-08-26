const { Types } = require("mongoose");
const User = require("../models/User");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const MonthlySummary = require("../models/MonthlySummary");

const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const previousMonth = ({ year, month }) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

const nextMonth = ({ year, month }) =>
  month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

// Builds a frozen snapshot of one user's month: totals, category/source
// breakdown, and how each budget in that month performed — then copies
// that month's budgets forward into the next month (skipping any category
// that already has one there, never overwriting). Idempotent by default:
// if a snapshot already exists it's returned as-is. Pass force:true to
// recompute and overwrite it instead (used by the manual "Start New
// Month" action, so re-running it after adding a late transaction picks
// up the change).
const closeMonthForUser = async (userId, year, month, { force = false } = {}) => {
  if (!force) {
    const existing = await MonthlySummary.findOne({ userId, year, month });
    if (existing) return existing;
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const userObjectId = new Types.ObjectId(String(userId));

  const [incomeAgg, expenseAgg, expenseByCategory, incomeBySource, budgets] = await Promise.all([
    Income.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Income.aggregate([
      { $match: { userId: userObjectId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$source", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Budget.find({ userId, year, month }),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;

  const spendMap = expenseByCategory.reduce((acc, c) => {
    acc[c._id] = c.total;
    return acc;
  }, {});

  const budgetSnapshots = budgets.map((b) => {
    const spent = spendMap[b.category] || 0;
    const percentUsed = b.monthlyLimit ? Math.round((spent / b.monthlyLimit) * 100) : 0;
    return {
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      spent,
      status: percentUsed >= 100 ? "over" : percentUsed >= 80 ? "warning" : "ok",
    };
  });

  const snapshotFields = {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    expenseByCategory: expenseByCategory.map((c) => ({
      category: c._id || "Uncategorized",
      total: c.total,
    })),
    incomeBySource: incomeBySource.map((s) => ({
      source: s._id || "Unspecified",
      total: s.total,
    })),
    budgets: budgetSnapshots,
    closedAt: new Date(),
  };

  const summary = await MonthlySummary.findOneAndUpdate(
    { userId, year, month },
    { $set: snapshotFields, $setOnInsert: { userId, year, month } },
    { upsert: true, new: true }
  );

  // Carry this month's budgets forward into the next month — skip any
  // category that already has a budget there so a re-run (force) never
  // clobbers something the user has since edited.
  if (budgets.length > 0) {
    const { year: nYear, month: nMonth } = nextMonth({ year, month });
    const existingNext = await Budget.find({ userId, year: nYear, month: nMonth }, "category");
    const existingCats = new Set(existingNext.map((b) => b.category));
    const toCreate = budgets
      .filter((b) => !existingCats.has(b.category))
      .map((b) => ({
        userId,
        category: b.category,
        icon: b.icon,
        monthlyLimit: b.monthlyLimit,
        year: nYear,
        month: nMonth,
      }));
    if (toCreate.length > 0) {
      await Budget.insertMany(toCreate);
    }
  }

  return summary;
};

// Startup/daily-cron catch-up: for every user, walks backward from the most
// recently completed month closing any that don't have a snapshot yet,
// oldest-first (so each month's budget-copy-forward chains into the next
// correctly) — capped so a long-dormant account doesn't trigger an
// unbounded backfill on first boot after this feature ships.
const MAX_MONTHS_BACK = 6;

exports.catchUpMonthlyRollover = async () => {
  const users = await User.find({}, "_id");
  let closedCount = 0;

  for (const user of users) {
    let cursor = previousMonth(currentPeriod());
    const toClose = [];

    for (let i = 0; i < MAX_MONTHS_BACK; i++) {
      // eslint-disable-next-line no-await-in-loop -- small, bounded, sequential by design
      const existing = await MonthlySummary.findOne({
        userId: user._id,
        year: cursor.year,
        month: cursor.month,
      });
      if (existing) break; // already closed -> everything older is too
      toClose.unshift(cursor);
      cursor = previousMonth(cursor);
    }

    for (const period of toClose) {
      // eslint-disable-next-line no-await-in-loop -- must run oldest-first, in order
      await closeMonthForUser(user._id, period.year, period.month);
      closedCount += 1;
    }
  }

  if (closedCount > 0) {
    console.log(`[monthly-rollover] Closed ${closedCount} month(s) across all users`);
  }
};

// Manual "Start New Month" — closes (or re-closes, picking up anything
// added since) the CURRENT calendar month for the logged-in user, right
// now, even if the month isn't over yet, and copies its budgets forward.
exports.startNewMonth = async (req, res) => {
  const userId = req.user.id;
  try {
    const { year, month } = currentPeriod();
    const summary = await closeMonthForUser(userId, year, month, { force: true });
    res.status(200).json({ summary });
  } catch (error) {
    console.error("Start New Month Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Fetch one month's closed snapshot (defaults to the most recently
// completed month). Returns { summary: null } if that month hasn't been
// closed yet rather than a 404 — "not closed" is an expected state.
exports.getMonthlySummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const fallback = previousMonth(currentPeriod());
    const year = parseInt(req.query.year, 10) || fallback.year;
    const month = parseInt(req.query.month, 10) || fallback.month;

    const summary = await MonthlySummary.findOne({ userId, year, month });
    res.status(200).json({ summary: summary || null });
  } catch (error) {
    console.error("Get Monthly Summary Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
