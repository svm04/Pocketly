import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddGoalForm = ({ onAddGoal, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [goal, setGoal] = useState({
    name: initialData?.name || "",
    targetAmount: initialData?.targetAmount ?? "",
    targetDate: initialData?.targetDate
      ? initialData.targetDate.substring(0, 10)
      : "",
    icon: initialData?.icon || "",
  });

  const handleChange = (key, value) => setGoal({ ...goal, [key]: value });

  return (
    <div>
      <EmojiPickerPopup
        icon={goal.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={goal.name}
        onChange={({ target }) => handleChange("name", target.value)}
        label="Goal Name"
        placeholder="Emergency Fund, New Laptop..."
        type="text"
      />

      <Input
        value={goal.targetAmount}
        onChange={({ target }) => handleChange("targetAmount", target.value)}
        label="Target Amount"
        placeholder="e.g. 2000"
        type="number"
      />

      <Input
        value={goal.targetDate}
        onChange={({ target }) => handleChange("targetDate", target.value)}
        label="Target Date (optional)"
        placeholder=""
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="btn-primary w-auto px-6"
          onClick={() => onAddGoal(goal)}
        >
          {isEditing ? "Update Goal" : "Add Goal"}
        </button>
      </div>
    </div>
  );
};

export default AddGoalForm;
