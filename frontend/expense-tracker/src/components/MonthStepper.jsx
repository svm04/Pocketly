import React from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// A simple prev/next month stepper — used where a Monthly/Annual toggle
// doesn't make sense (budgets are inherently monthly), just navigation
// between months. Can't step past the current month.
const MonthStepper = ({ month, year, onChange }) => {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const shift = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange({ month: m, year: y });
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400"
        onClick={() => shift(-1)}
        aria-label="Previous month"
      >
        <LuChevronLeft />
      </button>
      <span className="min-w-[110px] text-center font-medium dark:text-gray-100">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={() => shift(1)}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <LuChevronRight />
      </button>
    </div>
  );
};

export default MonthStepper;
