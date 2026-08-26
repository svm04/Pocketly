const { Types } = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const startOfCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

//create a budget for a category
exports.addBudget = async (req, res) => {
  const userId = req.user.id;

  try {
    const { category, icon, monthlyLimit } = req.body;

    if (!category || monthlyLimit === undefined || monthlyLimit === null) {
      return res
        .status(400)
        .json({ message: "Please provide a category and monthly limit" });
    }

    const existing = await Budget.findOne({ userId, category });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A budget for this category already exists" });
    }

    const budget = await Budget.create({ userId, category, icon, monthlyLimit });
    res.status(201).json(budget);
  } catch (error) {
    console.error("Add Budget Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

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

// Returns every budget for the user along with how much has been spent in
// that category so far this calendar month, and the percentage used.
exports.getBudgetStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const budgets = await Budget.find({ userId }).sort({ category: 1 });

    const spendByCategory = await Expense.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(String(userId)),
          date: { $gte: startOfCurrentMonth() },
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
