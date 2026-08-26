const { Types } = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

// One-time-per-boot startup migration. Budgets created before per-month
// history existed have no year/month and were protected by an old unique
// index on {userId, category} alone — that index would now incorrectly
// block a second budget for the same category in a different month, so it
// gets dropped (ignoring "already gone"), and any legacy documents are
// stamped with whichever month the server first boots into after this
// change. Mirrors the recurring-transactions startup catch-up pattern
// already used elsewhere in server.js.
exports.backfillLegacyBudgets = async () => {
  try {
    await Budget.collection.dropIndex("userId_1_category_1");
    console.log("[budget] Dropped legacy userId+category unique index");
  } catch (err) {
    if (err.codeName !== "IndexNotFound" && err.code !== 27) {
      console.error("[budget] Could not drop legacy index:", err.message);
    }
  }

  // Make sure the new {userId, category, year, month} unique index (from
  // the schema) actually exists before anything tries to rely on it.
  await Budget.createIndexes();

  const { year, month } = currentPeriod();
  const result = await Budget.updateMany(
    { $or: [{ year: { $exists: false } }, { month: { $exists: false } }] },
    { $set: { year, month } }
  );
  if (result.modifiedCount > 0) {
    console.log(
      `[budget] Backfilled ${result.modifiedCount} legacy budget(s) into ${year}-${month}`
    );
  }
};

//create a budget for a category, scoped to a specific month (defaults to
//the current month if year/month aren't provided)
exports.addBudget = async (req, res) => {
  const userId = req.user.id;

  try {
    const { category, icon, monthlyLimit } = req.body;
    const fallback = currentPeriod();
    const year = parseInt(req.body.year, 10) || fallback.year;
    const month = parseInt(req.body.month, 10) || fallback.month;

    if (!category || monthlyLimit === undefined || monthlyLimit === null) {
      return res
        .status(400)
        .json({ message: "Please provide a category and monthly limit" });
    }

    const existing = await Budget.findOne({ userId, category, year, month });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A budget for this category already exists for that month" });
    }

    const budget = await Budget.create({
      userId,
      category,
      icon,
      monthlyLimit,
      year,
      month,
    });
    res.status(201).json(budget);
  } catch (error) {
    console.error("Add Budget Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Category, icon and limit can be edited; year/month are intentionally not
// — a budget stays pinned to the month it was created for.
exports.updateBudget = async (req, res) => {
  const userId = req.user.id;

  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId });
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { category, icon, monthlyLimit } = req.body;
    if (category !== undefined) budget.category = category;
    if (icon !== undefined) budget.icon = icon;
    if (monthlyLimit !== undefined) budget.monthlyLimit = monthlyLimit;

    await budget.save();
    res.status(200).json(budget);
  } catch (error) {
    console.error("Update Budget Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteBudget = async (req, res) => {
  const userId = req.user.id;
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId });
    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Returns every budget for the given month (defaults to the current month)
// along with how much has been spent in that category during that same
// month, and the percentage used.
exports.getBudgetStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const fallback = currentPeriod();
    const year = parseInt(req.query.year, 10) || fallback.year;
    const month = parseInt(req.query.month, 10) || fallback.month;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const budgets = await Budget.find({ userId, year, month }).sort({ category: 1 });

    const spendByCategory = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(String(userId)),
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const spendMap = spendByCategory.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {});

    const result = budgets.map((budget) => {
      const spent = spendMap[budget.category] || 0;
      const percentUsed = budget.monthlyLimit
        ? Math.round((spent / budget.monthlyLimit) * 100)
        : 0;

      return {
        _id: budget._id,
        category: budget.category,
        icon: budget.icon,
        monthlyLimit: budget.monthlyLimit,
        year: budget.year,
        month: budget.month,
        spent,
        remaining: Math.max(budget.monthlyLimit - spent, 0),
        percentUsed,
        status:
          percentUsed >= 100 ? "over" : percentUsed >= 80 ? "warning" : "ok",
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Get Budget Status Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Copies every budget from one month into another, skipping any category
// that already has a budget in the target month (never overwrites). Lets
// you carry a month's limits forward instead of re-entering them by hand,
// and is what the upcoming "Start New Month" rollover will call too.
exports.copyBudgetsForward = async (req, res) => {
  const userId = req.user.id;
  try {
    const fromYear = parseInt(req.body.fromYear, 10);
    const fromMonth = parseInt(req.body.fromMonth, 10);
    const toYear = parseInt(req.body.toYear, 10);
    const toMonth = parseInt(req.body.toMonth, 10);

    if (!fromYear || !fromMonth || !toYear || !toMonth) {
      return res
        .status(400)
        .json({ message: "fromYear, fromMonth, toYear and toMonth are required" });
    }

    const sourceBudgets = await Budget.find({ userId, year: fromYear, month: fromMonth });
    if (sourceBudgets.length === 0) {
      return res.status(200).json({ created: [], skipped: [] });
    }

    const existingTarget = await Budget.find(
      { userId, year: toYear, month: toMonth },
      "category"
    );
    const existingCategories = new Set(existingTarget.map((b) => b.category));

    const toCreate = sourceBudgets
      .filter((b) => !existingCategories.has(b.category))
      .map((b) => ({
        userId,
        category: b.category,
        icon: b.icon,
        monthlyLimit: b.monthlyLimit,
        year: toYear,
        month: toMonth,
      }));

    const created = toCreate.length > 0 ? await Budget.insertMany(toCreate) : [];
    const skipped = sourceBudgets
      .filter((b) => existingCategories.has(b.category))
      .map((b) => b.category);

    res.status(201).json({ created, skipped });
  } catch (error) {
    console.error("Copy Budgets Forward Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
