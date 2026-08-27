import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <p>&copy; {year} Pocketly &mdash; track smarter, spend wiser.</p>
        <p>
          Developed by{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Senithi
          </span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
