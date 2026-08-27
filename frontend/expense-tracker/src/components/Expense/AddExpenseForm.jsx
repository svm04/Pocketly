import React, { useState } from "react";
import Input from "../Inputs/Input";
import CategoryPicker from "../Inputs/CategoryPicker";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddExpenseForm = ({ onAddExpense, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [expense, setExpense] = useState({
    category: initialData?.category || "",
    description: initialData?.description || "",
    amount: initialData?.amount ?? "",
    date: initialData?.date ? initialData.date.substring(0, 10) : "",
    icon: initialData?.icon || "",
  });

  // Functional update — not { ...expense, [key]: value }. CategoryPicker's
  // onSelect fires onChange(category) and onSelectIcon(icon) back-to-back
  // in the same event, and both calls closed over the same stale `expense`
  // from render time; the second call's spread clobbered the first one's
  // change, so the category name silently reverted right after being set
  // (you'd only see it "stick" on a second selection, once the icon was
  // already filled and its update no longer fired). Reading off `prev`
  // instead makes each update build on the one right before it.
  const handleChange = (key, value) =>
    setExpense((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    onAddExpense(expense);
  };

  return (
    <div>
      <EmojiPickerPopup
        icon={expense.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <CategoryPicker
        value={expense.category}
        onChange={(value) => handleChange("category", value)}
        onSelectIcon={(icon) => {
          // Only auto-fill the icon if one hasn't been picked already, so
          // this never clobbers a deliberate manual choice.
          if (!expense.icon) handleChange("icon", icon);
        }}
        label="Category"
        placeholder="Rent, Groceries, etc"
      />

      <Input
        value={expense.description}
        onChange={({ target }) => handleChange("description", target.value)}
        label="Description (optional)"
        placeholder="e.g. Dinner - Uber Eats"
        type="text"
      />

      <Input
        value={expense.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder="e.g. 500"
        type="number"
      />

      <Input
        value={expense.date}
        onChange={({ target }) => handleChange("date", target.value)}
        label="Date"
        placeholder=""
        type="date"
      />

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="btn-primary w-auto px-6"
          onClick={handleSubmit}
        >
          {isEditing ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </div>
  );
};

export default AddExpenseForm;
