import React from "react";
import { LuPencil, LuTrash2, LuTrendingDown, LuTrendingUp, LuUtensils } from "react-icons/lu";
import moment from "moment";

const TransactionInfoCard = ({
  icon,
  title,
  subtitle,
  date,
  amount,
  type,
  hideDeleteBtn,
  onDelete,
  onEdit,
}) => {
  const getAmountStyles = () =>
    type === "income"
      ? "bg-green-50 dark:bg-green-500/10 text-green-500 dark:text-green-400"
      : "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400";

  return (
    <div className="group relative flex items-center gap-4 mt-2 p-3 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-800/60">
      <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <LuUtensils />
        )}
      </div>

      <div className="flex-1 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {date ? moment(date).format("Do MMM YYYY") : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!hideDeleteBtn && onEdit && (
            <button
              type="button"
              className="text-gray-400 dark:text-gray-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={onEdit}
            >
              <LuPencil size={16} />
            </button>
          )}

          {!hideDeleteBtn && (
            <button
              type="button"
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={onDelete}
            >
              <LuTrash2 size={18} />
            </button>
          )}

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${getAmountStyles()}`}
          >
            <h6 className="text-xs font-medium">
              {type === "income" ? "+" : "-"}${amount}
            </h6>
            {type === "income" ? (
              <LuTrendingUp size={14} />
            ) : (
              <LuTrendingDown size={14} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionInfoCard;
