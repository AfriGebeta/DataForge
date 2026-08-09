"use client";

import { useState } from "react";
import { deleteUser } from "../../api";
import type { AdminUser } from "../../types";

type Props = {
  user: AdminUser | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteConfirmModal({ user, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(user.id);
      onDeleted();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 400, overflowY: "auto" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Delete user</span>
          <button className="btn sm ghost" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 6 }}>
            Are you sure you want to delete <strong>{user.fullName ?? user.email}</strong>?
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            This action cannot be undone.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn d" onClick={handleDelete} disabled={deleting} style={{ padding: "5px 14px" }}>
            <i className="ti ti-trash" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
