import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddBudgetForm = ({ onAddBudget, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [budget, setBudget] = useState({
    category: initialData?.category || "",
    monthlyLimit: initialData?.monthlyLimit ?? "",
    icon: initialData?.icon || "",
  });

  const handleChange = (key, value) => setBudget({ ...budget, [key]: value });

  return (
    <div>
      <EmojiPickerPopup
        icon={budget.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={budget.category}
        onChange={({ target }) => handleChange("category", target.value)}
        label="Category"
        placeholder="Groceries, Rent, Entertainment..."
        type="text"
      />

      <Input
        value={budget.monthlyLimit}
        onChange={({ target }) => handleChange("monthlyLimit", target.value)}
        label="Monthly Limit"
        placeholder="e.g. 300"
        type="number"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="btn-primary w-auto px-6"
          onClick={() => onAddBudget(budget)}
        >
          {isEditing ? "Update Budget" : "Add Budget"}
        </button>
      </div>
    </div>
  );
};

export default AddBudgetForm;
