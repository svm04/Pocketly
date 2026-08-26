import React from "react";

const STATUS_STYLES = {
  ok: "bg-primary",
  warning: "bg-amber-500",
  over: "bg-red-500",
  complete: "bg-green-500",
};

const ProgressBar = ({ percent = 0, status = "ok" }) => {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const barColor = STATUS_STYLES[status] || STATUS_STYLES.ok;

  return (
    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${barColor} rounded-full transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default ProgressBar;
