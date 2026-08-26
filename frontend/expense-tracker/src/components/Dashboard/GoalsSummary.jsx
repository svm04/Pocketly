import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuPiggyBank } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ProgressBar from "../ProgressBar";
import { addThousandsSeparator } from "../../utils/helper";

const GoalsSummary = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.GOALS.GET_ALL_GOALS);
        setGoals(response.data || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };
    fetchGoals();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex items-center justify-between">
        <h5 className="text-lg font-medium dark:text-gray-100">Savings Goals</h5>
        <button className="card-btn" onClick={() => navigate("/goals")}>
          Manage <LuArrowRight className="text-base" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {goals.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No savings goals yet.{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => navigate("/goals")}
            >
              Create one
            </button>{" "}
            to start tracking progress toward something.
          </p>
        )}

        {goals.slice(0, 4).map((goal) => (
          <div key={goal._id}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1">
                {goal.icon || <LuPiggyBank className="text-sm" />} {goal.name}
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                ${addThousandsSeparator(goal.currentAmount)} / $
                {addThousandsSeparator(goal.targetAmount)}
              </span>
            </div>
            <ProgressBar
              percent={goal.percentComplete}
              status={goal.percentComplete >= 100 ? "complete" : "ok"}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalsSummary;
