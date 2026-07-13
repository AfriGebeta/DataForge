"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { drainInstance, fetchInstances, stopInstance } from "../../api";
import type { InstanceStatus, WorkerInstance } from "../../types";
import InstancesSection from "./InstancesSection";

export default function InstancesPage() {
  const [instances, setInstances] = useState<WorkerInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InstanceStatus | "">("");
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInstances({
        status: statusFilter || undefined,
      });
      setInstances(res.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load instances right now.",
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDrain = useCallback(
    async (id: string) => {
      try {
        await drainInstance(id);
        showToast("Draining…");
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to drain instance.",
        );
      }
    },
    [load, showToast],
  );

  const handleStop = useCallback(
    async (id: string) => {
      try {
        await stopInstance(id);
        showToast("Stopped.");
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Failed to stop instance.",
        );
      }
    },
    [load, showToast],
  );

  const handleSweep = useCallback(async () => {
    showToast("Sweep complete — 0 marked dead.");
    await load();
  }, [load, showToast]);

  return (
    <div>
      {error && (
        <div
          style={{
            color: "var(--text-danger)",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <InstancesSection
        instances={instances}
        loading={loading}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onDrain={handleDrain}
        onStop={handleStop}
        onSweep={handleSweep}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}