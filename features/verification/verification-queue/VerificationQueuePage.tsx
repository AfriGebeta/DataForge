"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  ListChecks,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";
import { fetchVerificationQueue } from "./api";
import { fetchPendingMergeForPlace } from "../merge-review/api";
import type { AIDecision, QueuedPlace } from "./types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneIconWrap: Record<Tone, string> = {
  neutral: "bg-white/5 text-white/70 ring-1 ring-inset ring-white/10",
  accent:
    "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] ring-1 ring-inset ring-[color:var(--orange-400)]/25",
  success:
    "bg-[color:var(--text-success)]/15 text-[color:var(--text-success)] ring-1 ring-inset ring-[color:var(--text-success)]/25",
  warning:
    "bg-[color:var(--text-warning)]/15 text-[color:var(--text-warning)] ring-1 ring-inset ring-[color:var(--text-warning)]/25",
  danger:
    "bg-[color:var(--text-danger)]/15 text-[color:var(--text-danger)] ring-1 ring-inset ring-[color:var(--text-danger)]/25",
};

const toneText: Record<Tone, string> = {
  neutral: "text-white",
  accent: "text-[color:var(--orange-400)]",
  success: "text-[color:var(--text-success)]",
  warning: "text-[color:var(--text-warning)]",
  danger: "text-[color:var(--text-danger)]",
};

const toneBadgeVariant: Record<Tone, string> = {
  neutral: "bg-white/5 text-white/70 border-white/10",
  accent:
    "bg-[color:var(--orange-500)]/15 text-[color:var(--orange-400)] border-[color:var(--orange-400)]/30",
  success:
    "bg-[color:var(--text-success)]/12 text-[color:var(--text-success)] border-[color:var(--text-success)]/25",
  warning:
    "bg-[color:var(--text-warning)]/12 text-[color:var(--text-warning)] border-[color:var(--text-warning)]/25",
  danger:
    "bg-[color:var(--text-danger)]/12 text-[color:var(--text-danger)] border-[color:var(--text-danger)]/25",
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

// ── Real data helpers — every value below traces back to a QueuedPlace
// field (PlaceForge's PlaceListItem + AIValues), nothing fabricated.

function placeName(p: QueuedPlace): string {
  const primary = p.names.find((n) => n.isPrimary) ?? p.names[0];
  return primary?.name ?? `Place #${p.id}`;
}

function pct(value: number | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function toneFromScore(value: number | undefined, invert = false): Tone {
  if (value == null) return "neutral";
  const v = invert ? 1 - value : value;
  if (v >= 0.7) return "danger";
  if (v >= 0.4) return "warning";
  return "success";
}

function StatusBadge({
  tone,
  children,
  fixed = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  fixed?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono tracking-wide text-[10px] px-2 py-0.5",
        fixed && "min-w-[80px] justify-center",
        toneBadgeVariant[tone],
      )}
    >
      {children}
    </Badge>
  );
}

function SectionEyebrow({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-0.5">
      <div className="flex items-center gap-2.5">
        <span className="h-px w-6 bg-white/20" />
        <span className="font-display text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/50">
          {label}
        </span>
      </div>
      {hint ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type TrustFilter = "" | "low" | "medium" | "high";
type AIDecisionFilter = "" | AIDecision | "NONE";
type VisibilityFilter = "" | "visible" | "hidden";

export default function VerificationQueuePage() {
  const router = useRouter();
  const [rows, setRows] = useState<QueuedPlace[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Places whose aiDecision=DUPLICATE tag still has a live PENDING merge —
  // aiDecision itself never changes once set, so after a merge is applied or
  // rejected it's stale and can't be trusted alone for routing/hinting.
  const [pendingMergeIds, setPendingMergeIds] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState("");
  const [aiDecisionFilter, setAiDecisionFilter] = useState<AIDecisionFilter>("");
  const [trustFilter, setTrustFilter] = useState<TrustFilter>("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchVerificationQueue({ pageSize: 50 });
    setRows(res.data);
    setTotal(res.total);

    const candidates = res.data.filter((r) => r.aiValues?.aiDecision === "DUPLICATE");
    const checks = await Promise.all(
      candidates.map(async (r) => [r.id, await fetchPendingMergeForPlace(r.id)] as const),
    );
    setPendingMergeIds(new Set(checks.filter(([, merge]) => merge != null).map(([id]) => id)));

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnDef<QueuedPlace>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Place ID",
        size: 90,
        cell: ({ row }) => <span className="font-mono text-[11px] text-white/70">#{row.original.id}</span>,
      },
      {
        id: "name",
        accessorFn: (r) => placeName(r),
        header: "Name",
        size: 220,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-white/90">{placeName(row.original)}</div>
            <div className="text-[10.5px] text-white/45">{row.original.placeType}</div>
          </div>
        ),
      },
      {
        id: "coords",
        header: "Coordinates",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-white/70">
            {row.original.latitude.toFixed(3)}, {row.original.longitude.toFixed(3)}
          </span>
        ),
      },
      {
        id: "trust",
        accessorFn: (r) => r.aiValues?.aiMlConfidence ?? -1,
        header: "Trust",
        size: 90,
        cell: ({ row }) => (
          <span
            className={cn(
              "font-mono text-[11.5px] tabular-nums",
              toneText[toneFromScore(row.original.aiValues?.aiMlConfidence, true)],
            )}
          >
            {pct(row.original.aiValues?.aiMlConfidence)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "reviewStatus",
        header: "Status",
        size: 110,
        cell: ({ row }) => (
          <StatusBadge tone={row.original.isVisible ? "success" : "warning"}>
            {row.original.reviewStatus}
          </StatusBadge>
        ),
      },
      {
        id: "dupRisk",
        accessorFn: (r) => r.aiValues?.aiDuplicateScore ?? -1,
        header: "Dup Risk",
        size: 160,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge tone={toneFromScore(row.original.aiValues?.aiDuplicateScore)}>
              {pct(row.original.aiValues?.aiDuplicateScore)}
            </StatusBadge>
            {pendingMergeIds.has(row.original.id) ? (
              <span className="text-[10px] text-white/40">→ merge review</span>
            ) : null}
          </div>
        ),
      },
    ],
    [pendingMergeIds],
  );

  const highPriorityCount = rows.filter(
    (r) => r.aiValues?.aiMlConfidence != null && r.aiValues.aiMlConfidence < 0.5,
  ).length;
  const duplicateCount = rows.filter((r) => r.aiValues?.aiDecision === "DUPLICATE").length;
  const noAiSignalCount = rows.filter((r) => !r.aiValues).length;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !String(r.id).includes(q) && !placeName(r).toLowerCase().includes(q)) return false;

      if (aiDecisionFilter === "NONE") {
        if (r.aiValues) return false;
      } else if (aiDecisionFilter && r.aiValues?.aiDecision !== aiDecisionFilter) {
        return false;
      }

      if (trustFilter) {
        const conf = r.aiValues?.aiMlConfidence;
        if (conf == null) return false;
        if (trustFilter === "low" && conf >= 0.5) return false;
        if (trustFilter === "medium" && (conf < 0.5 || conf >= 0.75)) return false;
        if (trustFilter === "high" && conf < 0.75) return false;
      }

      if (visibilityFilter === "visible" && !r.isVisible) return false;
      if (visibilityFilter === "hidden" && r.isVisible) return false;

      return true;
    });
  }, [rows, search, aiDecisionFilter, trustFilter, visibilityFilter]);

  const activeFilterCount = [aiDecisionFilter, trustFilter, visibilityFilter].filter(Boolean).length;
  const filtersActive = Boolean(search || activeFilterCount > 0);

  function clearFilters() {
    setSearch("");
    setAiDecisionFilter("");
    setTrustFilter("");
    setVisibilityFilter("");
  }

  function goToPlace(row: QueuedPlace) {
    router.push(
      pendingMergeIds.has(row.id)
        ? `/verification/merge-review/${row.id}`
        : `/verification/queue/${row.id}`,
    );
  }

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-verification-queue"
    >
      <div className="aurora-bg" aria-hidden />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col gap-10"
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-start justify-between gap-5 pb-2"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--orange-400)] pulse-dot" />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Live · Human Review › Queue
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-white">
              Verification Queue
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Places PlaceForge marked reviewStatus=NEEDS_REVIEW.
              <span className="ml-1 text-[color:var(--orange-400)]">
                {total} item{total === 1 ? "" : "s"} awaiting action
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 py-1 pl-2 pr-2.5 text-[color:var(--text-danger)]"
            >
              <ShieldAlert className="h-3 w-3" />
              {highPriorityCount} High Priority
            </Badge>
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-white/85 transition hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Metrics — click one to apply the matching filter */}
        <motion.section variants={item} className="flex flex-col gap-3">
          <SectionEyebrow label="Queue Snapshot" hint="click a card to filter" />
          <motion.div
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {[
              {
                label: "Queue Items",
                value: total,
                icon: ListChecks,
                tone: "accent" as Tone,
                delta: "reviewStatus=NEEDS_REVIEW",
                onClick: clearFilters,
              },
              {
                label: "Low Trust (<50%)",
                value: highPriorityCount,
                icon: ShieldAlert,
                tone: "danger" as Tone,
                delta: "aiMlConfidence < 0.5",
                onClick: () => setTrustFilter("low"),
              },
              {
                label: "Flagged Duplicate",
                value: duplicateCount,
                icon: Copy,
                tone: "warning" as Tone,
                delta: "aiDecision = DUPLICATE",
                onClick: () => setAiDecisionFilter("DUPLICATE"),
              },
              {
                label: "No AI Signal",
                value: noAiSignalCount,
                icon: CheckCircle2,
                tone: "neutral" as Tone,
                delta: "no AI validation submitted",
                onClick: () => setAiDecisionFilter("NONE"),
              },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} variants={item} whileHover={{ y: -4 }}>
                  <button type="button" onClick={k.onClick} className="block w-full text-left">
                    <GlassCard ring ringTone={k.tone} className="h-full">
                      <div className="relative flex h-full min-h-[168px] flex-col items-center justify-center p-6 text-center">
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-2xl",
                            toneIconWrap[k.tone],
                          )}
                        >
                          <Icon className="h-[19px] w-[19px]" />
                        </div>
                        <div className="font-display mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
                          {k.label}
                        </div>
                        <div
                          className={cn(
                            "font-display-tight mt-2 text-[26px] font-semibold tabular-nums leading-none",
                            toneText[k.tone],
                          )}
                        >
                          {k.value.toLocaleString()}
                        </div>
                        <div className="mt-2.5 text-[11px] text-white/55">
                          {k.delta}
                        </div>
                      </div>
                    </GlassCard>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Queue table — filterable, sortable, paginated. Click a row to open its detail/edit page */}
        <motion.div variants={item}>
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                  <ClipboardList className="h-4 w-4 text-white/75" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-white/90">
                  Flagged Records
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone="accent">
                  {loading ? "LOADING" : `${filteredRows.length} of ${rows.length} SHOWN`}
                </StatusBadge>
              </div>
            </CardHeader>

            {/* Toolbar: search and filter side by side */}
            <CardContent className="flex items-center gap-3 px-6 pb-0 pt-5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or place ID…"
                  className="w-full rounded-md border border-white/10 bg-white/[0.03] py-1.5 pl-8 pr-3 text-[12px] text-white/85 outline-none focus:border-[color:var(--orange-400)]/50"
                />
              </div>

              <button
                type="button"
                onClick={() => setFilterModalOpen(true)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition",
                  activeFilterCount > 0
                    ? "border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)] hover:bg-[color:var(--orange-500)]/20"
                    : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]",
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--orange-400)] px-1 text-[10px] font-semibold text-black">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              {filtersActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-white/70 transition hover:bg-white/[0.06]"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              ) : null}
            </CardContent>

            <CardContent className="px-6 pb-6 pt-4">
              {rows.length === 0 && !loading ? (
                <div className="py-10 text-center text-[12px] text-white/45">
                  No places are currently in NEEDS_REVIEW.
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredRows}
                  loading={loading}
                  emptyMessage="No records match these filters."
                  onRowClick={goToPlace}
                />
              )}
            </CardContent>
          </GlassCard>
        </motion.div>
      </motion.div>

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        aiDecisionFilter={aiDecisionFilter}
        trustFilter={trustFilter}
        visibilityFilter={visibilityFilter}
        onApply={(ai, trust, visibility) => {
          setAiDecisionFilter(ai);
          setTrustFilter(trust);
          setVisibilityFilter(visibility);
          setFilterModalOpen(false);
        }}
      />
    </div>
  );
}

type FilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  aiDecisionFilter: AIDecisionFilter;
  trustFilter: TrustFilter;
  visibilityFilter: VisibilityFilter;
  onApply: (ai: AIDecisionFilter, trust: TrustFilter, visibility: VisibilityFilter) => void;
};

function FilterModal({
  isOpen,
  onClose,
  aiDecisionFilter,
  trustFilter,
  visibilityFilter,
  onApply,
}: FilterModalProps) {
  const [draftAi, setDraftAi] = useState<AIDecisionFilter>(aiDecisionFilter);
  const [draftTrust, setDraftTrust] = useState<TrustFilter>(trustFilter);
  const [draftVisibility, setDraftVisibility] = useState<VisibilityFilter>(visibilityFilter);

  useEffect(() => {
    if (isOpen) {
      setDraftAi(aiDecisionFilter);
      setDraftTrust(trustFilter);
      setDraftVisibility(visibilityFilter);
    }
  }, [isOpen, aiDecisionFilter, trustFilter, visibilityFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-white/70" />
            <span className="font-display text-[14px] font-semibold text-white/90">Filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
              AI decision
            </label>
            <select
              value={draftAi}
              onChange={(e) => setDraftAi(e.target.value as AIDecisionFilter)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[12.5px] text-white/85 outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All AI decisions</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="AMBIGUOUS">Ambiguous</option>
              <option value="INVALID">Invalid</option>
              <option value="VALID">Valid</option>
              <option value="NONE">No AI signal</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Trust level
            </label>
            <select
              value={draftTrust}
              onChange={(e) => setDraftTrust(e.target.value as TrustFilter)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[12.5px] text-white/85 outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All trust levels</option>
              <option value="low">Low (&lt;50%)</option>
              <option value="medium">Medium (50–75%)</option>
              <option value="high">High (&gt;75%)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Visibility
            </label>
            <select
              value={draftVisibility}
              onChange={(e) => setDraftVisibility(e.target.value as VisibilityFilter)}
              className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-[12.5px] text-white/85 outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setDraftAi("");
              setDraftTrust("");
              setDraftVisibility("");
            }}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 transition hover:bg-white/[0.06]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draftAi, draftTrust, draftVisibility)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25"
          >
            <Check className="h-3.5 w-3.5" />
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
