"use client";

import { useEffect, useState } from "react";
import { updateComment } from "../../api";
import type { PlaceComment } from "../../types";

type Props = {
  comment: PlaceComment | null;
  onClose: () => void;
  onEdited: () => void;
};

export default function EditModal({ comment, onClose, onEdited }: Props) {
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!comment) return;
    setBody(comment.body);
    setPhotoUrl(comment.photoUrl ?? "");
    setError(null);
  }, [comment]);

  if (!comment) return null;

  const handleSubmit = async () => {
    if (!body.trim()) {
      setError("Comment body is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateComment(comment.id, {
        body: body.trim(),
        photoUrl: photoUrl || undefined,
      });
      onEdited();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update comment.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit comment</span>
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
            <label className="fl">Place</label>
            <input type="text" value={`place #${comment.placeId}`} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="fg">
            <label className="fl">User</label>
            <input type="text" value={comment.userId} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="fg">
            <label className="fl">Comment</label>
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Photo URL</label>
            <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
