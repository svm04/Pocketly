import React from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// A small, controlled Monthly/Annual toggle plus a prev/next stepper for the
// selected month or year. The parent owns the { mode, month, year } state
// and re-fetches data whenever onChange fires — this component is purely
// presentational. Stepping forward is disabled once you reach the current
// month/year, since there's never future data to look at.
const PeriodSelector = ({ mode, month, year, onChange }) => {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isCurrentYear = year === now.getFullYear();

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange({ mode, month: m, year: y });
  };

  const shiftYear = (delta) => {
    onChange({ mode, month, year: year + delta });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-1 text-sm">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            mode === "month"
              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => onChange({ mode: "month", month, year })}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            mode === "year"
              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => onChange({ mode: "year", month, year })}
        >
          Annual
        </button>
      </div>

      <div className="flex items-center gap-1 text-sm">
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400"
          onClick={() => (mode === "month" ? shiftMonth(-1) : shiftYear(-1))}
          aria-label="Previous"
        >
          <LuChevronLeft />
        </button>
        <span className="min-w-[110px] text-center font-medium dark:text-gray-100">
          {mode === "month" ? `${MONTH_NAMES[month - 1]} ${year}` : year}
        </span>
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => (mode === "month" ? shiftMonth(1) : shiftYear(1))}
          disabled={mode === "month" ? isCurrentMonth : isCurrentYear}
          aria-label="Next"
        >
          <LuChevronRight />
        </button>
      </div>
    </div>
  );
};

export default PeriodSelector;
