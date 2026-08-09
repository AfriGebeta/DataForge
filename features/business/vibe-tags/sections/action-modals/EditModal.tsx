"use client";

import { useEffect, useState } from "react";
import { updateVibeTag } from "../../api";
import type { VibeTag } from "../../types";

type Props = {
  tag: VibeTag | null;
  onClose: () => void;
  onEdited: () => void;
};

export default function EditModal({ tag, onClose, onEdited }: Props) {
  const [tagText, setTagText] = useState("");
  const [confidence, setConfidence] = useState("0.5");
  const [mentionCount, setMentionCount] = useState("1");
  const [language, setLanguage] = useState("");
  const [rawSnippet, setRawSnippet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    setTagText(tag.tag);
    setConfidence(String(tag.confidence));
    setMentionCount(String(tag.mentionCount));
    setLanguage(tag.language ?? "");
    setRawSnippet(tag.rawSnippet ?? "");
    setError(null);
  }, [tag]);

  if (!tag) return null;

  const handleSubmit = async () => {
    if (!tagText.trim()) {
      setError("Tag is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateVibeTag(tag.id, {
        tag: tagText.trim(),
        confidence: confidence ? Number(confidence) : undefined,
        mentionCount: mentionCount ? Number(mentionCount) : undefined,
        language: language || undefined,
        rawSnippet: rawSnippet || undefined,
      });
      onEdited();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update vibe tag.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit vibe tag</span>
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
            <input type="text" value={`place #${tag.placeId}`} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="fg">
            <label className="fl">Tag</label>
            <input type="text" value={tagText} onChange={(e) => setTagText(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Confidence (0–1)</label>
            <input type="number" min={0} max={1} step={0.05} value={confidence} onChange={(e) => setConfidence(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Mention count</label>
            <input type="number" min={0} step={1} value={mentionCount} onChange={(e) => setMentionCount(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Language</label>
            <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>

          <div className="fg">
            <label className="fl">Raw snippet</label>
            <textarea rows={3} value={rawSnippet} onChange={(e) => setRawSnippet(e.target.value)} />
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
