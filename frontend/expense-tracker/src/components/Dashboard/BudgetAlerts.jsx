import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuTriangleAlert } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ProgressBar from "../ProgressBar";
import { addThousandsSeparator } from "../../utils/helper";

const BudgetAlerts = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.BUDGET.GET_STATUS);
        setBudgets(response.data || []);
      } catch (error) {
        console.error("Error fetching budget status:", error);
      }
    };
    fetchBudgets();
  }, []);

  const overBudget = budgets.filter((b) => b.status === "over");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Budgets</h5>
        <button className="card-btn" onClick={() => navigate("/budgets")}>
          Manage <LuArrowRight className="text-base" />
        </button>
      </div>

      {overBudget.length > 0 && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-lg p-3 mt-4">
          <LuTriangleAlert className="text-base shrink-0 mt-0.5" />
          <span>
            You're over budget in {overBudget.length}{" "}
            {overBudget.length === 1 ? "category" : "categories"}:{" "}
            {overBudget.map((b) => b.category).join(", ")}
          </span>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {budgets.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No budgets set yet.{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => navigate("/budgets")}
            >
              Set one up
            </button>{" "}
            to get warnings before you overspend.
          </p>
        )}

        {budgets.slice(0, 4).map((budget) => (
          <div key={budget._id}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {budget.icon} {budget.category}
              </span>
              <span
                className={
                  budget.status === "over"
                    ? "text-red-500 dark:text-red-400"
                    : budget.status === "warning"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-400 dark:text-gray-500"
                }
              >
                ${addThousandsSeparator(budget.spent)} / $
                {addThousandsSeparator(budget.monthlyLimit)}
              </span>
            </div>
            <ProgressBar percent={budget.percentUsed} status={budget.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetAlerts;
