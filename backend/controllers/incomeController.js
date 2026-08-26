const xlsx = require("xlsx");
const Income = require("../models/Income");

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

//get all income sources (paginated)
exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [incomes, totalCount] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
      Income.countDocuments({ userId }),
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
