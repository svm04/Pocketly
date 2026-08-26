import React from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <LuChevronLeft />
      </button>

      <span className="text-xs text-gray-500 dark:text-gray-500">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <LuChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
