"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchAnalytics } from "../../api";
import type { AnalyticsData } from "../../types";
import AnalyticsSection from "./AnalyticsSection";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalytics();
      setData(res);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load analytics data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading)
    return <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>;
  if (error)
    return <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p>;
  if (!data) return null;

  return (
    <div>
      <AnalyticsSection
        data={data}
        onExportCsv={() => showToast("Exporting CSV...")}
        onReportPdf={() => showToast("Generating PDF report...")}
        onViewRegistry={() => showToast("Opening full registry…")}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}