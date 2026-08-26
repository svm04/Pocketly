import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import moment from "moment";
import { LuPlus, LuPencil, LuTrash2, LuPiggyBank } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/Modal";
import DeleteAlert from "../../components/DeleteAlert";
import ProgressBar from "../../components/ProgressBar";
import Input from "../../components/Inputs/Input";
import AddGoalForm from "../../components/Goals/AddGoalForm";
import { addThousandsSeparator } from "../../utils/helper";

const ContributeForm = ({ onContribute }) => {
  const [amount, setAmount] = useState("");
  return (
    <div>
      <Input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        label="Amount to add"
        placeholder="e.g. 100 (use a negative number to withdraw)"
        type="number"
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 mb-2">
        This moves real money: a positive amount is posted as an expense
        (money leaving your balance), a negative amount as income (money
        coming back out of savings).
      </p>
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="btn-primary w-auto px-6"
          onClick={() => onContribute(amount)}
        >
          Add Contribution
        </button>
      </div>
    </div>
  );
};

const Goals = () => {
  useUserAuth();

  const [goals, setGoals] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({ show: false, id: null });

  const fetchGoals = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.GOALS.GET_ALL_GOALS);
      setGoals(response.data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async (goal) => {
    const { name, targetAmount, targetDate, icon } = goal;

    if (!name.trim()) {
      toast.error("Goal name is required.");
      return;
    }
    if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
      toast.error("Target amount should be a valid number greater than 0.");
      return;
    }

    try {
      if (editingGoal?._id) {
        await axiosInstance.put(API_PATHS.GOALS.UPDATE_GOAL(editingGoal._id), {
          name,
          targetAmount,
          targetDate: targetDate || null,
          icon,
        });
        toast.success("Goal updated");
      } else {
        await axiosInstance.post(API_PATHS.GOALS.ADD_GOAL, {
          name,
          targetAmount,
          targetDate: targetDate || null,
          icon,
        });
        toast.success("Goal created");
      }
      closeModal();
      fetchGoals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save goal");
    }
  };

  const handleContribute = async (amount) => {
    if (!amount || isNaN(amount) || Number(amount) === 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await axiosInstance.put(API_PATHS.GOALS.CONTRIBUTE_GOAL(contributingGoal._id), {
        amount: Number(amount),
      });
      toast.success("Contribution added");
      setContributingGoal(null);
      fetchGoals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add contribution");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.GOALS.DELETE_GOAL(id));
      toast.success("Goal deleted");
      setDeleteAlert({ show: false, id: null });
      fetchGoals();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    fetchGoals();
  }, []);

  return (
    <DashboardLayout activeMenu="Goals">
      <div className="my-5 mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-lg font-medium dark:text-gray-100">Savings Goals</h5>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Set a target and track your progress toward it.
              </p>
            </div>

            <button
              className="btn-primary w-auto px-4"
              onClick={() => {
                setEditingGoal(null);
                setOpenModal(true);
              }}
            >
              <span className="flex items-center gap-1">
                <LuPlus className="text-lg" /> Add Goal
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {goals.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 col-span-2">
                No savings goals yet. Add one to start tracking your progress.
              </p>
            )}

            {goals.map((goal) => (
              <div
                key={goal._id}
                className="group border border-gray-200/70 dark:border-gray-700/70 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800 rounded-full">
                      {goal.icon ? (
                        <span className="text-xl">{goal.icon}</span>
                      ) : (
                        <LuPiggyBank />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{goal.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        ${addThousandsSeparator(goal.currentAmount)} / $
                        {addThousandsSeparator(goal.targetAmount)}
                        {goal.targetDate &&
                          ` · by ${moment(goal.targetDate).format("Do MMM YYYY")}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-primary"
                      onClick={() => {
                        setEditingGoal(goal);
                        setOpenModal(true);
                      }}
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                      onClick={() => setDeleteAlert({ show: true, id: goal._id })}
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <ProgressBar
                  percent={goal.percentComplete}
                  status={goal.percentComplete >= 100 ? "complete" : "ok"}
                />

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {goal.percentComplete}% complete
                  </p>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => setContributingGoal(goal)}
                  >
                    + Add money
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Modal
          isOpen={openModal}
          onClose={closeModal}
          title={editingGoal ? "Edit Goal" : "Add Goal"}
        >
          <AddGoalForm onAddGoal={handleSaveGoal} initialData={editingGoal} />
        </Modal>

        <Modal
          isOpen={Boolean(contributingGoal)}
          onClose={() => setContributingGoal(null)}
          title={`Contribute to ${contributingGoal?.name || ""}`}
        >
          <ContributeForm onContribute={handleContribute} />
        </Modal>

        <Modal
          isOpen={deleteAlert.show}
          onClose={() => setDeleteAlert({ show: false, id: null })}
          title="Delete Goal"
        >
          <DeleteAlert
            content="Are you sure you want to delete this goal?"
            onDelete={() => handleDelete(deleteAlert.id)}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Goals;
