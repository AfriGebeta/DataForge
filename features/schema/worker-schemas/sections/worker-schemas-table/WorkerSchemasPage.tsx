"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchWorkerSchemas } from "../../api";
import type { WorkerSchema } from "../../types";
import ActionModals from "../action-modals";
import WorkerSchemasSection from "./WorkerSchemasSection";

export default function WorkerSchemasPage() {
  const [schemas, setSchemas] = useState<WorkerSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSchema, setEditSchema] = useState<WorkerSchema | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWorkerSchemas();
      setSchemas(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load schemas right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      <WorkerSchemasSection
        schemas={schemas}
        loading={loading}
        onCreate={() => setCreateOpen(true)}
        onEdit={(schema) => setEditSchema(schema)}
      />

      <ActionModals
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        onCreated={() => { showToast("Schema created successfully."); void load(); }}
        editSchema={editSchema}
        onEditClose={() => setEditSchema(null)}
        onUpdated={() => { showToast("Schema updated successfully."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
