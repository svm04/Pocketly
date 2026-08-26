import React, { useEffect, useState } from "react";
import { LuCalendarCheck } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Shows the most recently *closed* month's snapshot (via "Start New Month"
// or the automatic monthly catch-up). Renders nothing until a month has
// actually been closed — there's nothing to recap yet on a fresh account.
const LastMonthRecap = ({ refreshKey }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.MONTHLY_ROLLOVER.GET_SUMMARY);
        setSummary(response.data?.summary || null);
      } catch (error) {
        console.error("Error fetching last month's recap:", error);
      }
    };
    fetchSummary();
  }, [refreshKey]);

  if (!summary) return null;

  const label = `${MONTH_NAMES[summary.month - 1]} ${summary.year}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
      <div className="flex items-center gap-2">
        <LuCalendarCheck className="text-primary text-lg" />
        <h5 className="text-lg font-medium dark:text-gray-100">{label} Recap</h5>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Income</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            ${addThousandsSeparator(summary.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Expense</p>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            ${addThousandsSeparator(summary.totalExpense)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Balance</p>
          <p
            className={`font-medium ${
              summary.totalBalance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            ${addThousandsSeparator(summary.totalBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LastMonthRecap;
