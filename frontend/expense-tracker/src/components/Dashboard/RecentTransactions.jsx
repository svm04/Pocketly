import React from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import TransactionInfoCard from "../Cards/TransactionInfoCard";

const RecentTransactions = ({ transactions }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Recent Transactions</h5>

        <button className="card-btn" onClick={() => navigate("/transactions")}>
          See All <LuArrowRight className="text-base" />
        </button>
      </div>

      <div className="mt-6">
        {transactions?.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No transactions yet.</p>
        )}
        {transactions?.slice(0, 5)?.map((item) => (
          <TransactionInfoCard
            key={item._id}
            title={item.type === "income" ? item.source : item.category}
            icon={item.icon}
            date={item.date}
            amount={item.amount}
            type={item.type}
            hideDeleteBtn
          />
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
