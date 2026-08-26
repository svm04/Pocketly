import React from "react";
import CustomPieChart from "../Charts/CustomPieChart";

const PALETTE = [
  "#875cf5", "#fa2c37", "#fF6900", "#4f39f6", "#00b8db",
  "#10b981", "#ec4899", "#eab308", "#6366f1", "#14b8a6",
];

// A period-aware breakdown pie for the Dashboard — expense by category, or
// income by source — for whichever month/year is currently selected.
// `items` is [{ label, total }], already sorted by the backend.
const BreakdownCard = ({ title, items = [], emptyMessage }) => {
  const data = items.map((item) => ({ name: item.label, amount: item.total }));
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">{title}</h5>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">{emptyMessage}</p>
      ) : (
        <CustomPieChart
          data={data}
          label="Total"
          totalAmount={total}
          colors={PALETTE}
          showTextAnchor
        />
      )}
    </div>
  );
};

export default BreakdownCard;
