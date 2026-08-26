import React, { useContext } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { ThemeContext } from "../../context/themeContextValue";

const CustomLineChart = ({ data }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const tickStyle = { fontSize: 12, fill: isDark ? "#a1a1aa" : "#555" };

  return (
    <div className="bg-white dark:bg-gray-900">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="none" />
          <XAxis dataKey="month" tick={tickStyle} stroke="none" />
          <YAxis tick={tickStyle} stroke="none" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#875cf5"
            strokeWidth={3}
            dot={{ r: 3, fill: "#875cf5" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;
