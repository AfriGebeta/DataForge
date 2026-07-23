"use client";

import { useCallback } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fakeData } from "../../api";
import ModelFeedbackSection from "./ModelFeedbackSection";

export default function ModelFeedbackPage() {
  const { message, visible, showToast } = useToast();

  const handleDiscard = useCallback(() => {
    showToast("Discarded");
  }, [showToast]);

  const handleApprove = useCallback(() => {
    showToast("Added to retrain queue!");
  }, [showToast]);

  return (
    <div>
      <ModelFeedbackSection
        data={fakeData}
        onDiscard={handleDiscard}
        onApprove={handleApprove}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}
