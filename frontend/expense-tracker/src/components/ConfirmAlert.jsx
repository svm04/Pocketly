import React from "react";

// Same shape as DeleteAlert, but for a non-destructive confirmation
// (primary-colored button, no "delete" framing, optional busy state).
const ConfirmAlert = ({ content, confirmLabel = "Confirm", onConfirm, busy = false }) => {
  return (
    <div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{content}</p>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium text-white bg-primary hover:bg-purple-600 whitespace-nowrap px-4 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </div>
  );
};

export default ConfirmAlert;
