import React, { useState } from "react";
import Input from "../Inputs/Input";
import CategoryPicker from "../Inputs/CategoryPicker";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddBudgetForm = ({ onAddBudget, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [budget, setBudget] = useState({
    category: initialData?.category || "",
    monthlyLimit: initialData?.monthlyLimit ?? "",
    icon: initialData?.icon || "",
  });

  // Functional update, not { ...budget, [key]: value } — see the matching
  // comment in AddExpenseForm.jsx for why (CategoryPicker fires onChange
  // and onSelectIcon back-to-back off the same stale closure, so the
  // second call was clobbering the first).
  const handleChange = (key, value) => setBudget((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <EmojiPickerPopup
        icon={budget.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <CategoryPicker
        value={budget.category}
        onChange={(value) => handleChange("category", value)}
        onSelectIcon={(icon) => {
          if (!budget.icon) handleChange("icon", icon);
        }}
        label="Category"
        placeholder="Groceries, Rent, Entertainment..."
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
