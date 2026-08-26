const RecurringTransaction = require("../models/RecurringTransaction");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

const advanceDate = (date, frequency) => {
  const next = new Date(date);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // monthly (default) — setMonth handles month-length overflow safely
    // enough for this use case (e.g. 31st -> rolls into next month).
    next.setMonth(next.getMonth() + 1);
  }
  return next;
};

exports.addRecurring = async (req, res) => {
  const userId = req.user.id;

  try {
    const { type, title, icon, amount, frequency, startDate } = req.body;

    if (!type || !title || !amount || !startDate) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }
    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const rule = await RecurringTransaction.create({
      userId,
      type,
      title,
      icon,
      amount,
      frequency: frequency || "monthly",
      startDate: new Date(startDate),
      nextRunDate: new Date(startDate),
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("Add Recurring Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllRecurring = async (req, res) => {
  const userId = req.user.id;
  try {
    const rules = await RecurringTransaction.find({ userId }).sort({ nextRunDate: 1 });
    res.status(200).json(rules);
  } catch (error) {
    console.error("Get Recurring Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.toggleRecurring = async (req, res) => {
  const userId = req.user.id;
  try {
    const rule = await RecurringTransaction.findOne({ _id: req.params.id, userId });
    if (!rule) {
      return res.status(404).json({ message: "Recurring rule not found" });
    }
    rule.active = !rule.active;
    await rule.save();
    res.status(200).json(rule);
  } catch (error) {
    console.error("Toggle Recurring Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteRecurring = async (req, res) => {
  const userId = req.user.id;
  try {
    await RecurringTransaction.findOneAndDelete({ _id: req.params.id, userId });
    res.status(200).json({ message: "Recurring rule deleted" });
  } catch (error) {
    console.error("Delete Recurring Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Finds every active recurring rule whose nextRunDate has arrived, posts the
// actual Income/Expense record, and advances nextRunDate — catching all the
// way up to "now" for each rule (e.g. if the server was offline for a
// couple of months, it posts each missed occurrence rather than just one).
// Safe to call repeatedly (daily cron + on server startup).
const MAX_CATCHUP_PER_RULE = 500; // safety cap against a runaway loop

const processDueRecurring = async () => {
  const due = await RecurringTransaction.find({
    active: true,
    nextRunDate: { $lte: new Date() },
  });

  let processed = 0;

  for (const rule of due) {
    const Model = rule.type === "income" ? Income : Expense;
    let iterations = 0;

    while (rule.nextRunDate <= new Date() && iterations < MAX_CATCHUP_PER_RULE) {
      const payload = {
        userId: rule.userId,
        icon: rule.icon,
        amount: rule.amount,
        date: rule.nextRunDate,
      };
      if (rule.type === "income") {
        payload.source = rule.title;
      } else {
        payload.category = rule.title;
      }

      await Model.create(payload);

      rule.lastRunDate = rule.nextRunDate;
      rule.nextRunDate = advanceDate(rule.nextRunDate, rule.frequency);
      processed += 1;
      iterations += 1;
    }

    await rule.save();
  }

  if (processed > 0) {
    console.log(`[recurring] Posted ${processed} due recurring transaction(s).`);
  }

  return processed;
};

exports.processDueRecurring = processDueRecurring;
