import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LuFileSpreadsheet } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { downloadBlob } from "../../utils/downloadFile";
import TransactionInfoCard from "../../components/Cards/TransactionInfoCard";
import Pagination from "../../components/Pagination";
import Modal from "../../components/Modal";
import DeleteAlert from "../../components/DeleteAlert";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
];

const Transactions = () => {
  useUserAuth();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: null, type: null });
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

  const fetchTransactions = async (page = 1, type = filter) => {
    if (loading) return;
    setLoading(true);
    try {
      const typeParam = type !== "all" ? `&type=${type}` : "";
      const response = await axiosInstance.get(
        `${API_PATHS.TRANSACTIONS.GET_ALL}?page=${page}&limit=15${typeParam}`
      );
      setTransactions(response.data?.transactions || []);
      setPagination({
        currentPage: response.data?.currentPage || 1,
        totalPages: response.data?.totalPages || 1,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => {
    setFilter(key);
    fetchTransactions(1, key);
  };

  const handleDelete = async () => {
    const { id, type } = deleteAlert;
    try {
      const endpoint =
        type === "income"
          ? API_PATHS.INCOME.DELETE_INCOME(id)
          : API_PATHS.EXPENSE.DELETE_EXPENSE(id);
      await axiosInstance.delete(endpoint);
      toast.success("Transaction deleted");
      setDeleteAlert({ show: false, id: null, type: null });
      fetchTransactions(pagination.currentPage, filter);
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchTransactions(1, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout activeMenu="Transactions">
      <div className="my-5 mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h5 className="text-lg font-medium dark:text-gray-100">All Transactions</h5>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                      filter === f.key
                        ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                    onClick={() => handleFilterChange(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

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

          <div className="mt-4">
            {transactions.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">No transactions found.</p>
            )}

            {transactions.map((txn) => (
              <TransactionInfoCard
                key={txn._id}
                title={txn.title}
                icon={txn.icon}
                date={txn.date}
                amount={txn.amount}
                type={txn.type}
                onDelete={() =>
                  setDeleteAlert({ show: true, id: txn._id, type: txn.type })
                }
              />
            ))}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => fetchTransactions(page, filter)}
          />
        </div>

        <Modal
          isOpen={deleteAlert.show}
          onClose={() => setDeleteAlert({ show: false, id: null, type: null })}
          title="Delete Transaction"
        >
          <DeleteAlert
            content="Are you sure you want to delete this transaction?"
            onDelete={handleDelete}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
