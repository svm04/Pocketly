import React, { useMemo, useState } from "react";
import { LuPlus, LuRepeat } from "react-icons/lu";
import CustomLineChart from "../Charts/CustomLineChart";
import { prepareIncomeLineChartData } from "../../utils/helper";
import RecurringManager from "../Recurring/RecurringManager";

const IncomeOverview = ({ transactions, onAddIncome }) => {
  const [showRecurring, setShowRecurring] = useState(false);

  const chartData = useMemo(
    () => prepareIncomeLineChartData(transactions),
    [transactions]
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h5 className="text-lg font-medium dark:text-gray-100">Income Overview</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Track your earnings over time and analyze your income trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="card-btn" onClick={() => setShowRecurring(true)}>
            <LuRepeat className="text-base" /> Recurring
          </button>
          <button className="btn-primary w-auto px-4" onClick={onAddIncome}>
            <span className="flex items-center gap-1">
              <LuPlus className="text-lg" /> Add Income
            </span>
          </button>
        </div>
      </div>

      <div className="mt-10">
        <CustomLineChart data={chartData} />
      </div>

      <RecurringManager
        isOpen={showRecurring}
        onClose={() => setShowRecurring(false)}
        type="income"
      />
    </div>
  );
};

export default IncomeOverview;
