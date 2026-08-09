"use client";

import type { BusinessClaim } from "../../types";

type Props = {
  claim: BusinessClaim | null;
  placeName?: string;
  onClose: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: BusinessClaim["status"] }) {
  const map = {
    PENDING: "bx w",
    IN_REVIEW: "bx w",
    APPROVED: "bx s",
    REJECTED: "bx d",
    REVOKED: "bx m",
  };
  return <span className={map[status]}>{status}</span>;
}

export default function DetailModal({ claim, placeName, onClose }: Props) {
  if (!claim) return null;

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 480, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Claim details</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Business" value={placeName ?? `place #${claim.placeId}`} />
          <Row label="Contact name" value={claim.contactName ?? "—"} />
          <Row label="Job title" value={claim.jobTitle ?? "—"} />
          <Row label="Email" value={claim.claimEmail ?? "—"} />
          <Row label="Phone" value={claim.claimPhone ?? "—"} />
          <Row label="Verification method" value={claim.verificationMethod ?? "—"} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</span>
            <StatusBadge status={claim.status} />
          </div>
          <Row label="Submitted" value={formatDate(claim.createdAt)} />
          {claim.reviewedAt && <Row label="Reviewed" value={formatDate(claim.reviewedAt)} />}
          {claim.reviewerId && <Row label="Reviewed by" value={claim.reviewerId} />}
          {claim.rejectionReason && <Row label="Rejection reason" value={claim.rejectionReason} />}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 10, gap: 12 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
    </div>
  );
}
