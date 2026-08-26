import React, { useContext } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { ThemeContext } from "../../context/themeContextValue";

const CustomBarChart = ({ data }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const getBarColor = (index) => (index % 2 === 0 ? "#875cf5" : "#cfbefb");
  const tickStyle = { fontSize: 12, fill: isDark ? "#a1a1aa" : "#555" };

  return (
    <div className="bg-white dark:bg-gray-900">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="none" />
          <XAxis dataKey="month" tick={tickStyle} stroke="none" />
          <YAxis tick={tickStyle} stroke="none" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
            {data?.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;
