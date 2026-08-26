import React from "react";
import { addThousandsSeparator } from "../../utils/helper";

const InfoCard = ({ icon, label, value, color }) => {
  return (
    <div className="flex gap-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50">
      <div
        className={`w-14 h-14 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}
      >
        {icon}
      </div>

      <div>
        <h6 className="text-sm text-gray-500 dark:text-gray-500 mb-1">{label}</h6>
        <span className="text-[22px] font-semibold dark:text-gray-100">
          ${addThousandsSeparator(value)}
        </span>
      </div>
    </div>
  );
};

export default InfoCard;
