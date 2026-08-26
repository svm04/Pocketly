import React, { useEffect, useState } from "react";
import { LuHandCoins, LuWalletMinimal, LuFileSpreadsheet } from "react-icons/lu";
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
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import BudgetAlerts from "../../components/Dashboard/BudgetAlerts";
import GoalsSummary from "../../components/Dashboard/GoalsSummary";

const Home = () => {
  useUserAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.DASHBOARD.GET_DATA);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="my-5 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium dark:text-gray-100">Overview</h4>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={dashboardData?.totalBalance || 0}
            color="bg-primary"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={dashboardData?.totalIncome || 0}
            color="bg-orange-500"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expense"
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

          <ExpenseTransactions
            transactions={dashboardData?.last30DaysExpenses?.transactions}
          />

          <Last30DaysExpenses
            transactions={dashboardData?.last30DaysExpenses?.transactions}
          />

          <RecentIncomeWithChart
            data={dashboardData?.last60DaysIncome?.transactions?.slice(0, 4)}
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <BudgetAlerts />

          <GoalsSummary />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
