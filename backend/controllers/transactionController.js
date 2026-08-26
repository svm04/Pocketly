const { Types } = require("mongoose");
const ExcelJS = require("exceljs");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

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
