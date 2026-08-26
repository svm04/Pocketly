import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import IncomeOverview from "../../components/Income/IncomeOverview";
import Modal from "../../components/Modal";
import AddIncomeForm from "../../components/Income/AddIncomeForm";
import IncomeList from "../../components/Income/IncomeList";
import DeleteAlert from "../../components/DeleteAlert";
import PeriodSelector from "../../components/PeriodSelector";

const Income = () => {
  useUserAuth();

  const now = new Date();
  const [period, setPeriod] = useState({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [incomeData, setIncomeData] = useState([]);
  const [chartTransactions, setChartTransactions] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [openAddIncomeModal, setOpenAddIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({
    show: false,
    id: null,
  });

  // Shared year (+ month, when in Monthly mode) query params for whichever
  // period is currently selected.
  const periodParams = () => {
    const params = new URLSearchParams();
    params.set("year", period.year);
    if (period.mode === "month") params.set("month", period.month);
    return params;
  };

  const fetchIncomeDetails = async (page = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = periodParams();
      params.set("page", page);
      params.set("limit", 10);
      const response = await axiosInstance.get(
        `${API_PATHS.INCOME.GET_ALL_INCOME}?${params.toString()}`
      );
      if (response.data) {
        setIncomeData(response.data.transactions || []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
        });
      }
    } catch (error) {
      console.error("Something went wrong while fetching income details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Monthly view: fetch this month's transactions for the per-day trend
  // chart. Annual view: fetch the year's 12-month totals instead.
  const fetchChartData = async () => {
    try {
      if (period.mode === "year") {
        const response = await axiosInstance.get(
          `${API_PATHS.INCOME.MONTHLY_SUMMARY}?year=${period.year}`
        );
        setMonthlySummary(response.data?.summary || []);
      } else {
        const params = periodParams();
        params.set("page", 1);
        params.set("limit", 100);
        const response = await axiosInstance.get(
          `${API_PATHS.INCOME.GET_ALL_INCOME}?${params.toString()}`
        );
        setChartTransactions(response.data?.transactions || []);
      }
    } catch (error) {
      console.error("Something went wrong while fetching income chart data:", error);
    }
  };

  const closeModal = () => {
    setOpenAddIncomeModal(false);
    setEditingIncome(null);
  };

  const handleAddIncome = async (income) => {
    const { source, amount, date, icon } = income;

    if (!source.trim()) {
      toast.error("Source is required.");
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
      if (editingIncome?._id) {
        await axiosInstance.put(API_PATHS.INCOME.UPDATE_INCOME(editingIncome._id), {
          source,
          amount,
          date,
          icon,
        });
        toast.success("Income updated successfully");
      } else {
        await axiosInstance.post(API_PATHS.INCOME.ADD_INCOME, {
          source,
          amount,
          date,
          icon,
        });
        toast.success("Income added successfully");
      }

      closeModal();
      fetchIncomeDetails(pagination.currentPage);
      fetchChartData();
    } catch (error) {
      console.error(
        "Error saving income:",
        error.response?.data?.message || error.message
      );
      toast.error(error.response?.data?.message || "Failed to save income");
    }
  };

  const deleteIncome = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.INCOME.DELETE_INCOME(id));
      setOpenDeleteAlert({ show: false, id: null });
      toast.success("Income deleted successfully");
      fetchIncomeDetails(pagination.currentPage);
      fetchChartData();
    } catch (error) {
      console.error(
        "Error deleting income:",
        error.response?.data?.message || error.message
      );
      toast.error("Failed to delete income");
    }
  };

  const handleDownloadIncomeDetails = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.INCOME.DOWNLOAD_INCOME,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "income_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading income details:", error);
      toast.error("Failed to download income details. Please try again.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchIncomeDetails(1);
    fetchChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.mode, period.month, period.year]);

  return (
    <DashboardLayout activeMenu="Income">
      <div className="my-5 mx-auto space-y-6">
        <div className="flex items-center justify-end">
          <PeriodSelector
            mode={period.mode}
            month={period.month}
            year={period.year}
            onChange={setPeriod}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <IncomeOverview
            transactions={chartTransactions}
            monthlySummary={monthlySummary}
            period={period.mode}
            onAddIncome={() => {
              setEditingIncome(null);
              setOpenAddIncomeModal(true);
            }}
          />
        </div>

        <IncomeList
          transactions={incomeData}
          onDelete={(id) => setOpenDeleteAlert({ show: true, id })}
          onEdit={(income) => {
            setEditingIncome(income);
            setOpenAddIncomeModal(true);
          }}
          onDownload={handleDownloadIncomeDetails}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchIncomeDetails(page)}
        />

        <Modal
          isOpen={openAddIncomeModal}
          onClose={closeModal}
          title={editingIncome ? "Edit Income" : "Add Income"}
        >
          <AddIncomeForm onAddIncome={handleAddIncome} initialData={editingIncome} />
        </Modal>

        <Modal
          isOpen={openDeleteAlert.show}
          onClose={() => setOpenDeleteAlert({ show: false, id: null })}
          title="Delete Income"
        >
          <DeleteAlert
            content="Are you sure you want to delete this income source?"
            onDelete={() => deleteIncome(openDeleteAlert.id)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Income;
