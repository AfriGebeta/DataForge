"use client";

import { useState } from "react";
import { deleteComment } from "../../api";
import type { PlaceComment } from "../../types";

type Props = {
  comment: PlaceComment | null;
  placeName?: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteModal({ comment, placeName, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!comment) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteComment(comment.id);
      onDeleted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 400 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Delete comment</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>
            Delete this comment by <strong>{comment.userId}</strong> on <strong>{placeName ?? `place #${comment.placeId}`}</strong>?
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            This permanently removes the comment. This cannot be undone.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn d" onClick={handleDelete} disabled={submitting} style={{ padding: "5px 14px" }}>
            <i className="ti ti-trash" />
            {submitting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
