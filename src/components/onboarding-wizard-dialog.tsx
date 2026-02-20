"use client";

import { useState } from "react";
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
  const [completed, setCompleted] = useState(false);
  const supabase = createClient();

  const handleComplete = async () => {
    if (completed) return;
    setCompleted(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({ onboarded: true })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating onboarding status:", error);
      }
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }

    setOpen(false);
    if (onComplete) onComplete();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !completed) {
          handleComplete();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Willkommen bei Zeitdreher!</DialogTitle>
          <DialogDescription>
            Richten Sie Ihre Zeiterfassungsstruktur ein, um loszulegen.
          </DialogDescription>
        </DialogHeader>
        <CategorySetupWizard onComplete={handleComplete} />
      </DialogContent>
    </Dialog>
  );
}
