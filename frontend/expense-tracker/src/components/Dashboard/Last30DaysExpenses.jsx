import React, { useMemo } from "react";
import CustomBarChart from "../Charts/CustomBarChart";
import { prepareExpenseBarChartData } from "../../utils/helper";

const Last30DaysExpenses = ({ transactions }) => {
  const chartData = useMemo(
    () => prepareExpenseBarChartData(transactions),
    [transactions]
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Last 30 Days Expenses</h5>
      </div>

      <CustomBarChart data={chartData} />
    </div>
  );
};

export default Last30DaysExpenses;
