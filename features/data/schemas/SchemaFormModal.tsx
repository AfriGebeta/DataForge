"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { createWorkerSchema, updateWorkerSchema } from "./api";
import type { WorkerSchema } from "./types";

const inputClass =
  "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[12px] text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)] focus:border-[color:var(--orange-400)]/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const defaultSchema =
  '{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "required": ["name", "latitude", "longitude"]\n}';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: WorkerSchema | null;
};

export default function SchemaFormModal({ isOpen, onClose, onSaved, editing }: Props) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("1");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [schemaText, setSchemaText] = useState(defaultSchema);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(editing?.name ?? "");
      setVersion(String(editing?.version ?? 1));
      setDescription(editing?.description ?? "");
      setIsActive(editing?.is_active ?? true);
      setSchemaText(editing ? JSON.stringify(editing.json_schema, null, 2) : defaultSchema);
      setError(null);
    }
  }, [isOpen, editing]);

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!name.trim() && !editing) {
      setError("Schema name is required.");
      return;
    }

    let parsedSchema: unknown;
    try {
      parsedSchema = JSON.parse(schemaText);
    } catch {
      setError("JSON schema must be valid JSON.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateWorkerSchema(editing.id, {
          json_schema: parsedSchema,
          description: description.trim() || null,
          is_active: isActive,
        });
      } else {
        await createWorkerSchema({
          name: name.trim(),
          version: Number(version) || 1,
          json_schema: parsedSchema,
          description: description.trim() || null,
          is_active: isActive,
        });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save schema");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <span className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
            {editing ? "Edit worker schema" : "Create worker schema"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Schema name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="poi-v1"
                disabled={Boolean(editing)}
                className={inputClass}
              />
            </Field>
            <Field label="Version *">
              <input
                type="number"
                min={1}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={Boolean(editing)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Parsed POI output schema"
              className={inputClass}
            />
          </Field>

          <Field label="JSON Schema (draft-07) *">
            <textarea
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              rows={7}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <label className="flex items-center gap-2 text-[12px] text-[color:var(--text-secondary)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-3.5 w-3.5 accent-[color:var(--orange-400)]"
            />
            Active
          </label>

          {error ? (
            <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {editing ? "Save changes" : "Create schema"}
          </button>
        </div>
      </div>
    </div>
  );
}
