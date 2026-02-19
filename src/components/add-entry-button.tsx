"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TimeEntryForm from "@/components/time-entry-form";

interface AddEntryButtonProps {
  onAddEntry?: () => void;
}

export default function AddEntryButton({ onAddEntry }: AddEntryButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = () => {
    // Always open the dialog when the button is clicked
    setIsDialogOpen(true);

    // Also call the onAddEntry callback if provided
    if (onAddEntry) {
      onAddEntry();
    }
  };

  const handleTimeEntrySubmit = (data: any) => {
    // Close the dialog after submission
    setIsDialogOpen(false);

    // Dispatch the timeEntryAdded event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Eintrag hinzufügen
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Zeiteintrag</DialogTitle>
          </DialogHeader>
          <TimeEntryForm onSubmit={handleTimeEntrySubmit} />
        </DialogContent>
      </Dialog>
    </>
  );
}
