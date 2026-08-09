"use client";

import { useState } from "react";
import { createComment } from "../../api";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY = {
  placeId: "",
  userId: "",
  body: "",
  photoUrl: "",
};

export default function CreateModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.placeId.trim()) {
      setError("Place ID is required.");
      return;
    }
    if (!form.userId.trim()) {
      setError("User ID is required.");
      return;
    }
    if (!form.body.trim()) {
      setError("Comment body is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createComment({
        placeId: form.placeId.trim(),
        userId: form.userId.trim(),
        body: form.body.trim(),
        photoUrl: form.photoUrl || undefined,
      });
      onCreated();
      onClose();
      setForm(EMPTY);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 440, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add comment</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div className="fg">
            <label className="fl">Place ID</label>
            <input type="text" inputMode="numeric" name="placeId" placeholder="e.g. 101" value={form.placeId} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">User ID</label>
            <input type="text" name="userId" placeholder="map-app user id" value={form.userId} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Comment</label>
            <textarea name="body" rows={4} placeholder="Comment text" value={form.body} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">Photo URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input type="text" name="photoUrl" placeholder="https://..." value={form.photoUrl} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Adding..." : "Add comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
