"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { reviewPlace } from "@/features/verification/shared/api";
import { fetchModelFeedback } from "../../api";
import type { ModelFeedbackData, ReviewQueueItem } from "../../types";
import ModelFeedbackSection from "./ModelFeedbackSection";

export default function ModelFeedbackPage() {
  const { message, visible, showToast } = useToast();
  const [data, setData] = useState<ModelFeedbackData | null>(null);
  const [selected, setSelected] = useState<ReviewQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchModelFeedback();
      setData(res);
      setSelected((prev) => {
        if (prev && res.review_queue.some((item) => item.place_id === prev.place_id)) {
          return prev;
        }
        return res.review_queue[0] ?? null;
      });
    } catch (cause) {
      console.warn("fetchModelFeedback failed:", cause);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDecision = useCallback(
    async (placeId: number, decision: "approve" | "reject") => {
      setActingOn(placeId);
      try {
        const result = await reviewPlace(placeId, decision, undefined, "DataForge — Model Feedback");
        if (!result) throw new Error("review failed");
        showToast(decision === "approve" ? "Place approved" : "Place rejected");
        await load();
      } catch (cause) {
        console.warn("reviewPlace failed:", cause);
        showToast("Action failed");
      } finally {
        setActingOn(null);
      }
    },
    [load, showToast],
  );

  return (
    <div>
      {data && (
        <ModelFeedbackSection
          data={data}
          loading={loading}
          selected={selected}
          onSelect={setSelected}
          actingOn={actingOn}
          onReject={(id) => handleDecision(id, "reject")}
          onApprove={(id) => handleDecision(id, "approve")}
        />
      )}
      <Toast message={message} visible={visible} />
    </div>
  );
}
