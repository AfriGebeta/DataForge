"use client";

import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fakeData } from "../../api";
import AiAnalysisSection from "./AiAnalysisSection";

export default function AiAnalysisPage() {
  const { message, visible, showToast } = useToast();

  return (
    <div>
      <AiAnalysisSection
        data={fakeData}
        onForceRetrain={() => showToast("Force retrain triggered — Admin only")}
      />
      <Toast message={message} visible={visible} />
    </div>
  );
}
