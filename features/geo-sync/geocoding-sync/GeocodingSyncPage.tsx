"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CloudUpload,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { Progress } from "@/components/ui/progress";

import {
  fetchFieldConfig,
  fetchReplaceAllJob,
  fetchReplaceAllJobs,
  previewFieldConfig,
  saveFieldConfig,
  startReplaceAll,
} from "./api";
import type { FieldConfig, PreviewResult, ReplaceAllJob } from "./types";

const inputClass =
  "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[12px] text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-muted)] hover:bg-[color:var(--surface-3)] focus:border-[color:var(--orange-400)]/40";

function statusTone(status: ReplaceAllJob["status"]) {
  switch (status) {
    case "COMPLETED":
      return "bg-[color:var(--text-success)]/15 text-[color:var(--text-success)] border-[color:var(--text-success)]/25";
    case "FAILED":
      return "bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] border-[color:var(--text-danger)]/25";
    case "RUNNING":
      return "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] border-[color:var(--orange-400)]/25";
    default:
      return "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] border-[color:var(--border)]";
  }
}

export default function GeocodingSyncPage() {
  // ── Field config / template editor state ──────────────────────────
  const [config, setConfig] = useState<FieldConfig | null>(null);
  const [template, setTemplate] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Preview pane state ─────────────────────────────────────────────
  const [previewPlaceId, setPreviewPlaceId] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);

  // ── Replace-all job state ───────────────────────────────────────────
  const [job, setJob] = useState<ReplaceAllJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirmArmed, setConfirmArmed] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const cfg = await fetchFieldConfig();
      setConfig(cfg);
      setTemplate(cfg.template);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Failed to load field config");
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const loadLastJob = useCallback(async () => {
    try {
      const jobs = await fetchReplaceAllJobs(1);
      setJob(jobs[0] ?? null);
    } catch {
      // last-sync strip is best-effort — silently leave it empty
    }
  }, []);

  useEffect(() => {
    void loadConfig();
    void loadLastJob();
  }, [loadConfig, loadLastJob]);

  // Poll a running job every 2s until it settles.
  useEffect(() => {
    if (!job || job.status !== "RUNNING") return;
    const id = setInterval(async () => {
      try {
        const updated = await fetchReplaceAllJob(job.id);
        setJob(updated);
      } catch {
        // keep showing the last known state on a transient poll failure
      }
    }, 2000);
    return () => clearInterval(id);
  }, [job]);

  function insertToken(token: string) {
    const el = textareaRef.current;
    const text = `{{${token}}}`;
    if (!el) {
      setTemplate((prev) => prev + text);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const next = template.slice(0, start) + text + template.slice(end);
    setTemplate(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + text.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const saved = await saveFieldConfig(template);
      setConfig(saved);
      setTemplate(saved.template);
      setSaveOk(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  function handleResetToDefault() {
    if (!config) return;
    setTemplate(config.default_template);
    setSaveOk(false);
    setSaveError(null);
  }

  async function handlePreview() {
    setPreviewing(true);
    setPreviewError(null);
    try {
      const placeId = previewPlaceId.trim() ? Number(previewPlaceId.trim()) : undefined;
      const result = await previewFieldConfig(template, placeId);
      setPreviewResult(result);
    } catch (cause) {
      setPreviewResult(null);
      setPreviewError(cause instanceof Error ? cause.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleReplaceAll() {
    if (!confirmArmed) {
      setConfirmArmed(true);
      return;
    }
    setConfirmArmed(false);
    setStarting(true);
    setJobError(null);
    try {
      const started = await startReplaceAll();
      setJob(started);
    } catch (cause) {
      setJobError(cause instanceof Error ? cause.message : "Failed to start replace-all");
    } finally {
      setStarting(false);
    }
  }

  const progressPct = job && job.total_places > 0 ? Math.round((job.processed_places / job.total_places) * 100) : 0;
  const isDirty = config ? template !== config.template : false;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[18px] font-semibold text-[color:var(--text-primary)]">
            Geocoding Sync
          </h1>
          <p className="mt-1 max-w-2xl text-[12.5px] text-[color:var(--text-secondary)]">
            Controls what forge sends to go-schema&apos;s <code>geocoding</code> table — a full
            replace of go-schema&apos;s data, and the live template every place create/review/edit/
            merge is sent through automatically.
          </p>
        </div>

        {job ? (
          <div className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-[11.5px]">
            <span className="text-[color:var(--text-muted)]">Last sync</span>
            <Badge variant="outline" className={statusTone(job.status)}>
              {job.status}
            </Badge>
            <span className="text-[color:var(--text-secondary)]">
              {new Date(job.finished_at ?? job.updated_at).toLocaleString()}
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Replace Data ─────────────────────────────────────────────── */}
      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[13.5px]">
            <CloudUpload className="h-4 w-4 text-[color:var(--orange-400)]" />
            Replace Data
          </CardTitle>
          <button
            type="button"
            onClick={() => void handleReplaceAll()}
            disabled={starting || job?.status === "RUNNING"}
            className={
              confirmArmed
                ? "inline-flex items-center gap-1.5 rounded-md border border-[color:var(--text-danger)]/40 bg-[color:var(--text-danger)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/25 disabled:pointer-events-none disabled:opacity-40"
                : "inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
            }
          >
            {starting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CloudUpload className="h-3.5 w-3.5" />
            )}
            {confirmArmed ? "Click again to confirm — overwrites go-schema" : "Replace Data"}
          </button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-[11.5px] text-[color:var(--text-secondary)]">
            Overwrites every row in go-schema&apos;s <code>geocoding</code> table with every
            currently-eligible place (active, visible, review completed), rendered through the
            saved template below. Destructive on the go-schema side — this cannot be undone short
            of running it again.
          </p>

          {jobError ? (
            <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
              {jobError}
            </div>
          ) : null}

          {job ? (
            <div className="flex flex-col gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="flex items-center gap-2 text-[color:var(--text-secondary)]">
                  <Badge variant="outline" className={statusTone(job.status)}>
                    {job.status}
                  </Badge>
                  {job.processed_places} / {job.total_places} places processed
                </span>
                <span className="text-[color:var(--text-muted)]">
                  {job.upserted_places} sent · {job.failed_places} skipped
                </span>
              </div>
              <Progress value={job.status === "RUNNING" ? progressPct : 100} />
              {job.error_message ? (
                <div className="flex items-start gap-1.5 text-[11px] text-[color:var(--text-danger)]">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{job.error_message}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </GlassCard>

      {/* ── Field Mapping ────────────────────────────────────────────── */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-[13.5px]">Field Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConfig ? (
            <div className="flex items-center gap-2 py-6 text-[12px] text-[color:var(--text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading template…
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
              {/* Field picker sidebar */}
              <div className="flex max-h-[520px] flex-col gap-3 overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
                {config?.registry.map((group) => (
                  <div key={group.name} className="flex flex-col gap-1.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                      {group.name}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {group.tokens.map((token) => (
                        <button
                          key={token.name}
                          type="button"
                          onClick={() => insertToken(token.name)}
                          title={`Insert {{${token.name}}}`}
                          className="rounded border border-[color:var(--border)] bg-[color:var(--surface-1)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--text-secondary)] transition hover:border-[color:var(--orange-400)]/40 hover:text-[color:var(--orange-400)]"
                        >
                          {token.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Template editor + preview */}
              <div className="flex flex-col gap-3">
                <textarea
                  ref={textareaRef}
                  value={template}
                  onChange={(e) => {
                    setTemplate(e.target.value);
                    setSaveOk(false);
                  }}
                  rows={16}
                  spellCheck={false}
                  className={`${inputClass} font-mono leading-5`}
                />

                {config?.required_columns ? (
                  <p className="text-[10.5px] text-[color:var(--text-muted)]">
                    Required columns (must render present and non-null): {config.required_columns.join(", ")}
                  </p>
                ) : null}

                {saveError ? (
                  <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
                    {saveError}
                  </div>
                ) : null}
                {saveOk && !isDirty ? (
                  <div className="flex items-center gap-1.5 rounded-md border border-[color:var(--text-success)]/30 bg-[color:var(--text-success)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-success)]">
                    <Check className="h-3.5 w-3.5" />
                    Template saved.
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to default
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving || !isDirty}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save template
                  </button>
                </div>

                {/* Preview pane */}
                <div className="flex flex-col gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={previewPlaceId}
                      onChange={(e) => setPreviewPlaceId(e.target.value)}
                      placeholder="place id (optional — defaults to most recent eligible place)"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => void handlePreview()}
                      disabled={previewing}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:pointer-events-none disabled:opacity-40"
                    >
                      {previewing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Preview
                    </button>
                  </div>

                  {previewError ? (
                    <div className="rounded-md border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/10 px-3 py-2 text-[11.5px] text-[color:var(--text-danger)]">
                      {previewError}
                    </div>
                  ) : null}

                  {previewResult ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[11.5px]">
                        <Badge
                          variant="outline"
                          className={
                            previewResult.valid
                              ? "border-[color:var(--text-success)]/25 bg-[color:var(--text-success)]/15 text-[color:var(--text-success)]"
                              : "border-[color:var(--text-danger)]/25 bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)]"
                          }
                        >
                          {previewResult.valid ? "Valid" : "Missing required column"}
                        </Badge>
                        {previewResult.used_fixture ? (
                          <span className="text-[color:var(--text-muted)]">
                            no eligible place yet — rendered against a synthetic fixture
                          </span>
                        ) : previewResult.place_id !== undefined ? (
                          <span className="text-[color:var(--text-muted)]">place #{previewResult.place_id}</span>
                        ) : null}
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 text-[11px] text-[color:var(--text-primary)]">
                        {JSON.stringify(previewResult.rendered, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
