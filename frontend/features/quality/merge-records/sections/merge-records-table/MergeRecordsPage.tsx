"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchMergeRecords } from "../../api";
import type { MergeRecord, MergeStrategy } from "../../types";
import ActionModals from "../action-modals";
import MergeRecordsSection from "./MergeRecordsSection";

export default function MergeRecordsPage() {
  const [records, setRecords] = useState<MergeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategyFilter, setStrategyFilter] = useState<MergeStrategy | "">("");
  const [recordMergeOpen, setRecordMergeOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMergeRecords({
        strategy: strategyFilter || undefined,
      });
      setRecords(res.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load merge records.",
      );
    } finally {
      setLoading(false);
    }
  }, [strategyFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <MergeRecordsSection
        records={records}
        loading={loading}
        strategyFilter={strategyFilter}
        onStrategyFilter={setStrategyFilter}
        onRecordMerge={() => setRecordMergeOpen(true)}
      />

      <ActionModals
  recordOpen={recordMergeOpen}
  onRecordClose={() => setRecordMergeOpen(false)}
  onCreated={() => { showToast("Merge recorded successfully."); void load(); }}
/>

      <Toast message={message} visible={visible} />
    </div>
  );
}