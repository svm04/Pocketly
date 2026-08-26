import React from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import TransactionInfoCard from "../Cards/TransactionInfoCard";

const ExpenseTransactions = ({ transactions }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Expenses</h5>

        <button className="card-btn" onClick={() => navigate("/expense")}>
          See All <LuArrowRight className="text-base" />
        </button>
      </div>

      <div className="mt-6">
        {transactions?.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No expenses in the last 30 days.</p>
        )}
        {transactions?.slice(0, 5)?.map((expense) => (
          <TransactionInfoCard
            key={expense._id}
            title={expense.category}
            icon={expense.icon}
            date={expense.date}
            amount={expense.amount}
            type="expense"
            hideDeleteBtn
          />
        ))}
      </div>
    </div>
  );
};

export default ExpenseTransactions;
