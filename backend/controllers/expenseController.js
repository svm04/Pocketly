const xlsx = require("xlsx");
const Expense = require("../models/Expense");

//add expense source
exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    //validation: missing fields
    if (!category || !amount || !date) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category,
      amount,
      date: new Date(date),
    });
    await newExpense.save();
    res.status(200).json(newExpense);
  } catch (error) {
    console.error("Add Expense Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//update an existing expense
exports.updateExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const { icon, category, amount, date } = req.body;

    if (!category || !amount || !date) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    expense.icon = icon;
    expense.category = category;
    expense.amount = amount;
    expense.date = new Date(date);

    await expense.save();
    res.status(200).json(expense);
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//get all expense sources (paginated)
exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [expenses, totalCount] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit),
      Expense.countDocuments({ userId }),
    ]);

    res.json({
      transactions: expenses,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get All expense Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};

//delete expense source
exports.deleteExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    await Expense.findOneAndDelete({ _id: req.params.id, userId });
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Expense Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};

//download expense as excel
exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    //prepare excel data
    const data = expense.map((item) => ({
      Category: item.category,
      Amount: item.amount,
      Date: item.date,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "expense");

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
      'attachment; filename="expense_details.xlsx"'
    );
    res.send(buffer);
  } catch (error) {
    console.error("Download Expense Excel Error:", error); // ADD THIS LINE
    res.status(500).json({ message: "Server Error" });
  }
};
