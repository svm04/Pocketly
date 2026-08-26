import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import CustomTooltip from "./CustomTooltip";

const CustomPieChart = ({ data, colors, label, totalAmount, showTextAnchor = true }) => {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={80}
            labelLine={false}
          >
            {data?.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {showTextAnchor && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">${totalAmount}</p>
        </div>
      )}
    </div>
  );
};

export default CustomPieChart;
