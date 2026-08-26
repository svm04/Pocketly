import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddExpenseForm = ({ onAddExpense, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [expense, setExpense] = useState({
    category: initialData?.category || "",
    amount: initialData?.amount ?? "",
    date: initialData?.date ? initialData.date.substring(0, 10) : "",
    icon: initialData?.icon || "",
  });

  const handleChange = (key, value) =>
    setExpense({ ...expense, [key]: value });

  const handleSubmit = () => {
    onAddExpense(expense);
  };

  return (
    <div>
      <EmojiPickerPopup
        icon={expense.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={expense.category}
        onChange={({ target }) => handleChange("category", target.value)}
        label="Category"
        placeholder="Rent, Groceries, etc"
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
