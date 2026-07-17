"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { applyPlaceDelta, deletePlaceDelta, fetchPlaceDeltas } from "../../api";
import type { DeltaAction, DeltaAppliedFilter, DeltaSourceType, PlaceDelta } from "../../types";
import { RecordDeltaModal } from "./components";
import PlaceDeltasSection from "./PlaceDeltasSection";

export default function PlaceDeltasPage() {
  const [deltas, setDeltas] = useState<PlaceDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<DeltaAction | "">("");
  const [appliedFilter, setAppliedFilter] = useState<DeltaAppliedFilter>("unapplied");
  const [sourceFilter, setSourceFilter] = useState<DeltaSourceType | "">("");
  const [recordOpen, setRecordOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlaceDeltas({
        action: actionFilter || undefined,
        applied: appliedFilter,
        source_type: sourceFilter || undefined,
      });
      setDeltas(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load place deltas.");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, appliedFilter, sourceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApply = useCallback(async (id: string) => {
    try {
      await applyPlaceDelta(id);
      showToast("Delta applied.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to apply delta.");
    }
  }, [load, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deletePlaceDelta(id);
      showToast("Delta deleted.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete delta.");
    }
  }, [load, showToast]);

  const handleBulkApply = useCallback(async () => {
    const unapplied = deltas.filter((d) => !d.is_applied);
    for (const delta of unapplied) {
      await applyPlaceDelta(delta.id);
    }
    showToast(`${unapplied.length} deltas applied.`);
    await load();
  }, [deltas, load, showToast]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <PlaceDeltasSection
        deltas={deltas}
        loading={loading}
        actionFilter={actionFilter}
        appliedFilter={appliedFilter}
        sourceFilter={sourceFilter}
        onActionFilter={setActionFilter}
        onAppliedFilter={setAppliedFilter}
        onSourceFilter={setSourceFilter}
        onApply={handleApply}
        onDelete={handleDelete}
        onBulkApply={handleBulkApply}
        onRecordDelta={() => setRecordOpen(true)}
      />

      <RecordDeltaModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        onCreated={() => {
          showToast("Delta recorded successfully.");
          void load();
        }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}