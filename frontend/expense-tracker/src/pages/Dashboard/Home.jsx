import React, { useEffect, useState } from "react";
import {
  LuHandCoins,
  LuWalletMinimal,
  LuFileSpreadsheet,
  LuCalendarPlus,
  LuCalendarRange,
} from "react-icons/lu";
import { IoMdCard } from "react-icons/io";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { downloadBlob } from "../../utils/downloadFile";
import InfoCard from "../../components/Cards/InfoCard";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import BreakdownCard from "../../components/Dashboard/BreakdownCard";
import LastMonthRecap from "../../components/Dashboard/LastMonthRecap";
import BudgetAlerts from "../../components/Dashboard/BudgetAlerts";
import GoalsSummary from "../../components/Dashboard/GoalsSummary";
import PeriodSelector from "../../components/PeriodSelector";
import Modal from "../../components/Modal";
import ConfirmAlert from "../../components/ConfirmAlert";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Home = () => {
  useUserAuth();

  const now = new Date();
  const [period, setPeriod] = useState({
    mode: "month",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingMonthly, setExportingMonthly] = useState(false);
  const [showStartMonthConfirm, setShowStartMonthConfirm] = useState(false);
  const [startingMonth, setStartingMonth] = useState(false);
  const [recapRefreshKey, setRecapRefreshKey] = useState(0);

  const handleExportReport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await axiosInstance.get(API_PATHS.TRANSACTIONS.EXPORT_EXCEL, {
        responseType: "blob",
      });
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(response.data, `Pocketly-Report-${today}.xlsx`);
      toast.success("Report downloaded");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Downloads the year-long, one-sheet-per-month budgeting workbook for
  // whichever year is currently selected (falls back to this year when
  // viewing in Monthly mode within the current year).
  const handleExportMonthlyReport = async () => {
    if (exportingMonthly) return;
    setExportingMonthly(true);
    try {
      const response = await axiosInstance.get(
        `${API_PATHS.TRANSACTIONS.EXPORT_MONTHLY_REPORT}?year=${period.year}`,
        { responseType: "blob" }
      );
      downloadBlob(response.data, `Pocketly-Monthly-Report-${period.year}.xlsx`);
      toast.success("Monthly report downloaded");
    } catch (error) {
      console.error("Error exporting monthly report:", error);
      toast.error("Failed to export monthly report. Please try again.");
    } finally {
      setExportingMonthly(false);
    }
  };

  const handleStartNewMonth = async () => {
    if (startingMonth) return;
    setStartingMonth(true);
    try {
      await axiosInstance.post(API_PATHS.MONTHLY_ROLLOVER.START_NEW_MONTH);
      toast.success("Month closed out — budgets copied forward.");
      setShowStartMonthConfirm(false);
      setRecapRefreshKey((k) => k + 1);
      fetchDashboardData();
    } catch (error) {
      console.error("Error starting new month:", error);
      toast.error(error.response?.data?.message || "Failed to start new month");
    } finally {
      setStartingMonth(false);
    }
  };

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: period.mode, year: period.year });
      if (period.mode === "month") params.set("month", period.month);
      const response = await axiosInstance.get(
        `${API_PATHS.DASHBOARD.GET_DATA}?${params.toString()}`
      );
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Something went wrong while fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.mode, period.month, period.year]);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h4 className="text-lg font-medium dark:text-gray-100">Overview</h4>
          <div className="flex items-center gap-3 flex-wrap">
            <PeriodSelector
              mode={period.mode}
              month={period.month}
              year={period.year}
              onChange={setPeriod}
            />
            <button
              type="button"
              className="card-btn"
              onClick={() => setShowStartMonthConfirm(true)}
            >
              <LuCalendarPlus className="text-base" /> Start New Month
            </button>
            <button
              type="button"
              className="card-btn"
              onClick={handleExportMonthlyReport}
              disabled={exportingMonthly}
            >
              <LuCalendarRange className="text-base" />
              {exportingMonthly ? "Preparing..." : `Monthly Report (${period.year})`}
            </button>
            <button
              type="button"
              className="add-btn"
              onClick={handleExportReport}
              disabled={exporting}
            >
              <LuFileSpreadsheet className="text-base" />
              {exporting ? "Preparing..." : "Export Report"}
            </button>
          </div>
        </div>

        <LastMonthRecap refreshKey={recapRefreshKey} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label={period.mode === "year" ? "Balance This Year" : "Balance This Month"}
            value={dashboardData?.totalBalance || 0}
            color="bg-primary"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label={period.mode === "year" ? "Income This Year" : "Income This Month"}
            value={dashboardData?.totalIncome || 0}
            color="bg-orange-500"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label={period.mode === "year" ? "Expense This Year" : "Expense This Month"}
            value={dashboardData?.totalExpense || 0}
            color="bg-red-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 my-6 md:grid-cols-2">
          <RecentTransactions
            transactions={dashboardData?.recentTransactions}
          />

          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpense || 0}
          />

          <BreakdownCard
            title={`Expense Breakdown — ${
              period.mode === "year" ? period.year : `This Month`
            }`}
            items={(dashboardData?.expenseByCategory || []).map((c) => ({
              label: c.category,
              total: c.total,
            }))}
            emptyMessage="No expenses recorded for this period yet."
          />

          <BreakdownCard
            title={`Income Breakdown — ${
              period.mode === "year" ? period.year : `This Month`
            }`}
            items={(dashboardData?.incomeBySource || []).map((s) => ({
              label: s.source,
              total: s.total,
            }))}
            emptyMessage="No income recorded for this period yet."
          />

          <BudgetAlerts />

          <GoalsSummary />
        </div>

        <Modal
          isOpen={showStartMonthConfirm}
          onClose={() => setShowStartMonthConfirm(false)}
          title="Start New Month"
        >
          <ConfirmAlert
            content={`This closes out ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} — a snapshot of this month's totals and budget performance is saved, and this month's budgets are copied forward into ${
              MONTH_NAMES[(now.getMonth() + 1) % 12]
            }. You can keep adding transactions to this month afterward; running this again just refreshes the snapshot.`}
            confirmLabel="Start New Month"
            busy={startingMonth}
            onConfirm={handleStartNewMonth}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Home;
