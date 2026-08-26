import React from "react";

const DeleteAlert = ({ content, onDelete }) => {
  return (
    <div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium text-white bg-red-500 hover:bg-red-600 whitespace-nowrap px-4 py-2 rounded-lg"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlert;
