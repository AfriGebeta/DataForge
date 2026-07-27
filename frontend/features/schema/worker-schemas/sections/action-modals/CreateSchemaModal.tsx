"use client";

import { useState } from "react";
import { createWorkerSchema } from "../../api";
import type { CreateWorkerSchemaRequest } from "../../types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const defaultForm: CreateWorkerSchemaRequest = {
  name: "",
  jsonSchema: {},
  description: "",
  isActive: true,
};

export default function CreateSchemaModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateWorkerSchemaRequest>(defaultForm);
  const [jsonRaw, setJsonRaw] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name) {
      setError("Name is required.");
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonRaw);
    } catch {
      setError("JSON Schema is not valid JSON.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createWorkerSchema({ ...form, jsonSchema: parsed });
      onCreated();
      onClose();
      setForm(defaultForm);
      setJsonRaw("{}");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create schema.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ display: "flex", position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, width: 520, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Create worker schema</span>
          <button className="btn sm ghost" onClick={onClose}><i className="ti ti-x" /></button>
        </div>

        <div style={{ padding: 18 }}>
          {error && (
            <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
              <i className="ti ti-alert-circle" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div className="fr">
            <div className="fg">
              <label className="fl">Name <span>*</span></label>
              <input type="text" name="name" placeholder="poi-v1" value={form.name} onChange={handleChange} />
            </div>
            <div className="fg">
              <label className="fl">Description</label>
              <input type="text" name="description" placeholder="Optional description" value={form.description} onChange={handleChange} />
            </div>
          </div>

          <div className="fg">
            <label className="fl">JSON Schema <span>*</span></label>
            <textarea
              name="jsonRaw"
              rows={10}
              placeholder={'{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string" }\n  }\n}'}
              value={jsonRaw}
              onChange={(e) => setJsonRaw(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, resize: "vertical" }}
            />
          </div>

          <div className="fg" style={{ display: "flex", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active on creation
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
