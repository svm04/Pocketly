import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ExpenseOverview from "../../components/Expense/ExpenseOverview";
import Modal from "../../components/Modal";
import AddExpenseForm from "../../components/Expense/AddExpenseForm";
import ExpenseList from "../../components/Expense/ExpenseList";
import DeleteAlert from "../../components/DeleteAlert";
import PeriodSelector from "../../components/PeriodSelector";

const Expense = () => {
  useUserAuth();

  const now = new Date();
  const [period, setPeriod] = useState({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [expenseData, setExpenseData] = useState([]);
  const [chartTransactions, setChartTransactions] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    show: false,
    id: null,
  });
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Shared year (+ month, when in Monthly mode) + category filter query
  // params for whichever period/category is currently selected. Doesn't
  // apply to the Annual chart's monthly-summary fetch below, which
  // aggregates across every category by design.
  const periodParams = () => {
    const params = new URLSearchParams();
    params.set("year", period.year);
    if (period.mode === "month") params.set("month", period.month);
    if (categoryFilter) params.set("category", categoryFilter);
    return params;
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.EXPENSE.GET_CATEGORIES);
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchExpenseDetails = async (page = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = periodParams();
      params.set("page", page);
      params.set("limit", 10);
      const response = await axiosInstance.get(
        `${API_PATHS.EXPENSE.GET_ALL_EXPENSE}?${params.toString()}`
      );
      if (response.data) {
        setExpenseData(response.data.transactions || []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
        });
      }
    } catch (error) {
      console.error("Something went wrong while fetching expense details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Monthly view: fetch this month's transactions for the per-day bar
  // chart. Annual view: fetch the year's 12-month totals instead.
  const fetchChartData = async () => {
    try {
      if (period.mode === "year") {
        const response = await axiosInstance.get(
          `${API_PATHS.EXPENSE.MONTHLY_SUMMARY}?year=${period.year}`
        );
        setMonthlySummary(response.data?.summary || []);
      } else {
        const params = periodParams();
        params.set("page", 1);
        params.set("limit", 100);
        const response = await axiosInstance.get(
          `${API_PATHS.EXPENSE.GET_ALL_EXPENSE}?${params.toString()}`
        );
        setChartTransactions(response.data?.transactions || []);
      }
    } catch (error) {
      console.error("Something went wrong while fetching expense chart data:", error);
    }
  };

  const closeModal = () => {
    setOpenAddExpenseModal(false);
    setEditingExpense(null);
  };

  const handleAddExpense = async (expense) => {
    const { category, description, amount, date, icon } = expense;

    if (!category.trim()) {
      toast.error("Category is required.");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error("Amount should be a valid number greater than 0.");
      return;
    }
    if (!date) {
      toast.error("Date is required.");
      return;
    }

    try {
      if (editingExpense?._id) {
        await axiosInstance.put(API_PATHS.EXPENSE.UPDATE_EXPENSE(editingExpense._id), {
          category,
          description,
          amount,
          date,
          icon,
        });
        toast.success("Expense updated successfully");
      } else {
        await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, {
          category,
          description,
          amount,
          date,
          icon,
        });
        toast.success("Expense added successfully");
      }

      closeModal();
      fetchExpenseDetails(pagination.currentPage);
      fetchChartData();
      fetchCategories();
    } catch (error) {
      console.error(
        "Error saving expense:",
        error.response?.data?.message || error.message
      );
      toast.error(error.response?.data?.message || "Failed to save expense");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(id));
      setOpenDeleteAlert({ show: false, id: null });
      toast.success("Expense deleted successfully");
      fetchExpenseDetails(pagination.currentPage);
      fetchChartData();
    } catch (error) {
      console.error(
        "Error deleting expense:",
        error.response?.data?.message || error.message
      );
      toast.error("Failed to delete expense");
    }
  };

  const handleDownloadExpenseDetails = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.EXPENSE.DOWNLOAD_EXPENSE,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading expense details:", error);
      toast.error("Failed to download expense details. Please try again.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchCategories();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on period/category change
    fetchExpenseDetails(1);
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.mode, period.month, period.year, categoryFilter]);

  return (
    <DashboardLayout activeMenu="Expense">
      <div className="my-5 mx-auto space-y-6">
        <div className="flex items-center justify-end gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700/70 rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            <option value="">Show all categories</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.icon ? `${c.icon} ` : ""}
                {c.category}
              </option>
            ))}
          </select>

          <PeriodSelector
            mode={period.mode}
            month={period.month}
            year={period.year}
            onChange={setPeriod}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ExpenseOverview
            transactions={chartTransactions}
            monthlySummary={monthlySummary}
            period={period.mode}
            onAddExpense={() => {
              setEditingExpense(null);
              setOpenAddExpenseModal(true);
            }}
          />
        </div>

        <ExpenseList
          transactions={expenseData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, id })}
          onEdit={(expense) => {
            setEditingExpense(expense);
            setOpenAddExpenseModal(true);
          }}
          onDownload={handleDownloadExpenseDetails}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchExpenseDetails(page)}
        />

        <Modal
          isOpen={openAddExpenseModal}
          onClose={closeModal}
          title={editingExpense ? "Edit Expense" : "Add Expense"}
        >
          <AddExpenseForm onAddExpense={handleAddExpense} initialData={editingExpense} />
        </Modal>

        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => setOpenDeleteAlert({ show: false, id: null })}
          title="Delete Expense"
        >
          <DeleteAlert
            content="Are you sure you want to delete this expense?"
            onDelete={() => deleteExpense(openDeleteAlert.id)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
