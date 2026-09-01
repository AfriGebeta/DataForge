"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  createInformalArea,
  deleteInformalArea,
  fetchInformalAreas,
  updateInformalArea,
} from "./api";
import { informalAreaName } from "./types";
import type { InformalArea } from "./types";

// Leaflet touches `window` at module load time, which crashes during
// Next's server render of this "use client" tree - same reason
// ../nodes/AddressNodesPage.tsx and ../conflicts/ConflictsPage.tsx load
// their maps client-only.
const InformalAreaMap = dynamic(() => import("./InformalAreaMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-1)",
        color: "var(--text-muted)",
        fontSize: 12,
      }}
    >
      Loading map…
    </div>
  ),
});

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/12 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/20 disabled:opacity-40";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40";
const fieldLabelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]";
const fieldInputClass =
  "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50";

type FormValues = { nameEn: string; nameAm: string; latitude: string; longitude: string };

const emptyForm: FormValues = { nameEn: "", nameAm: "", latitude: "", longitude: "" };

function areaToForm(area: InformalArea): FormValues {
  return {
    nameEn: area.name.en ?? "",
    nameAm: area.name.am ?? "",
    latitude: String(area.latitude),
    longitude: String(area.longitude),
  };
}

export default function InformalAreasPage() {
  const [areas, setAreas] = useState<InformalArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Same "one form serves create and edit" shape as most CRUD pages in this
  // codebase - `editingId === null` means the form (when open) is creating.
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAreas(await fetchInformalAreas({ search: search || undefined }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load informal areas.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    // Wrapped in a microtask so `load`'s own synchronous setLoading(true)/
    // setError(null) calls don't run directly in the effect body - same
    // fetchCurrentAdmin().then() pattern VerificationQueuePage uses to stay
    // off react-hooks/set-state-in-effect.
    void Promise.resolve().then(() => {
      void load();
    });
  }, [load]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditForm(area: InformalArea) {
    setEditingId(area.id);
    setForm(areaToForm(area));
    setFormError(null);
    setFormOpen(true);
    setSelectedId(area.id);
  }

  function closeForm() {
    setFormOpen(false);
    setFormError(null);
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    return (
      form.nameEn.trim().length > 0 &&
      form.latitude.trim() !== "" &&
      form.longitude.trim() !== "" &&
      Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      Number.isFinite(lng) &&
      lng >= -180 &&
      lng <= 180
    );
  }, [form]);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const name: Record<string, string> = { en: form.nameEn.trim() };
    if (form.nameAm.trim()) name.am = form.nameAm.trim();

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateInformalArea(editingId, {
          name,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        });
      } else {
        await createInformalArea({
          name,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        });
      }
      setFormOpen(false);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Failed to save informal area.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteInformalArea(id);
      if (selectedId === id) setSelectedId(null);
      if (editingId === id) closeForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete informal area.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="page-hd" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2>Informal Areas</h2>
          <p>
            Curated gazetteer points for colloquially-known areas with no formal administrative standing (e.g.
            &quot;Megenagna&quot;) — a fixed lat/lng a search can resolve to directly, deliberately separate from the
            Address hierarchy (see Address → Address). See PlaceForge&apos;s InformalArea model for why.
          </p>
        </div>
        <button type="button" onClick={openCreateForm} className={primaryButtonClass} style={{ flexShrink: 0 }}>
          <Plus size={14} /> Add Informal Area
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 320, marginBottom: 12 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(searchInput.trim());
          }}
          onBlur={() => setSearch(searchInput.trim())}
          placeholder="Search by name…"
          className={fieldInputClass}
          style={{ paddingLeft: 30 }}
        />
      </div>

      {loading ? <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading…</p> : null}
      {error ? <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p> : null}

      {!loading && !error && areas.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          No informal areas yet.
        </div>
      ) : null}

      {areas.length > 0 ? (
        <div className="g2" style={{ alignItems: "start" }}>
          <div className="card" style={{ maxHeight: 480, overflowY: "auto" }}>
            {areas.map((area) => (
              <div
                key={area.id}
                onClick={() => setSelectedId(area.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  width: "100%",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  background: area.id === selectedId ? "var(--surface-2)" : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{informalAreaName(area)}</div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {area.latitude.toFixed(5)}, {area.longitude.toFixed(5)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(area);
                    }}
                    className={secondaryButtonClass}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(area.id);
                    }}
                    disabled={deletingId === area.id}
                    className={secondaryButtonClass}
                    style={{ color: "var(--text-danger)" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <InformalAreaMap areas={areas} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      ) : null}

      {formOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <form
            onSubmit={(e) => void submitForm(e)}
            className="card"
            style={{ width: 380, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
          >
            <h3 style={{ margin: 0 }}>{editingId ? "Edit Informal Area" : "Add Informal Area"}</h3>

            <div>
              <span className={fieldLabelClass}>Name (English)</span>
              <input
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                placeholder="e.g. Megenagna"
                className={fieldInputClass}
              />
            </div>

            <div>
              <span className={fieldLabelClass}>Name (Amharic, optional)</span>
              <input
                value={form.nameAm}
                onChange={(e) => set("nameAm", e.target.value)}
                placeholder="e.g. መገናኛ"
                className={fieldInputClass}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span className={fieldLabelClass}>Latitude</span>
                <input
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  placeholder="9.0201"
                  inputMode="decimal"
                  className={fieldInputClass}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span className={fieldLabelClass}>Longitude</span>
                <input
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  placeholder="38.7960"
                  inputMode="decimal"
                  className={fieldInputClass}
                />
              </div>
            </div>

            {formError ? <div style={{ color: "var(--text-danger)", fontSize: 12 }}>{formError}</div> : null}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={closeForm} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !canSubmit} className={primaryButtonClass}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
