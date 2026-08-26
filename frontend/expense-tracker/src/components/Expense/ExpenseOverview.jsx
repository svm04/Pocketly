import React, { useMemo, useState } from "react";
import { LuPlus, LuRepeat } from "react-icons/lu";
import CustomBarChart from "../Charts/CustomBarChart";
import {
  prepareExpenseBarChartData,
  prepareExpenseMonthlyChartData,
} from "../../utils/helper";
import RecurringManager from "../Recurring/RecurringManager";

// `period` is "month" (default) or "year". In month view the chart is
// per-transaction, same as always; in year view it switches to the
// 12-bars-per-year aggregate fed by `monthlySummary`.
const ExpenseOverview = ({ transactions, monthlySummary, period = "month", onAddExpense }) => {
  const [showRecurring, setShowRecurring] = useState(false);

  const chartData = useMemo(
    () =>
      period === "year"
        ? prepareExpenseMonthlyChartData(monthlySummary)
        : prepareExpenseBarChartData(transactions),
    [period, transactions, monthlySummary]
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h5 className="text-lg font-medium dark:text-gray-100">Expense Overview</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Track your spending trends over time and gain insights into where
            your money goes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="card-btn" onClick={() => setShowRecurring(true)}>
            <LuRepeat className="text-base" /> Recurring
          </button>
          <button className="btn-primary w-auto px-4" onClick={onAddExpense}>
            <span className="flex items-center gap-1">
              <LuPlus className="text-lg" /> Add Expense
            </span>
          </button>
        </div>
      </div>

      <div className="mt-10">
        <CustomBarChart data={chartData} />
      </div>

      <RecurringManager
        isOpen={showRecurring}
        onClose={() => setShowRecurring(false)}
        type="expense"
      />
    </div>
  );
};

export default ExpenseOverview;
