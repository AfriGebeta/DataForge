"use client";

import { useEffect, useState } from "react";
import { updateWorkerSchema } from "../../api";
import type { UpdateWorkerSchemaRequest, WorkerSchema } from "../../types";

type Props = {
  schema: WorkerSchema | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditSchemaModal({ schema, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateWorkerSchemaRequest>({ jsonSchema: {}, description: "", isActive: true });
  const [jsonRaw, setJsonRaw] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schema) {
      setForm({ jsonSchema: schema.jsonSchema, description: schema.description ?? "", isActive: schema.isActive });
      setJsonRaw(JSON.stringify(schema.jsonSchema, null, 2));
      setError(null);
    }
  }, [schema]);

  if (!schema) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
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
      await updateWorkerSchema(schema.id, { ...form, jsonSchema: parsed });
      onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update schema.");
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Edit schema</span>
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
              <label className="fl">Name</label>
              <input type="text" value={schema.name} readOnly style={{ opacity: 0.5, cursor: "not-allowed" }} />
            </div>
            <div className="fg">
              <label className="fl">Version</label>
              <input type="text" value={`v${schema.version}`} readOnly style={{ opacity: 0.5, cursor: "not-allowed" }} />
            </div>
          </div>

          <div className="fg">
            <label className="fl">Description</label>
            <input type="text" name="description" placeholder="Optional description" value={form.description} onChange={handleChange} />
          </div>

          <div className="fg">
            <label className="fl">JSON Schema <span>*</span></label>
            <textarea
              rows={10}
              value={jsonRaw}
              onChange={(e) => setJsonRaw(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, resize: "vertical" }}
            />
          </div>

          <div className="fg" style={{ display: "flex", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              Active
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn p" onClick={handleSubmit} disabled={submitting}>
            <i className="ti ti-check" />
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
