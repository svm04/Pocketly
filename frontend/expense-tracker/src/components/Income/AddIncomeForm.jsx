import React, { useState } from "react";
import Input from "../Inputs/Input";
import EmojiPickerPopup from "../EmojiPickerPopup";

const AddIncomeForm = ({ onAddIncome, initialData }) => {
  const isEditing = Boolean(initialData?._id);

  const [income, setIncome] = useState({
    source: initialData?.source || "",
    amount: initialData?.amount ?? "",
    date: initialData?.date ? initialData.date.substring(0, 10) : "",
    icon: initialData?.icon || "",
  });

  const handleChange = (key, value) =>
    setIncome({ ...income, [key]: value });

  const handleSubmit = () => {
    onAddIncome(income);
  };

  return (
    <div>
      <EmojiPickerPopup
        icon={income.icon}
        onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
      />

      <Input
        value={income.source}
        onChange={({ target }) => handleChange("source", target.value)}
        label="Income Source"
        placeholder="Freelance, Salary, etc"
        type="text"
      />

      <Input
        value={income.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder="e.g. 5000"
        type="number"
      />

      <Input
        value={income.date}
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
          {isEditing ? "Update Income" : "Add Income"}
        </button>
      </div>
    </div>
  );
};

export default AddIncomeForm;
