import React from "react";
import { LuDownload } from "react-icons/lu";
import TransactionInfoCard from "../Cards/TransactionInfoCard";
import Pagination from "../Pagination";

const IncomeList = ({
  transactions,
  onDelete,
  onEdit,
  onDownload,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Income Sources</h5>

        <button className="card-btn" onClick={onDownload}>
          <LuDownload className="text-base" /> Download
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-6">
        {transactions?.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 col-span-2">
            No income added yet.
          </p>
        )}
        {transactions?.map((income) => (
          <TransactionInfoCard
            key={income._id}
            title={income.source}
            icon={income.icon}
            date={income.date}
            amount={income.amount}
            type="income"
            onDelete={() => onDelete(income._id)}
            onEdit={() => onEdit(income)}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default IncomeList;
