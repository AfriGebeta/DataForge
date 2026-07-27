"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { fetchClaims } from "../../api";
import type { BusinessClaim, ClaimStatus } from "../../types";
import ActionModals from "../action-modals";
import ClaimsSection from "./ClaimsSection";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "">("");
  const [detailClaim, setDetailClaim] = useState<BusinessClaim | null>(null);
  const [approveClaim, setApproveClaim] = useState<BusinessClaim | null>(null);
  const [rejectClaim, setRejectClaim] = useState<BusinessClaim | null>(null);
  const [cancelClaim, setCancelClaim] = useState<BusinessClaim | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchClaims({ status: statusFilter || undefined });
      setClaims(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load claims right now.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>{error}</div>
      )}

      <ClaimsSection
        claims={claims}
        loading={loading}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onRefresh={load}
        onDetail={(claim) => setDetailClaim(claim)}
        onApprove={(claim) => setApproveClaim(claim)}
        onReject={(claim) => setRejectClaim(claim)}
        onCancel={(claim) => setCancelClaim(claim)}
      />

      <ActionModals
        detailClaim={detailClaim}
        onDetailClose={() => setDetailClaim(null)}
        approveClaim={approveClaim}
        onApproveClose={() => setApproveClaim(null)}
        onApproved={() => { showToast("Claim approved."); void load(); }}
        rejectClaim={rejectClaim}
        onRejectClose={() => setRejectClaim(null)}
        onRejected={() => { showToast("Claim rejected."); void load(); }}
        cancelClaim={cancelClaim}
        onCancelClose={() => setCancelClaim(null)}
        onCancelled={() => { showToast("Claim cancelled."); void load(); }}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
