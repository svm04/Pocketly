import moment from "moment";

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Adds thousands separators to a number, e.g. 1234567 -> "12,34,567" style not required;
// we use a plain comma-grouped format: 1234567.5 -> "1,234,567.50"
export const addThousandsSeparator = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "";
  const [integerPart, fractionPart] = num.toString().split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fractionPart
    ? `${formattedInteger}.${fractionPart}`
    : formattedInteger;
};

export const getInitials = (name) => {
  if (!name) return "";
  const words = name.split(" ");
  let initials = "";
  for (let i = 0; i < Math.min(words.length, 2); i++) {
    if (words[i]) initials += words[i][0];
  }
  return initials.toUpperCase();
};

// Groups income transactions by day for a line chart
export const prepareIncomeLineChartData = (transactions = []) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sorted.map((txn, index) => {
    const label = moment(txn.date).format("Do MMM");
    return {
      // Recharts looks up tooltip/hover data by matching this axis value.
      // When two transactions fall on the same day, "label" alone collides
      // and Recharts always resolves to the *first* matching entry —
      // making a second same-day bar silently show the wrong bar's data.
      // Appending the index keeps every entry's key unique; `label` (the
      // pretty "18th Aug" text) is still what's shown on the axis/tooltip.
      month: `${label}__${index}`,
      label,
      amount: txn.amount,
      source: txn.source,
    };
  });
};

// Groups expense transactions by day for a bar chart
export const prepareExpenseBarChartData = (transactions = []) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return sorted.map((txn, index) => {
    const label = moment(txn.date).format("Do MMM");
    return {
      // See prepareIncomeLineChartData above for why this needs to be
      // unique per entry rather than just the formatted day label.
      month: `${label}__${index}`,
      label,
      amount: txn.amount,
      category: txn.category,
    };
  });
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Turns a year's { month, total } summary (from the monthly-summary
// endpoints) into one bar/point per month for the Annual view — Jan
// through Dec, zero-filled by the backend so the axis is always complete.
export const prepareExpenseMonthlyChartData = (summary = []) => {
  return summary.map((item) => ({
    month: `${MONTH_LABELS[item.month - 1]}__${item.month}`,
    label: MONTH_LABELS[item.month - 1],
    amount: item.total,
    category: "",
  }));
};

export const prepareIncomeMonthlyChartData = (summary = []) => {
  return summary.map((item) => ({
    month: `${MONTH_LABELS[item.month - 1]}__${item.month}`,
    label: MONTH_LABELS[item.month - 1],
    amount: item.total,
    source: "",
  }));
};
