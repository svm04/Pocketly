import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuPlus, LuPencil, LuTrash2, LuCopy } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/Modal";
import DeleteAlert from "../../components/DeleteAlert";
import ProgressBar from "../../components/ProgressBar";
import AddBudgetForm from "../../components/Budget/AddBudgetForm";
import MonthStepper from "../../components/MonthStepper";
import { addThousandsSeparator } from "../../utils/helper";

// The month immediately before { year, month }.
const previousMonth = ({ year, month }) =>
  month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

const Budgets = () => {
  useUserAuth();

  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  const [budgets, setBudgets] = useState([]);
  const [copying, setCopying] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: null });

  const fetchBudgets = async () => {
    try {
      const response = await axiosInstance.get(
        `${API_PATHS.BUDGET.GET_STATUS}?year=${period.year}&month=${period.month}`
      );
      setBudgets(response.data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingBudget(null);
  };

  const handleSaveBudget = async (budget) => {
    const { category, monthlyLimit, icon } = budget;

    if (!category.trim()) {
      toast.error("Category is required.");
      return;
    }
    if (!monthlyLimit || isNaN(monthlyLimit) || Number(monthlyLimit) <= 0) {
      toast.error("Monthly limit should be a valid number greater than 0.");
      return;
    }

    try {
      if (editingBudget?._id) {
        await axiosInstance.put(API_PATHS.BUDGET.UPDATE_BUDGET(editingBudget._id), {
          category,
          monthlyLimit,
          icon,
        });
        toast.success("Budget updated");
      } else {
        await axiosInstance.post(API_PATHS.BUDGET.ADD_BUDGET, {
          category,
          monthlyLimit,
          icon,
          year: period.year,
          month: period.month,
        });
        toast.success("Budget created");
      }
      closeModal();
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save budget");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.BUDGET.DELETE_BUDGET(id));
      toast.success("Budget deleted");
      setDeleteAlert({ show: false, id: null });
      fetchBudgets();
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  const handleCopyFromLastMonth = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const prev = previousMonth(period);
      const response = await axiosInstance.post(API_PATHS.BUDGET.COPY_FORWARD, {
        fromYear: prev.year,
        fromMonth: prev.month,
        toYear: period.year,
        toMonth: period.month,
      });
      const createdCount = response.data?.created?.length || 0;
      if (createdCount === 0) {
        toast.error("No budgets found in the previous month to copy.");
      } else {
        toast.success(`Copied ${createdCount} budget${createdCount === 1 ? "" : "s"} forward`);
      }
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to copy budgets");
    } finally {
      setCopying(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.month, period.year]);

  return (
    <DashboardLayout activeMenu="Budgets">
      <div className="my-5 mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h5 className="text-lg font-medium dark:text-gray-100">Monthly Budgets</h5>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Set a spending limit per category and track it against that
                month's expenses.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <MonthStepper month={period.month} year={period.year} onChange={setPeriod} />
              <button
                className="btn-primary w-auto px-4"
                onClick={() => {
                  setEditingBudget(null);
                  setOpenModal(true);
                }}
              >
                <span className="flex items-center gap-1">
                  <LuPlus className="text-lg" /> Add Budget
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {budgets.length === 0 && (
              <div className="col-span-2 text-sm text-gray-400 dark:text-gray-500">
                <p>No budgets set for this month yet.</p>
                <button
                  type="button"
                  className="card-btn mt-3"
                  onClick={handleCopyFromLastMonth}
                  disabled={copying}
                >
                  <LuCopy className="text-base" />
                  {copying ? "Copying..." : "Copy last month's budgets"}
                </button>
              </div>
            )}

            {budgets.map((budget) => (
              <div
                key={budget._id}
                className="group border border-gray-200/70 dark:border-gray-700/70 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800 rounded-full">
                      {budget.icon ? (
                        <span className="text-xl">{budget.icon}</span>
                      ) : (
                        "💰"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
                        {budget.category}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        ${addThousandsSeparator(budget.spent)} / $
                        {addThousandsSeparator(budget.monthlyLimit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-primary"
                      onClick={() => {
                        setEditingBudget(budget);
                        setOpenModal(true);
                      }}
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                      onClick={() => setDeleteAlert({ show: true, id: budget._id })}
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <ProgressBar percent={budget.percentUsed} status={budget.status} />

                <p
                  className={`text-xs mt-2 ${
                    budget.status === "over"
                      ? "text-red-500 dark:text-red-400"
                      : budget.status === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {budget.status === "over"
                    ? `Over budget by $${addThousandsSeparator(
                        budget.spent - budget.monthlyLimit
                      )}`
                    : `${budget.percentUsed}% used · $${addThousandsSeparator(
                        budget.remaining
                      )} left`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Modal
          isOpen={openModal}
          onClose={closeModal}
          title={editingBudget ? "Edit Budget" : "Add Budget"}
        >
          <AddBudgetForm onAddBudget={handleSaveBudget} initialData={editingBudget} />
        </Modal>

        <Modal
          isOpen={deleteAlert.show}
          onClose={() => setDeleteAlert({ show: false, id: null })}
          title="Delete Budget"
        >
          <DeleteAlert
            content="Are you sure you want to delete this budget?"
            onDelete={() => handleDelete(deleteAlert.id)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Budgets;
