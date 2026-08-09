"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchWorkerTypes, setWorkerTypeActive } from "../../api";
import type { WorkerType } from "../../types";
import { ActionModals } from "../action-modals";
import WorkerTypesSection from "./WorkerTypesSection";

export default function WorkerTypesPage() {
  const [workerTypes, setWorkerTypes] = useState<WorkerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkerTypes(await fetchWorkerTypes());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load worker types right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleStatus = useCallback(
    async (worker: WorkerType, isActive: boolean) => {
      try {
        await setWorkerTypeActive(worker, isActive);
        showToast(isActive ? "Worker activated." : "Worker deactivated.");
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to update worker status.",
        );
      }
    },
    [load, showToast],
  );

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

      <WorkerTypesSection
        workerTypes={workerTypes}
        loading={loading}
        onToggleStatus={handleToggleStatus}
        onRegister={() => setRegisterOpen(true)}
      />

      <ActionModals
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={() => {
          showToast("Worker registered successfully.");
          void load();
        }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}