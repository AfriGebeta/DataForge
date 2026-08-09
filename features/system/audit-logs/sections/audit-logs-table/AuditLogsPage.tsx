"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchAuditLogs } from "../../api";
import type { AuditLogItem } from "../../types";
import { exportAuditLogsToCSV } from "../export";
import AuditLogsSection from "./AuditLogsSection";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogs({ page, pageSize: 25 });
      setLogs(res.data);
      setTotal(res.total);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load audit logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = useCallback(async () => {
    await exportAuditLogsToCSV(showToast, { page, pageSize: 25 });
  }, [page, showToast]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <AuditLogsSection
        logs={logs}
        loading={loading}
        total={total}
        page={page}
        onPageChange={setPage}
        onExport={handleExport}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}