const { Types } = require("mongoose");
const ExcelJS = require("exceljs");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BRAND = "FF875CF5";
const BRAND_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
const HEADER_FONT = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
const CURRENCY_FMT = '"$"#,##0.00';
const PERCENT_FMT = "0.0%";
const GREEN = "FF15803D";
const RED = "FFDC2626";
const GRID_LINE = { style: "thin", color: { argb: "FFE5E7EB" } };
const BRAND_LINE = { style: "thin", color: { argb: BRAND } };
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const styleHeaderRow = (sheet, rowNumber = 1) => {
  const row = sheet.getRow(rowNumber);
  row.height = 20;
  row.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = BRAND_FILL;
    cell.alignment = { vertical: "middle" };
  });
};

// Builds one detailed sheet ("Income" or "Expenses"): every transaction
// with its date, weekday, icon and amount, a bold total row, and — the
// "detailed" part — a breakdown table underneath showing how much came
// from/went to each source/category, with counts and % of the total.
const buildTransactionSheet = (workbook, name, rows, labelKey, labelHeader) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Day", key: "day", width: 12 },
    { header: "Icon", key: "icon", width: 8 },
    { header: labelHeader, key: "label", width: 26 },
    { header: "Amount", key: "amount", width: 16 },
  ];
  styleHeaderRow(sheet);

  rows.forEach((r) => {
    const d = new Date(r.date);
    const row = sheet.addRow({
      date: d.toLocaleDateString(),
      day: WEEKDAYS[d.getDay()],
      icon: r.icon || "",
      label: r[labelKey],
      amount: r.amount,
    });
    row.getCell("icon").alignment = { horizontal: "center" };
    row.eachCell((cell) => {
      cell.border = { bottom: GRID_LINE };
    });
  });

  const totalRowIdx = rows.length + 2;
  sheet.getCell(`D${totalRowIdx}`).value = "Total";
  sheet.getCell(`D${totalRowIdx}`).font = { bold: true };
  sheet.getCell(`D${totalRowIdx}`).border = { top: BRAND_LINE };
  const totalCell = sheet.getCell(`E${totalRowIdx}`);
  totalCell.value =
    rows.length > 0 ? { formula: `SUM(E2:E${totalRowIdx - 1})` } : 0;
  totalCell.font = { bold: true };
  totalCell.border = { top: BRAND_LINE };

  sheet.getColumn("amount").numFmt = CURRENCY_FMT;
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // ---- Breakdown by source/category ----
  const breakdownTitleRow = totalRowIdx + 3;
  const breakdownHeaderRow = breakdownTitleRow + 1;

  sheet.getCell(`A${breakdownTitleRow}`).value = `Breakdown by ${labelHeader}`;
  sheet.getCell(`A${breakdownTitleRow}`).font = {
    bold: true,
    size: 12,
    color: { argb: BRAND },
  };

  ["A", "B", "C", "D"].forEach((col) => {
    sheet.getCell(`${col}${breakdownHeaderRow}`).border = { bottom: BRAND_LINE };
    sheet.getCell(`${col}${breakdownHeaderRow}`).font = { bold: true };
  });
  sheet.getCell(`A${breakdownHeaderRow}`).value = labelHeader;
  sheet.getCell(`B${breakdownHeaderRow}`).value = "Count";
  sheet.getCell(`C${breakdownHeaderRow}`).value = "Total";
  sheet.getCell(`D${breakdownHeaderRow}`).value = "% of Total";

  const totals = new Map();
  rows.forEach((r) => {
    const key = r[labelKey] || "Uncategorized";
    const existing = totals.get(key) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += r.amount;
    totals.set(key, existing);
  });
  const grandTotal = rows.reduce((sum, r) => sum + r.amount, 0);
  const sortedEntries = [...totals.entries()].sort((a, b) => b[1].total - a[1].total);

  sortedEntries.forEach(([label, stats], i) => {
    const r = breakdownHeaderRow + 1 + i;
    sheet.getCell(`A${r}`).value = label;
    sheet.getCell(`B${r}`).value = stats.count;
    sheet.getCell(`C${r}`).value = stats.total;
    sheet.getCell(`C${r}`).numFmt = CURRENCY_FMT;
    sheet.getCell(`D${r}`).value = grandTotal > 0 ? stats.total / grandTotal : 0;
    sheet.getCell(`D${r}`).numFmt = PERCENT_FMT;
  });

  if (sortedEntries.length === 0) {
    sheet.getCell(`A${breakdownHeaderRow + 1}`).value = "No records yet.";
    sheet.getCell(`A${breakdownHeaderRow + 1}`).font = {
      italic: true,
      color: { argb: "FF9CA3AF" },
    };
  }

  return sheet;
};

// Builds a full, nicely-formatted Excel workbook (Summary + Income +
// Expenses + a combined All Transactions sheet) and streams it straight to
// the response — no temp file on disk, so concurrent exports from
// different users can never collide.
exports.exportTransactionsExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId }).sort({ date: -1 }),
      Expense.find({ userId }).sort({ date: -1 }),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;
    const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
    const avgExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;

    const allDates = [...incomes, ...expenses].map((t) => new Date(t.date));
    const earliest = allDates.length
      ? new Date(Math.min(...allDates)).toLocaleDateString()
      : "—";
    const latest = allDates.length
      ? new Date(Math.max(...allDates)).toLocaleDateString()
      : "—";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Pocketly";
    workbook.created = new Date();

    // ---- Summary sheet ----
    const summary = workbook.addWorksheet("Summary");
    summary.columns = [
      { header: "Metric", key: "metric", width: 26 },
      { header: "Value", key: "amount", width: 22 },
    ];
    styleHeaderRow(summary);
    summary.addRow({ metric: "Total Income", amount: totalIncome });
    summary.addRow({ metric: "Total Expenses", amount: totalExpense });
    const balanceRow = summary.addRow({ metric: "Net Balance", amount: balance });
    balanceRow.font = { bold: true };
    balanceRow.getCell("amount").font = {
      bold: true,
      color: { argb: balance >= 0 ? GREEN : RED },
    };
    summary.addRow([]);
    summary.addRow({ metric: "Income Entries", amount: incomes.length });
    summary.addRow({ metric: "Expense Entries", amount: expenses.length });
    summary.addRow({ metric: "Average Income / Entry", amount: avgIncome });
    summary.addRow({ metric: "Average Expense / Entry", amount: avgExpense });
    summary.addRow([]);
    summary.addRow({ metric: "Earliest Transaction", amount: earliest });
    summary.addRow({ metric: "Latest Transaction", amount: latest });
    summary.addRow({ metric: "Report Generated", amount: new Date().toLocaleString() });

    // Currency formatting only applies visually to numeric cells — the
    // date/count/text rows above just render as plain values, so it's
    // safe to set this on the whole column.
    summary.getColumn("amount").numFmt = CURRENCY_FMT;
    summary.eachRow((row, i) => {
      if (i > 1) row.getCell("metric").font = { bold: true };
    });

    buildTransactionSheet(workbook, "Income", incomes, "source", "Source");
    buildTransactionSheet(workbook, "Expenses", expenses, "category", "Category");

    // ---- Combined, chronological sheet with a running balance ----
    // Compute the running balance in ascending date order (how the balance
    // actually accrued over time), then flip to newest-first for display.
    const chronological = [
      ...incomes.map((i) => ({
        date: i.date,
        icon: i.icon,
        label: i.source,
        type: "Income",
        amount: i.amount,
      })),
      ...expenses.map((e) => ({
        date: e.date,
        icon: e.icon,
        label: e.category,
        type: "Expense",
        amount: -e.amount,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const withBalance = chronological.map((t) => {
      runningBalance += t.amount;
      return { ...t, balance: runningBalance };
    });
    const allTxns = [...withBalance].sort((a, b) => new Date(b.date) - new Date(a.date));

    const allSheet = workbook.addWorksheet("All Transactions");
    allSheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Type", key: "type", width: 12 },
      { header: "Icon", key: "icon", width: 8 },
      { header: "Description", key: "label", width: 26 },
      { header: "Amount", key: "amount", width: 16 },
      { header: "Balance", key: "balance", width: 16 },
    ];
    styleHeaderRow(allSheet);
    allTxns.forEach((t) => {
      const row = allSheet.addRow({
        date: new Date(t.date).toLocaleDateString(),
        type: t.type,
        icon: t.icon || "",
        label: t.label,
        amount: t.amount,
        balance: t.balance,
      });
      row.getCell("icon").alignment = { horizontal: "center" };
      row.getCell("amount").font = { color: { argb: t.amount >= 0 ? GREEN : RED } };
      row.eachCell((cell) => {
        cell.border = { bottom: GRID_LINE };
      });
    });
    allSheet.getColumn("amount").numFmt = CURRENCY_FMT;
    allSheet.getColumn("balance").numFmt = CURRENCY_FMT;
    allSheet.views = [{ state: "frozen", ySplit: 1 }];

    const filename = `Pocketly-Report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Transactions Excel Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Merges Income and Expense into one sorted, paginated feed via
// $unionWith — cheaper than fetching both collections in full and merging
// in JS, and keeps pagination correct across the combined set.
exports.getAllTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const typeFilter = ["income", "expense"].includes(req.query.type)
      ? req.query.type
      : null;

    const userObjectId = new Types.ObjectId(String(userId));

    const pipeline = [
      { $match: { userId: userObjectId } },
      { $addFields: { type: "expense", title: "$category" } },
      {
        $unionWith: {
          coll: Income.collection.name,
          pipeline: [
            { $match: { userId: userObjectId } },
            { $addFields: { type: "income", title: "$source" } },
          ],
        },
      },
    ];

    if (typeFilter) {
      pipeline.push({ $match: { type: typeFilter } });
    }

    pipeline.push(
      { $sort: { date: -1, _id: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const [result] = await Expense.aggregate(pipeline);
    const transactions = result?.data || [];
    const totalCount = result?.totalCount?.[0]?.count || 0;

    res.status(200).json({
      transactions,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get All Transactions Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ---- Monthly Report export ----
// Mirrors a typical "one sheet per month" manual budgeting spreadsheet: a
// Summary sheet with every month's income/expense/net for the year, plus
// one detailed sheet per month. Unlike a manual spreadsheet, each month
// sheet also gets a Budget vs Actual table, since Pocketly actually knows
// what was budgeted.

const buildYearSummarySheet = (workbook, year, monthlyTotals) => {
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Month", key: "month", width: 18 },
    { header: "Income", key: "income", width: 16 },
    { header: "Expense", key: "expense", width: 16 },
    { header: "Net Savings", key: "net", width: 16 },
  ];
  styleHeaderRow(sheet);

  monthlyTotals.forEach((m) => {
    const net = m.totalIncome - m.totalExpense;
    const row = sheet.addRow({
      month: `${MONTH_NAMES[m.month - 1]} ${year}`,
      income: m.totalIncome,
      expense: m.totalExpense,
      net,
    });
    row.getCell("net").font = { color: { argb: net >= 0 ? GREEN : RED } };
  });

  const totalIncome = monthlyTotals.reduce((s, m) => s + m.totalIncome, 0);
  const totalExpense = monthlyTotals.reduce((s, m) => s + m.totalExpense, 0);
  const totalRow = sheet.addRow({
    month: "Total",
    income: totalIncome,
    expense: totalExpense,
    net: totalIncome - totalExpense,
  });
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = { top: BRAND_LINE };
  });

  ["income", "expense", "net"].forEach((key) => {
    sheet.getColumn(key).numFmt = CURRENCY_FMT;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
};

// One sheet per month: an Expenses table, an Income table, and a Budget vs
// Actual table underneath (only if any budgets existed that month), each
// with its own total row.
const buildMonthReportSheet = (workbook, year, month, expenses, incomes, budgets) => {
  const sheet = workbook.addWorksheet(`${MONTH_NAMES[month - 1]} ${year}`);
  sheet.columns = [{ width: 14 }, { width: 10 }, { width: 26 }, { width: 16 }];

  let row = 1;
  const writeSectionHeader = (title) => {
    sheet.getCell(row, 1).value = title;
    sheet.getCell(row, 1).font = { bold: true, size: 13, color: { argb: BRAND } };
    row += 1;
  };
  const writeTableHeader = (headers) => {
    headers.forEach((h, i) => {
      const cell = sheet.getCell(row, i + 1);
      cell.value = h;
      cell.font = HEADER_FONT;
      cell.fill = BRAND_FILL;
    });
    row += 1;
  };
  const writeEmptyNote = (text) => {
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = { italic: true, color: { argb: "FF9CA3AF" } };
    row += 1;
  };

  // ---- Expenses ----
  writeSectionHeader("Expenses");
  writeTableHeader(["Date", "Icon", "Category", "Amount"]);
  expenses.forEach((e) => {
    sheet.getCell(row, 1).value = new Date(e.date).toLocaleDateString();
    sheet.getCell(row, 2).value = e.icon || "";
    sheet.getCell(row, 3).value = e.category;
    const amountCell = sheet.getCell(row, 4);
    amountCell.value = e.amount;
    amountCell.numFmt = CURRENCY_FMT;
    row += 1;
  });
  if (expenses.length === 0) writeEmptyNote("No expenses recorded.");
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  sheet.getCell(row, 3).value = "Total Expenses";
  sheet.getCell(row, 3).font = { bold: true };
  const totalExpenseCell = sheet.getCell(row, 4);
  totalExpenseCell.value = totalExpense;
  totalExpenseCell.numFmt = CURRENCY_FMT;
  totalExpenseCell.font = { bold: true };
  row += 2;

  // ---- Income ----
  writeSectionHeader("Income");
  writeTableHeader(["Date", "Icon", "Source", "Amount"]);
  incomes.forEach((i) => {
    sheet.getCell(row, 1).value = new Date(i.date).toLocaleDateString();
    sheet.getCell(row, 2).value = i.icon || "";
    sheet.getCell(row, 3).value = i.source;
    const amountCell = sheet.getCell(row, 4);
    amountCell.value = i.amount;
    amountCell.numFmt = CURRENCY_FMT;
    row += 1;
  });
  if (incomes.length === 0) writeEmptyNote("No income recorded.");
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  sheet.getCell(row, 3).value = "Total Income";
  sheet.getCell(row, 3).font = { bold: true };
  const totalIncomeCell = sheet.getCell(row, 4);
  totalIncomeCell.value = totalIncome;
  totalIncomeCell.numFmt = CURRENCY_FMT;
  totalIncomeCell.font = { bold: true };
  row += 1;

  const net = totalIncome - totalExpense;
  sheet.getCell(row, 3).value = "Net Savings";
  sheet.getCell(row, 3).font = { bold: true };
  const netCell = sheet.getCell(row, 4);
  netCell.value = net;
  netCell.numFmt = CURRENCY_FMT;
  netCell.font = { bold: true, color: { argb: net >= 0 ? GREEN : RED } };
  row += 2;

  // ---- Budget vs Actual ----
  if (budgets.length > 0) {
    writeSectionHeader("Budget vs Actual");
    writeTableHeader(["Category", "Budget", "Spent", "Status"]);
    const spendMap = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    budgets.forEach((b) => {
      const spent = spendMap[b.category] || 0;
      const percentUsed = b.monthlyLimit ? spent / b.monthlyLimit : 0;
      const status = percentUsed >= 1 ? "Over" : percentUsed >= 0.8 ? "Warning" : "OK";

      sheet.getCell(row, 1).value = b.category;
      const limitCell = sheet.getCell(row, 2);
      limitCell.value = b.monthlyLimit;
      limitCell.numFmt = CURRENCY_FMT;
      const spentCell = sheet.getCell(row, 3);
      spentCell.value = spent;
      spentCell.numFmt = CURRENCY_FMT;
      const statusCell = sheet.getCell(row, 4);
      statusCell.value = status;
      statusCell.font = {
        color: { argb: status === "Over" ? RED : status === "Warning" ? "FFCA8A04" : GREEN },
      };
      row += 1;
    });
  }

  return sheet;
};

// Streams a full-year workbook: Summary + one sheet per month (Jan-Dec,
// present even for months with no data yet, same as a template spreadsheet
// laid out for the whole year in advance).
exports.exportMonthlyReportExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const [allIncomes, allExpenses, allBudgets] = await Promise.all([
      Income.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: 1 }),
      Expense.find({ userId, date: { $gte: start, $lt: end } }).sort({ date: 1 }),
      Budget.find({ userId, year }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Pocketly";
    workbook.created = new Date();

    const monthlyTotals = [];
    const monthBreakdown = [];

    for (let month = 1; month <= 12; month++) {
      const monthIncomes = allIncomes.filter((i) => new Date(i.date).getMonth() + 1 === month);
      const monthExpenses = allExpenses.filter((e) => new Date(e.date).getMonth() + 1 === month);
      const monthBudgets = allBudgets.filter((b) => b.month === month);

      monthlyTotals.push({
        month,
        totalIncome: monthIncomes.reduce((s, i) => s + i.amount, 0),
        totalExpense: monthExpenses.reduce((s, e) => s + e.amount, 0),
      });
      monthBreakdown.push({ month, monthIncomes, monthExpenses, monthBudgets });
    }

    buildYearSummarySheet(workbook, year, monthlyTotals);
    monthBreakdown.forEach(({ month, monthIncomes, monthExpenses, monthBudgets }) => {
      buildMonthReportSheet(workbook, year, month, monthExpenses, monthIncomes, monthBudgets);
    });

    const filename = `Pocketly-Monthly-Report-${year}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Monthly Report Excel Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
