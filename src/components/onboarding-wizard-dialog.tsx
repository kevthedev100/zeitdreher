"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CategorySetupWizard from "./category-setup-wizard";
import { createClient } from "../../supabase/client";

interface OnboardingWizardDialogProps {
  userId: string;
  onComplete?: () => void;
}

export default function OnboardingWizardDialog({
  userId,
  onComplete,
}: OnboardingWizardDialogProps) {
  const [open, setOpen] = useState(true);
  const supabase = createClient();

  // Mark user as onboarded when dialog is closed
  const handleClose = async () => {
    try {
      console.log("Marking user as onboarded:", userId);

      // Update the user's onboarded status in the database
      const { error } = await supabase
        .from("users")
        .update({ onboarded: true })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating onboarding status:", error);
      } else {
        console.log("Successfully marked user as onboarded");
      }

      setOpen(false);
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      setOpen(false);
      if (onComplete) onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Willkommen bei Zeitdreher!</DialogTitle>
          <DialogDescription>
            Richten Sie Ihre Zeiterfassungsstruktur ein, um loszulegen.
          </DialogDescription>
        </DialogHeader>
        <CategorySetupWizard onComplete={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
