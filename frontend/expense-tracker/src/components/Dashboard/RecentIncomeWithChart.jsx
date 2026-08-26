import React, { useMemo } from "react";
import CustomPieChart from "../Charts/CustomPieChart";

const COLORS = ["#875cf5", "#fa2c37", "#fF6900", "#4f39f6", "#00b8db"];

const RecentIncomeWithChart = ({ data, totalIncome }) => {
  const chartData = useMemo(
    () =>
      (data || []).map((item) => ({
        name: item.source,
        amount: item.amount,
      })),
    [data]
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Last 60 Days Income</h5>
      </div>

      <CustomPieChart
        data={chartData}
        label="Total Income"
        totalAmount={`${totalIncome}`}
        colors={COLORS}
        showTextAnchor
      />
    </div>
  );
};

export default RecentIncomeWithChart;
