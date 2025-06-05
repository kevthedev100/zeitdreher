"use client";

import { Plus } from "lucide-react";

interface AddEntryButtonProps {
  onAddEntry?: () => void;
}

export default function AddEntryButton({ onAddEntry }: AddEntryButtonProps) {
  const handleClick = () => {
    if (onAddEntry) {
      onAddEntry();
    } else {
      // Fallback: Find the new entry tab trigger and click it
      const newEntryTab = document.querySelector(
        '[value="new-entry"]',
      ) as HTMLElement;
      if (newEntryTab) {
        newEntryTab.click();
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Eintrag hinzufügen
    </button>
  );
}
