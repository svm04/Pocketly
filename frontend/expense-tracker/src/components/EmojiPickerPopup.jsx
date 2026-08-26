import React, { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { LuImage, LuX } from "react-icons/lu";

const EmojiPickerPopup = ({ icon, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emojiData) => {
    onSelect(emojiData?.emoji || "");
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-5 mb-6">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 dark:bg-purple-500/10 text-primary rounded-lg">
          {icon ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            <LuImage className="text-xl text-purple-500" />
          )}
        </div>
        <p className="text-sm dark:text-gray-100">{icon ? "Change Icon" : "Pick Icon"}</p>
      </div>

      {isOpen && (
        <div className="relative">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full absolute -top-2 -right-2 z-10 cursor-pointer shadow"
            onClick={() => setIsOpen(false)}
          >
            <LuX />
          </button>
          <EmojiPicker open={isOpen} onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerPopup;
