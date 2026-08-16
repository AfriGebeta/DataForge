"use client";

import { useEffect, useState } from "react";
import { fetchAiAnalysis } from "../../api";
import type { ModelPerformanceData } from "../../types";
import AiAnalysisSection from "./AiAnalysisSection";

export default function AiAnalysisPage() {
  const [data, setData] = useState<ModelPerformanceData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAiAnalysis()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((cause) => console.warn("fetchAiAnalysis failed:", cause));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  return <AiAnalysisSection data={data} />;
}
