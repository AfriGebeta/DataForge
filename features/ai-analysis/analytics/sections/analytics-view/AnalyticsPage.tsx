"use client";

import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fakeData } from "../../api";
import AnalyticsSection from "./AnalyticsSection";

export default function AnalyticsPage() {
  const { message, visible, showToast } = useToast();

  return (
    <div>
      <AnalyticsSection
        data={fakeData}
        onExportCsv={() => showToast("Exporting CSV...")}
        onReportPdf={() => showToast("Generating PDF report...")}
        onViewRegistry={() => showToast("Opening full registry…")}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}
