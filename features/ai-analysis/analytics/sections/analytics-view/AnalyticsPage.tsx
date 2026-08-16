"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics } from "../../api";
import type { AnalyticsData } from "../../types";
import AnalyticsSection from "./AnalyticsSection";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((cause) => console.warn("fetchAnalytics failed:", cause));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  return <AnalyticsSection data={data} />;
}
