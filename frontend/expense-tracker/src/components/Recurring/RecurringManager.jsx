import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Modal from "../Modal";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// A self-contained modal for managing recurring income/expense rules —
// mounted from the Income/Expense overview headers, filtered to the
// relevant type (`type` is "income" or "expense").
const RecurringManager = ({ isOpen, onClose, type }) => {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    icon: "",
    frequency: "monthly",
    startDate: "",
  });

  const label = type === "income" ? "Income" : "Expense";
  const titleLabel = type === "income" ? "Source" : "Category";

  const fetchRules = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RECURRING.GET_ALL_RECURRING);
      setRules((response.data || []).filter((rule) => rule.type === type));
    } catch (error) {
      console.error("Error fetching recurring rules:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh rules whenever the modal opens
      fetchRules();
      setShowForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Functional update (see AddExpenseForm.jsx for why) — keeps this safe
  // if a future change ever fires two handleChange calls back-to-back.
  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error(`${titleLabel} is required.`);
      return;
    }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      toast.error("Amount should be a valid number greater than 0.");
      return;
    }
    if (!form.startDate) {
      toast.error("Start date is required.");
      return;
    }

    try {
      await axiosInstance.post(API_PATHS.RECURRING.ADD_RECURRING, {
        type,
        title: form.title,
        amount: form.amount,
        icon: form.icon,
        frequency: form.frequency,
        startDate: form.startDate,
      });
      toast.success("Recurring rule added");
      setForm({ title: "", amount: "", icon: "", frequency: "monthly", startDate: "" });
      setShowForm(false);
      fetchRules();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add recurring rule");
    }
  };

  const handleToggle = async (id) => {
    try {
      await axiosInstance.put(API_PATHS.RECURRING.TOGGLE_RECURRING(id));
      fetchRules();
    } catch {
      toast.error("Failed to update recurring rule");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.RECURRING.DELETE_RECURRING(id));
      toast.success("Recurring rule deleted");
      fetchRules();
    } catch {
      toast.error("Failed to delete recurring rule");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Recurring ${label}`}>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {rules.length === 0 && !showForm && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No recurring {label.toLowerCase()} yet — automate rent, salary,
            subscriptions, and more.
          </p>
        )}

        {rules.map((rule) => (
          <div
            key={rule._id}
            className="flex items-center justify-between border border-gray-200/70 dark:border-gray-700/70 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{rule.icon || "🔁"}</span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{rule.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  ${rule.amount} · {rule.frequency} · next{" "}
                  {moment(rule.nextRunDate).format("Do MMM YYYY")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={rule.active}
                  onChange={() => handleToggle(rule._id)}
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </label>
              <button
                type="button"
                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                onClick={() => handleDelete(rule._id)}
              >
                <LuTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <EmojiPickerPopup
            icon={form.icon}
            onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
          />
          <Input
            value={form.title}
            onChange={({ target }) => handleChange("title", target.value)}
            label={titleLabel}
            placeholder={type === "income" ? "Salary" : "Rent"}
            type="text"
          />
          <Input
            value={form.amount}
            onChange={({ target }) => handleChange("amount", target.value)}
            label="Amount"
            placeholder="e.g. 1000"
            type="number"
          />
          <div>
            <label className="text-[13px] text-slate-800 dark:text-gray-300">Frequency</label>
            <select
              className="input-box"
              value={form.frequency}
              onChange={(e) => handleChange("frequency", e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <Input
            value={form.startDate}
            onChange={({ target }) => handleChange("startDate", target.value)}
            label="Start Date"
            placeholder=""
            type="date"
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="card-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary w-auto px-6" onClick={handleAdd}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="add-btn w-full justify-center mt-4"
          onClick={() => setShowForm(true)}
        >
          <LuPlus className="text-base" /> New recurring {label.toLowerCase()}
        </button>
      )}
    </Modal>
  );
};

export default RecurringManager;
