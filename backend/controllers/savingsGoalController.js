const SavingsGoal = require("../models/SavingsGoal");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.addGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    const { name, icon, targetAmount, targetDate } = req.body;

    if (!name || !targetAmount) {
      return res
        .status(400)
        .json({ message: "Please provide a name and target amount" });
    }

    const goal = await SavingsGoal.create({
      userId,
      name,
      icon,
      targetAmount,
      targetDate: targetDate || null,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error("Add Goal Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllGoals = async (req, res) => {
  const userId = req.user.id;
  try {
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    const withProgress = goals.map((goal) => {
      const percent = goal.targetAmount
        ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
        : 0;
      return { ...goal.toObject(), percentComplete: percent };
    });

    res.status(200).json(withProgress);
  } catch (error) {
    console.error("Get Goals Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const { name, icon, targetAmount, targetDate } = req.body;
    if (name !== undefined) goal.name = name;
    if (icon !== undefined) goal.icon = icon;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate;

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Adds (or removes, via a negative amount) a contribution to a goal.
// Money moved into savings is real money leaving your spendable balance, so
// a positive contribution also posts an Expense ("Savings: <goal>"), and a
// negative one (withdrawing savings back out) posts an Income — otherwise
// the dashboard totals would never reflect what actually happened to your
// balance.
exports.contributeToGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    const { amount } = req.body;
    if (amount === undefined || isNaN(amount) || Number(amount) === 0) {
      return res.status(400).json({ message: "Please provide a valid, non-zero amount" });
    }

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const numericAmount = Number(amount);
    const icon = goal.icon || "🐷";

    if (numericAmount > 0) {
      await Expense.create({
        userId,
        icon,
        category: `Savings: ${goal.name}`,
        amount: numericAmount,
        date: new Date(),
      });
    } else {
      await Income.create({
        userId,
        icon,
        source: `Savings: ${goal.name} (withdrawal)`,
        amount: Math.abs(numericAmount),
        date: new Date(),
      });
    }

    goal.currentAmount = Math.max(goal.currentAmount + numericAmount, 0);
    await goal.save();

    res.status(200).json(goal);
  } catch (error) {
    console.error("Contribute Goal Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId });
    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
