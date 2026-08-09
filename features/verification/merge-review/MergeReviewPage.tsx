"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";
import {
  applyMerge,
  fetchMergeDiff,
  fetchPendingMergeForPlace,
  fetchPlaceSummary,
  rejectMerge,
} from "./api";
import type {
  FieldChoice,
  FieldChoiceSource,
  MergeDiff,
  MergeFieldResolution,
  MergeRecord,
  PlaceSummary,
} from "./types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneBadgeVariant: Record<Tone, string> = {
  neutral: "bg-white/5 text-white/70 border-white/10",
  accent: "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] border-[color:var(--orange-400)]/30",
  success: "bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] border-[color:var(--text-success)]/25",
  warning: "bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)] border-[color:var(--text-warning)]/25",
  danger: "bg-[color:var(--text-danger)]/12 text-[color:var(--text-danger)] border-[color:var(--text-danger)]/25",
};

function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("font-mono tracking-wide text-[10px] px-2 py-0.5", toneBadgeVariant[tone])}>
      {children}
    </Badge>
  );
}

function statusTone(status: MergeRecord["status"]): Tone {
  if (status === "APPLIED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

function shortId(id: string | number | undefined): string {
  if (id == null) return "—";
  const s = String(id);
  return s.length > 8 ? `${s.slice(0, 8)}…` : s;
}

function fmtDate(s: string | undefined): string {
  if (!s) return "";
  return new Date(s).toLocaleString();
}

function placeName(p: PlaceSummary | null): string {
  if (!p) return "(unknown)";
  const primary = p.names.find((n) => n.isPrimary) ?? p.names[0];
  return primary ? primary.name : "(unnamed)";
}

function parseCustomInput(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function stringify(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ── Resolve control — per differing field/key, pick winner/loser/custom.
// Ported 1:1 from PlaceForge/scripts/merge_review.html's resolve-ctl widget.
function ResolveControl({
  choice,
  onChange,
}: {
  choice: FieldChoice;
  onChange: (choice: FieldChoice) => void;
}) {
  const source = choice.source ?? "winner";
  return (
    <div className="flex items-center gap-2">
      <select
        value={source}
        onChange={(e) => {
          const s = e.target.value as FieldChoiceSource;
          onChange(s === "winner" ? { source: "winner" } : { source: s, value: choice.value });
        }}
        className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11.5px] text-white/80 outline-none"
      >
        <option value="winner">Keep winner</option>
        <option value="loser">Take loser</option>
        <option value="custom">Custom…</option>
      </select>
      {source === "custom" ? (
        <input
          autoFocus
          className="w-32 rounded-md border border-[color:var(--orange-400)]/40 bg-white/[0.03] px-2 py-1 font-mono text-[11.5px] text-white/85 outline-none"
          placeholder="corrected value"
          value={typeof choice.value === "string" ? choice.value : choice.value != null ? JSON.stringify(choice.value) : ""}
          onChange={(e) => onChange({ source: "custom", value: e.target.value })}
        />
      ) : null}
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="text-[11.5px] text-white/70">
      <div className="mb-1 font-medium text-white/85">{title}</div>
      <ul className="list-inside list-disc space-y-0.5 text-white/60">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const tableWrap = "overflow-hidden rounded-lg ring-1 ring-inset ring-white/10";
const th = "px-4 py-2.5 font-medium";
const td = "px-4 py-2.5";

type Props = { placeId: number };

export default function MergeReviewPage({ placeId }: Props) {
  const router = useRouter();
  const [merge, setMerge] = useState<MergeRecord | null>(null);
  const [diff, setDiff] = useState<MergeDiff | null>(null);
  const [winner, setWinner] = useState<PlaceSummary | null>(null);
  const [loser, setLoser] = useState<PlaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [placeChoices, setPlaceChoices] = useState<Record<string, FieldChoice>>({});
  const [attrChoices, setAttrChoices] = useState<Record<string, FieldChoice>>({});
  const [nameChoices, setNameChoices] = useState<Record<string, FieldChoice>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    const found = await fetchPendingMergeForPlace(placeId);
    if (!found) {
      setMerge(null);
      setNotFound(true);
      setLoading(false);
      return;
    }
    setMerge(found);
    setPlaceChoices({});
    setAttrChoices({});
    setNameChoices({});
    const [d, w, l] = await Promise.all([
      fetchMergeDiff(found.id),
      fetchPlaceSummary(found.winner_id),
      fetchPlaceSummary(found.loser_id),
    ]);
    setDiff(d);
    setWinner(w);
    setLoser(l);
    setLoading(false);
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildResolution(): MergeFieldResolution {
    const resolution: MergeFieldResolution = {};

    const place: Record<string, FieldChoice> = {};
    Object.entries(placeChoices).forEach(([key, c]) => {
      if (c.source === "loser") place[key] = { source: "loser" };
      else if (c.source === "custom") place[key] = { source: "custom", value: parseCustomInput(c.value) };
    });
    if (Object.keys(place).length) resolution.place = place;

    const attributes: Record<string, FieldChoice> = {};
    Object.entries(attrChoices).forEach(([key, c]) => {
      if (c.source === "loser") attributes[key] = { source: "loser" };
      else if (c.source === "custom") attributes[key] = { source: "custom", value: parseCustomInput(c.value) };
    });
    if (Object.keys(attributes).length) resolution.attributes = attributes;

    const names: Record<string, FieldChoice> = {};
    Object.entries(nameChoices).forEach(([key, c]) => {
      if (c.source === "loser") names[key] = { source: "loser" };
      else if (c.source === "custom") names[key] = { source: "custom", value: c.value };
    });
    if (Object.keys(names).length) resolution.names = names;

    return resolution;
  }

  async function handleApply() {
    if (!merge) return;
    setActing(true);
    const result = await applyMerge(merge.id, buildResolution());
    setActing(false);
    if (result) {
      setToast(`Merge applied — #${merge.loser_id} deactivated into #${merge.winner_id}.`);
      router.push("/verification/queue");
    } else {
      setToast("Apply failed — check the backend is reachable.");
    }
  }

  async function handleReject() {
    if (!merge) return;
    setActing(true);
    const result = await rejectMerge(merge.id, undefined, rejectionReason.trim() || undefined);
    setActing(false);
    if (result) {
      setToast("Merge rejected — no data changed.");
      router.push("/verification/queue");
    } else {
      setToast("Reject failed — check the backend is reachable.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-white/50">Loading…</div>
    );
  }

  if (notFound || !merge) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-[13px] text-white/50">
        <p>No pending merge proposal found for place #{placeId}.</p>
        <Link href="/verification/queue" className="text-[color:var(--orange-400)]">
          Back to Verification Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12">
      <div className="aurora-bg" aria-hidden />

      <div className="relative z-10 flex flex-col gap-7">
        <div>
          <Link
            href="/verification/queue"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/55 transition hover:text-white"
          >
            ← Back to Verification Queue
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="font-display-tight text-[26px] font-semibold text-white">
              Merge {shortId(merge.id)}
            </h2>
            <StatusBadge tone={statusTone(merge.status)}>{merge.status}</StatusBadge>
          </div>
        </div>

        {toast && (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-[12px] text-white/80">
            {toast}
          </div>
        )}

        {/* Order banner */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <GlassCard tone="danger" className="flex-1">
            <CardContent className="px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
                Loser — merged away
              </div>
              <div className="mt-1 text-[14px] font-semibold text-white/90">{placeName(loser)}</div>
              <div className="mt-1 font-mono text-[11.5px] text-white/50">#{merge.loser_id}</div>
            </CardContent>
          </GlassCard>

          <ArrowRight className="hidden h-5 w-5 shrink-0 text-white/30 sm:block" />

          <GlassCard tone="success" className="flex-1">
            <CardContent className="px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
                Winner — survives
              </div>
              <div className="mt-1 text-[14px] font-semibold text-white/90">{placeName(winner)}</div>
              <div className="mt-1 font-mono text-[11.5px] text-white/50">#{merge.winner_id}</div>
            </CardContent>
          </GlassCard>
        </div>

        <GlassCard>
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="font-display text-[13px] font-semibold text-white/80">Reason</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 pt-3 text-[12.5px] text-white/70">
            {merge.merge_reason || "(none given)"}
          </CardContent>
        </GlassCard>

        {/* Place field differences */}
        <GlassCard>
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="font-display text-[13px] font-semibold text-white/80">
              Place field differences
            </CardTitle>
            <p className="mt-1 text-[11px] text-white/40">
              If neither value is right, pick &quot;Custom…&quot; and type the corrected one.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {!diff || Object.keys(diff.place).length === 0 ? (
              <div className="py-4 text-center text-[12px] text-white/45">No differing core fields.</div>
            ) : (
              <div className={tableWrap}>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className={th}>Field</th>
                      <th className={th}>Winner value</th>
                      <th className={th}>Loser value</th>
                      <th className={th}>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(diff.place).map(([field, d]) => (
                      <tr key={field} className="border-t border-white/[0.06]">
                        <td className={cn(td, "font-mono text-white/60")}>{field}</td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] font-mono text-white/85")}>
                          {stringify(d.winner)}
                        </td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] font-mono text-white/85")}>
                          {stringify(d.loser)}
                        </td>
                        <td className={td}>
                          <ResolveControl
                            choice={placeChoices[field] ?? { source: "winner" }}
                            onChange={(c) => setPlaceChoices((prev) => ({ ...prev, [field]: c }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Names */}
        <GlassCard>
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="font-display text-[13px] font-semibold text-white/80">Names</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-4">
            {diff && diff.names.conflicts.length > 0 ? (
              <div className={tableWrap}>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className={th}>Language</th>
                      <th className={th}>Winner name</th>
                      <th className={th}>Loser name</th>
                      <th className={th}>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.names.conflicts.map((c) => (
                      <tr key={c.language_code} className="border-t border-white/[0.06]">
                        <td className={cn(td, "font-mono text-white/60")}>{c.language_code}</td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] text-white/85")}>{c.winner_name}</td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] text-white/85")}>{c.loser_name}</td>
                        <td className={td}>
                          <ResolveControl
                            choice={nameChoices[c.language_code] ?? { source: "winner" }}
                            onChange={(ch) => setNameChoices((prev) => ({ ...prev, [c.language_code]: ch }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <InfoList
              title="Only on loser (would be added to winner):"
              items={(diff?.names.loser_only ?? []).map((n) => `[${n.language_code}] ${n.name}${n.is_primary ? " (primary)" : ""}`)}
            />
            <InfoList
              title="Only on winner:"
              items={(diff?.names.winner_only ?? []).map((n) => `[${n.language_code}] ${n.name}`)}
            />
            {diff && diff.names.conflicts.length === 0 && diff.names.loser_only.length === 0 && diff.names.winner_only.length === 0 ? (
              <div className="text-[12px] text-white/45">No differences.</div>
            ) : null}
          </CardContent>
        </GlassCard>

        {/* Attributes */}
        <GlassCard>
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="font-display text-[13px] font-semibold text-white/80">Attributes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-6 pt-4">
            {diff && diff.attributes.conflicts.length > 0 ? (
              <div className={tableWrap}>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/45">
                      <th className={th}>Key</th>
                      <th className={th}>Winner value</th>
                      <th className={th}>Loser value</th>
                      <th className={th}>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diff.attributes.conflicts.map((c) => (
                      <tr key={c.key} className="border-t border-white/[0.06]">
                        <td className={cn(td, "font-mono text-white/60")}>{c.key}</td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] font-mono text-white/85")}>
                          {stringify(c.winner_value)}
                        </td>
                        <td className={cn(td, "bg-[color:var(--text-warning)]/[0.06] font-mono text-white/85")}>
                          {stringify(c.loser_value)}
                        </td>
                        <td className={td}>
                          <ResolveControl
                            choice={attrChoices[c.key] ?? { source: "winner" }}
                            onChange={(ch) => setAttrChoices((prev) => ({ ...prev, [c.key]: ch }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <InfoList
              title="Only on loser (would be added to winner):"
              items={(diff?.attributes.loser_only ?? []).map((a) => `${a.key} = ${stringify(a.value)}`)}
            />
            <InfoList
              title="Only on winner:"
              items={(diff?.attributes.winner_only ?? []).map((a) => `${a.key} = ${stringify(a.value)}`)}
            />
            {diff && diff.attributes.conflicts.length === 0 && diff.attributes.loser_only.length === 0 && diff.attributes.winner_only.length === 0 ? (
              <div className="text-[12px] text-white/45">No differences.</div>
            ) : null}
          </CardContent>
        </GlassCard>

        {/* Contacts */}
        <GlassCard>
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="font-display text-[13px] font-semibold text-white/80">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4">
            {diff && diff.contacts.loser_only.length > 0 ? (
              <InfoList
                title="Only on loser (would be added to winner):"
                items={diff.contacts.loser_only.map((c) => `${c.type}: ${c.value}`)}
              />
            ) : (
              <div className="text-[12px] text-white/45">No differences.</div>
            )}
          </CardContent>
        </GlassCard>

        {/* Actions / review metadata */}
        <GlassCard tone="accent">
          <CardContent className="flex flex-col gap-3 px-6 py-5">
            {merge.status !== "PENDING" ? (
              <div className="text-[11.5px] text-white/50">
                {[
                  merge.reviewed_by ? `reviewed by ${merge.reviewed_by}` : null,
                  merge.reviewed_at ? `at ${fmtDate(merge.reviewed_at)}` : null,
                  merge.merged_at ? `merged at ${fmtDate(merge.merged_at)}` : null,
                  merge.rejection_reason ? `reason: ${merge.rejection_reason}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleApply()}
                    disabled={acting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--text-success)]/30 bg-[color:var(--text-success)]/12 px-4 py-2 text-[12px] font-medium text-[color:var(--text-success)] transition hover:bg-[color:var(--text-success)]/20 disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Apply merge (per-field resolutions above, winner by default)
                  </button>
                  <input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Rejection reason (optional)"
                    className="min-w-[220px] flex-1 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/80 outline-none focus:border-[color:var(--orange-400)]/50"
                  />
                  <button
                    type="button"
                    onClick={() => void handleReject()}
                    disabled={acting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 px-4 py-2 text-[12px] font-medium text-[color:var(--text-danger)] transition hover:bg-[color:var(--text-danger)]/20 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject merge
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
