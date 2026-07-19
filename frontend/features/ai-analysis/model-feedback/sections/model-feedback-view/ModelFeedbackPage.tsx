"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchModelFeedback } from "../../api";
import type { ModelFeedbackData } from "../../types";
import ModelFeedbackSection from "./ModelFeedbackSection";

export default function ModelFeedbackPage() {
  const [data, setData] = useState<ModelFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModelFeedback();
      setData(res);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load model feedback data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDiscard = useCallback((id: string) => {
    showToast("Discarded");
    console.log("Discarded:", id);
  }, [showToast]);

  const handleApprove = useCallback((id: string) => {
    showToast("Added to retrain queue!");
    console.log("Approved:", id);
  }, [showToast]);

  if (loading) return <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>;
  if (error) return <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <ModelFeedbackSection
        data={data}
        onDiscard={handleDiscard}
        onApprove={handleApprove}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}