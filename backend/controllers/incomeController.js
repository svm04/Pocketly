const xlsx = require("xlsx");
const { Types } = require("mongoose");
const Income = require("../models/Income");

// Builds a Mongo date filter from optional ?year=&month= query params.
// No year -> {} (all-time, unchanged legacy behaviour). Year only -> that
// whole calendar year. Year + month -> just that month.
const buildDateFilter = (req) => {
  const year = parseInt(req.query.year, 10);
  if (!year) return {};

  const month = parseInt(req.query.month, 10);
  if (month >= 1 && month <= 12) {
    return { date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } };
  }
  return { date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } };
};

//add income source
exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    //validation: missing fields
    if (!source || !amount || !date) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: new Date(date),
    });
    await newIncome.save();
    res.status(200).json(newIncome);
  } catch (error) {
    console.error("Add Income Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//update an existing income source
exports.updateIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.findOne({ _id: req.params.id, userId });
    if (!income) {
      return res.status(404).json({ message: "Income not found" });
    }

    const { icon, source, amount, date } = req.body;

    if (!source || !amount || !date) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    income.icon = icon;
    income.source = source;
    income.amount = amount;
    income.date = new Date(date);

    await income.save();
    res.status(200).json(income);
  } catch (error) {
    console.error("Update Income Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//get all income sources (paginated, optionally scoped to a month/year)
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const query = { userId, ...buildDateFilter(req) };

    const [incomes, totalCount] = await Promise.all([
      Income.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Income.countDocuments(query),
    ]);

    res.json({
      transactions: incomes,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get All Income Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};

// Per-month totals for a given year (Jan-Dec, zero-filled) — powers the
// Annual view's line chart without shipping every individual transaction.
exports.getIncomeMonthlySummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const results = await Income.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(String(userId)),
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: { $month: "$date" }, total: { $sum: "$amount" } } },
    ]);

    const totalsByMonth = results.reduce((acc, r) => {
      acc[r._id] = r.total;
      return acc;
    }, {});

    const summary = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: totalsByMonth[i + 1] || 0,
    }));

    res.json({ year, summary });
  } catch (error) {
    console.error("Get Income Monthly Summary Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//delete income source
exports.deleteIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    await Income.findOneAndDelete({ _id: req.params.id, userId });
    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Delete Income Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};

//download income as excel
exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const incomes = await Income.find({ userId }).sort({ date: -1 });

    //prepare excel data
    const data = incomes.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: item.date,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Incomes");

    // Write to an in-memory buffer rather than a fixed filename on disk —
    // a shared filename meant concurrent requests from different users
    // could race and one user could download another user's data.
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="income_details.xlsx"'
    );
    res.send(buffer);
  } catch (error) {
    console.error("Download Income Excel Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};
