import React from "react";
import { HiOutlineX } from "react-icons/hi";

const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-full bg-black/40 dark:bg-black/60 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-full">
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 rounded-t">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>

            <button
              type="button"
              className="text-gray-400 dark:text-gray-500 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
              onClick={onClose}
            >
              <HiOutlineX className="text-xl" />
            </button>
          </div>

          <div className="p-4 md:p-5 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
