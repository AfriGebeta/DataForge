"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchAiAnalysis } from "../../api";
import type { AiAnalysisData } from "../../types";
import AiAnalysisSection from "./AiAnalysisSection";

export default function AiAnalysisPage() {
  const [data, setData] = useState<AiAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiAnalysis();
      setData(res);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load AI analysis data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
    );
  }

  if (error) {
    return (
      <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p>
    );
  }

  if (!data) return null;

  return (
    <div>
      <AiAnalysisSection
        data={data}
        onForceRetrain={() => showToast("Force retrain triggered — Admin only")}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}