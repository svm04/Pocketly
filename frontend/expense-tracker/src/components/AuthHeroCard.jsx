import React from "react";
import { LuWallet, LuTrendingUp, LuTrendingDown } from "react-icons/lu";

// Replaces the old stock photo on the auth screens with a small mocked-up
// "glass" preview of the app itself — a balance figure, a mini bar chart,
// and income/expense chips — so the hero panel actually looks like Pocketly
// instead of a generic finance stock image, and reads well in both themes.
const AuthHeroCard = () => {
  const bars = [40, 65, 50, 80, 60, 95, 70];

  return (
    <div className="w-64 lg:w-[85%] max-w-sm rounded-2xl absolute bottom-10 shadow-2xl shadow-purple-900/20 ring-1 ring-white/60 dark:ring-white/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-5 z-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shrink-0">
            <LuWallet className="text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Pocketly
          </span>
        </div>
        <span className="text-[10px] font-medium text-primary bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-full">
          This Month
        </span>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Total Balance</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        $4,285.00
      </p>

      <div className="flex items-end gap-1.5 h-16 mb-4">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t-md ${
              index % 2 === 0 ? "bg-primary" : "bg-violet-300 dark:bg-violet-500/40"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-green-50 dark:bg-green-500/10 rounded-lg px-3 py-2">
          <LuTrendingUp className="text-green-600 dark:text-green-400 text-base shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">
              $6,240
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          <LuTrendingDown className="text-red-600 dark:text-red-400 text-base shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              $1,955
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHeroCard;
