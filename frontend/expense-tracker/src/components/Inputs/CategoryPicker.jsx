import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

// A free-text category field with an autocomplete dropdown of the user's
// existing categories (pulled from both past expenses and budgets). You
// can still type any new category — the dropdown is a convenience, not a
// whitelist. What it also does: if what you typed matches an existing
// category except for casing (e.g. you type "groceries" and "Groceries"
// already exists), it snaps to that category's exact spelling once you
// pick it or move on. That's what keeps the expense/budget breakdown
// charts from splitting one category into near-duplicate slices.
const CategoryPicker = ({ value, onChange, onSelectIcon, label = "Category", placeholder }) => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.EXPENSE.GET_CATEGORIES);
        setCategories(response.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const query = (value || "").trim().toLowerCase();
    if (!query) return categories.slice(0, 8);
    return categories
      .filter((c) => c.category.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value, categories]);

  const reconcileToExisting = () => {
    const typed = (value || "").trim();
    if (!typed) return;
    const match = categories.find((c) => c.category.toLowerCase() === typed.toLowerCase());
    if (match && match.category !== typed) {
      onChange(match.category);
    }
    if (match && match.icon && onSelectIcon) {
      onSelectIcon(match.icon);
    }
  };

  const handleSelect = (category) => {
    onChange(category.category);
    if (category.icon && onSelectIcon) onSelectIcon(category.icon);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-[13px] text-slate-800 dark:text-gray-300">{label}</label>
      <div className="input-box">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={reconcileToExisting}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((c) => (
            <button
              key={c.category}
              type="button"
              // onMouseDown (not onClick) fires before the input's onBlur,
              // so the click registers before the dropdown gets hidden.
              onMouseDown={() => handleSelect(c)}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              {c.icon && <span>{c.icon}</span>}
              {c.category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
