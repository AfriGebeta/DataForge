"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { deleteFlag, fetchValidationFlags, resolveFlag } from "../../api";
import type {
  FlagCategory,
  FlagSeverity,
  FlagStats,
  FlagStatusFilter,
  ValidationFlag,
} from "../../types";
import { BulkResolveModal, CreateFlagModal } from "./components";
import ValidationFlagsSection from "./ValidationFlagsSection";

export default function ValidationFlagsPage() {
  const [flags, setFlags] = useState<ValidationFlag[]>([]);
  const [stats, setStats] = useState<FlagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FlagCategory | "">("");
  const [severityFilter, setSeverityFilter] = useState<FlagSeverity | "">("");
  const [statusFilter, setStatusFilter] = useState<FlagStatusFilter>("unresolved");
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchValidationFlags({
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        status: statusFilter,
      });
      setFlags(res.data);
      setStats(res.stats);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load validation flags.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, severityFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResolve = useCallback(async (id: string) => {
    try {
      await resolveFlag(id);
      showToast("Flag resolved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to resolve flag.");
    }
  }, [load, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteFlag(id);
      showToast("Flag deleted.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete flag.");
    }
  }, [load, showToast]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <ValidationFlagsSection
        flags={flags}
        stats={stats}
        loading={loading}
        categoryFilter={categoryFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        onCategoryFilter={setCategoryFilter}
        onSeverityFilter={setSeverityFilter}
        onStatusFilter={setStatusFilter}
        onResolve={handleResolve}
        onDelete={handleDelete}
        onCreateFlag={() => setCreateOpen(true)}
        onBulkResolve={() => setBulkOpen(true)}
      />

      <CreateFlagModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          showToast("Flag created successfully.");
          void load();
        }}
      />

      <BulkResolveModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onResolved={() => {
          showToast("Flags resolved successfully.");
          void load();
        }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}