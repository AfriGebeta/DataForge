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
  Shuffle,
  SlidersHorizontal,
  UserCircle2,
  Users,
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
import { bulkAssignPlaces, fetchCurrentAdmin, fetchVerificationQueue } from "./api";
import { fetchPlace } from "../shared/api";
import { fetchMergeRecords } from "@/features/quality/merge-records/api";
import { fetchUsers } from "@/features/system/users/api";
import type { AdminUser } from "@/features/system/users/types";
import type { AIDecision, QueuedPlace } from "./types";

// "" = all, "me" = assignedToId=<current admin>, "unassigned" = assignedToId
// is null, any other value = that admin_user's id.
type AssignmentFilter = "" | "me" | "unassigned" | string;

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneIconWrap: Record<Tone, string> = {
  neutral: "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] ring-1 ring-inset ring-[color:var(--border)]",
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
  neutral: "text-[color:var(--text-primary)]",
  accent: "text-[color:var(--orange-400)]",
  success: "text-[color:var(--text-success)]",
  warning: "text-[color:var(--text-warning)]",
  danger: "text-[color:var(--text-danger)]",
};

const toneBadgeVariant: Record<Tone, string> = {
  neutral: "bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] border-[color:var(--border)]",
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

// aiMlConfidence/aiDuplicateScore/etc. are already 0-100 on the wire (see
// place.api.v1.model.go's validate:"...,max=100" tags) — not 0-1.
function pct(value: number | undefined): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function toneFromScore(value: number | undefined, invert = false): Tone {
  if (value == null) return "neutral";
  const v = invert ? 100 - value : value;
  if (v >= 70) return "danger";
  if (v >= 40) return "warning";
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
        <span className="h-px w-6 bg-[color:var(--surface-3)]" />
        <span className="font-display text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
          {label}
        </span>
      </div>
      {hint ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

type TrustFilter = "" | "low" | "medium" | "high";
type AIDecisionFilter = "" | AIDecision | "NONE";
type VisibilityFilter = "" | "visible" | "hidden";

// Persists the toolbar/filter-modal state across a click-into-a-place-and-
// back round trip — clicking a row navigates to a whole separate route
// (`/verification/queue/[id]`), which unmounts this page entirely, so plain
// useState alone loses everything on the way back. sessionStorage (not the
// URL) survives both the "Back to Verification Queue" link and the browser
// back button, and clears itself once the tab closes.
const QUEUE_FILTERS_KEY = "verificationQueueFilters";

type PersistedFilters = {
  search: string;
  aiDecisionFilter: AIDecisionFilter;
  trustFilter: TrustFilter;
  visibilityFilter: VisibilityFilter;
  assignmentFilter: AssignmentFilter;
};

export default function VerificationQueuePage() {
  const router = useRouter();
  const [rows, setRows] = useState<QueuedPlace[]>([]);
  const [total, setTotal] = useState(0);
  // Just res.total from fetchVerificationQueue — unlike `total`, doesn't
  // include the orphaned pending-merge places `load()` also appends, so
  // it's the true count of NEEDS_REVIEW places matching the current
  // assignment filter, i.e. what "Split Queue" actually operates on.
  const [matchingTotal, setMatchingTotal] = useState(0);
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

  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("");
  // Gates the persist effect below until the restore effect has had its
  // one chance to run — otherwise the first-mount write would flush the
  // default empty filters over whatever was just restored.
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  // Assigning/splitting work is ADMIN-role-only on the backend (see
  // place/api/v1/routes.go's adminOnly gate on PATCH /places/bulk-assign) —
  // hide the write-side controls for anyone else so they don't hit a 403
  // clicking Assign, while still letting everyone view/filter by assignee.
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitScope, setSplitScope] = useState<"selected" | "all">("selected");
  const [myAssignedCount, setMyAssignedCount] = useState(0);

  useEffect(() => {
    void fetchCurrentAdmin().then((me) => {
      setCurrentAdminId(me?.adminId ?? null);
      setIsAdmin(me?.permissionLevel === "ADMIN");
    });
    void fetchUsers({ pageSize: 100 })
      .then((res) => setAdminUsers(res.data))
      .catch((cause) => {
        // GET /admin/users is ADMIN-role-only on the backend — a
        // DATA_EDITOR/DATA_REVIEWER logged-in account gets a 403 here.
        // Surface that instead of silently leaving the assign/split
        // pickers looking empty with no explanation.
        console.warn("fetchUsers failed:", cause);
        setAdminUsersError(
          cause instanceof Error ? cause.message : "Failed to load admin users",
        );
      });
  }, []);

  useEffect(() => {
    // Wrapped in a microtask, matching this file's fetchCurrentAdmin().then()
    // pattern just above — an async boundary here (not this project's
    // conditional-mount trick, which doesn't apply to a whole-page restore)
    // keeps this off the react-hooks/set-state-in-effect list, unlike a bare
    // synchronous setState call in the effect body.
    void Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(QUEUE_FILTERS_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<PersistedFilters>;
          if (saved.search) setSearch(saved.search);
          if (saved.aiDecisionFilter) setAiDecisionFilter(saved.aiDecisionFilter);
          if (saved.trustFilter) setTrustFilter(saved.trustFilter);
          if (saved.visibilityFilter) setVisibilityFilter(saved.visibilityFilter);
          if (saved.assignmentFilter) setAssignmentFilter(saved.assignmentFilter);
        }
      } catch (cause) {
        console.warn("Failed to restore verification queue filters:", cause);
      }
      setFiltersHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    const toPersist: PersistedFilters = {
      search,
      aiDecisionFilter,
      trustFilter,
      visibilityFilter,
      assignmentFilter,
    };
    try {
      sessionStorage.setItem(QUEUE_FILTERS_KEY, JSON.stringify(toPersist));
    } catch (cause) {
      console.warn("Failed to persist verification queue filters:", cause);
    }
  }, [filtersHydrated, search, aiDecisionFilter, trustFilter, visibilityFilter, assignmentFilter]);

  const adminNameById = useMemo(() => {
    const map = new Map<string, string>();
    adminUsers.forEach((u) => map.set(u.id, u.fullName || u.email));
    return map;
  }, [adminUsers]);

  // Translates the "assigned to me / unassigned / <person>" UI filter into
  // the two real backend query params — shared by load() and "Split Queue"
  // (which needs the exact same matching set, just unpaginated).
  const assignmentQueryParams = useCallback(() => {
    const assignedToId =
      assignmentFilter === "me"
        ? currentAdminId ?? undefined
        : assignmentFilter && assignmentFilter !== "unassigned"
          ? assignmentFilter
          : undefined;
    const unassigned = assignmentFilter === "unassigned";
    return { assignedToId, unassigned };
  }, [assignmentFilter, currentAdminId]);

  const load = useCallback(async () => {
    setLoading(true);
    const { assignedToId, unassigned } = assignmentQueryParams();

    const [res, pendingMerges, myAssigned] = await Promise.all([
      fetchVerificationQueue({ pageSize: 50, assignedToId, unassigned }),
      fetchMergeRecords({ status: "PENDING", limit: 100 }),
      // Independent of the page's own assignment filter — this is always
      // "how much of the queue is mine right now", for the KPI card below.
      currentAdminId
        ? fetchVerificationQueue({ pageSize: 1, assignedToId: currentAdminId })
        : Promise.resolve(null),
    ]);
    setMyAssignedCount(myAssigned?.total ?? 0);

    // A PENDING merge_record is an unresolved duplicate-candidate regardless
    // of whether the two places it references have since been individually
    // approved/rejected (which doesn't touch the merge's own status) — the
    // Overview dashboard's "Duplicate Candidates" count includes those too,
    // so this queue needs to as well or they become permanently unreachable
    // (reviewStatus=NEEDS_REVIEW is the only filter fetchVerificationQueue
    // applies, and a directly-reviewed place no longer matches it).
    const knownIds = new Set(res.data.map((r) => r.id));
    const nextPendingMergeIds = new Set<number>();
    const orphanIds = new Set<number>();
    for (const merge of pendingMerges.data) {
      const winnerId = Number(merge.winner_id);
      const loserId = Number(merge.loser_id);
      nextPendingMergeIds.add(winnerId);
      nextPendingMergeIds.add(loserId);
      // The loser is the actual candidate a merge proposes to resolve away —
      // surface it here if it fell out of the NEEDS_REVIEW list already.
      if (!knownIds.has(loserId)) orphanIds.add(loserId);
    }

    const orphans = (
      await Promise.all(Array.from(orphanIds).map((id) => fetchPlace(id)))
    ).filter((p): p is NonNullable<typeof p> => p != null);

    setRows([...res.data, ...orphans]);
    setTotal(res.total + orphans.length);
    setMatchingTotal(res.total);
    setPendingMergeIds(nextPendingMergeIds);
    setLoading(false);
  }, [assignmentQueryParams, currentAdminId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleBulkAssign(assignedToId: string | null) {
    setAssigning(true);
    try {
      await bulkAssignPlaces(Array.from(selectedIds).map(Number), assignedToId);
      setSelectedIds(new Set());
      setAssignTarget("");
      await load();
    } catch (cause) {
      console.warn("bulkAssignPlaces failed:", cause);
    } finally {
      setAssigning(false);
    }
  }

  // PATCH /places/bulk-assign caps a single call at 500 ids (see
  // BulkAssignPlacesRequest's validate tag on the backend) — anything
  // splitting the whole queue must chunk each person's share into batches
  // this small, not just fire one call per person.
  const MAX_IDS_PER_CALL = 500;

  function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  async function assignChunked(placeIds: number[], assignedToId: string) {
    for (const part of chunk(placeIds, MAX_IDS_PER_CALL)) {
      await bulkAssignPlaces(part, assignedToId);
    }
  }

  // Splits either the current checkbox selection or every place currently
  // matching the queue's assignment filter (scope: "all" — fetched fresh,
  // unpaginated, since the table itself only ever loads 50 rows at a time)
  // round-robin across the chosen people, so counts differ by at most 1
  // (e.g. 5000 places / 3 people -> 1667/1667/1666) rather than everyone
  // getting the exact same place.
  async function handleSplitAssign(targetIds: string[], scope: "selected" | "all") {
    if (targetIds.length === 0) return;
    setAssigning(true);
    try {
      let ids: number[];
      if (scope === "all") {
        const { assignedToId, unassigned } = assignmentQueryParams();
        const res = await fetchVerificationQueue({
          pageSize: Math.max(matchingTotal, 1),
          assignedToId,
          unassigned,
        });
        ids = res.data.map((p) => p.id);
      } else {
        ids = Array.from(selectedIds).map(Number);
      }

      const buckets: number[][] = targetIds.map(() => []);
      ids.forEach((id, i) => buckets[i % targetIds.length].push(id));

      await Promise.all(
        buckets
          .map((bucket, i) => ({ bucket, adminId: targetIds[i] }))
          .filter(({ bucket }) => bucket.length > 0)
          .map(({ bucket, adminId }) => assignChunked(bucket, adminId)),
      );

      setSelectedIds(new Set());
      setSplitModalOpen(false);
      await load();
    } catch (cause) {
      console.warn("split assign failed:", cause);
    } finally {
      setAssigning(false);
    }
  }

  const columns: ColumnDef<QueuedPlace>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Place ID",
        size: 90,
        cell: ({ row }) => <span className="font-mono text-[11px] text-[color:var(--text-secondary)]">#{row.original.id}</span>,
      },
      {
        id: "name",
        accessorFn: (r) => placeName(r),
        header: "Name",
        size: 220,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-[color:var(--text-primary)]">{placeName(row.original)}</div>
            <div className="text-[10.5px] text-[color:var(--text-muted)]">{row.original.placeType}</div>
          </div>
        ),
      },
      {
        id: "coords",
        header: "Coordinates",
        size: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-[color:var(--text-secondary)]">
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
              <span className="text-[10px] text-[color:var(--text-muted)]">→ merge review</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "assignedTo",
        accessorFn: (r) => (r.assignedToId ? adminNameById.get(r.assignedToId) ?? r.assignedToId : ""),
        header: "Assigned To",
        size: 140,
        cell: ({ row }) => {
          const id = row.original.assignedToId;
          if (!id) {
            return <span className="text-[11px] text-[color:var(--text-muted)]">Unassigned</span>;
          }
          return (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[color:var(--text-secondary)]">
              <UserCircle2 className="h-3.5 w-3.5 text-[color:var(--text-muted)]" />
              {adminNameById.get(id) ?? id}
            </span>
          );
        },
      },
    ],
    [pendingMergeIds, adminNameById],
  );

  const highPriorityCount = rows.filter(
    (r) => r.aiValues?.aiMlConfidence != null && r.aiValues.aiMlConfidence < 50,
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
        if (trustFilter === "low" && conf >= 50) return false;
        if (trustFilter === "medium" && (conf < 50 || conf >= 75)) return false;
        if (trustFilter === "high" && conf < 75) return false;
      }

      if (visibilityFilter === "visible" && !r.isVisible) return false;
      if (visibilityFilter === "hidden" && r.isVisible) return false;

      return true;
    });
  }, [rows, search, aiDecisionFilter, trustFilter, visibilityFilter]);

  const activeFilterCount = [aiDecisionFilter, trustFilter, visibilityFilter, assignmentFilter].filter(
    Boolean,
  ).length;
  const filtersActive = Boolean(search || activeFilterCount > 0);

  function clearFilters() {
    setSearch("");
    setAiDecisionFilter("");
    setTrustFilter("");
    setVisibilityFilter("");
    setAssignmentFilter("");
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
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                Live · Human Review › Queue
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-[color:var(--text-primary)]">
              Verification Queue
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[color:var(--text-muted)]">
              Places marked reviewStatus=NEEDS_REVIEW, plus any place still on an unresolved
              (PENDING) duplicate-merge proposal even if it was reviewed directly.
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
            {isAdmin ? (
              <button
                type="button"
                disabled={matchingTotal < 2}
                onClick={() => {
                  setSplitScope("all");
                  setSplitModalOpen(true);
                }}
                className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:text-[color:var(--text-primary)] disabled:pointer-events-none disabled:opacity-40"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Split Queue…
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void load()}
              className="glass-surface glass-glow relative inline-flex items-center gap-1.5 rounded-lg border-0 px-3 py-1.5 text-[12px] font-medium text-[color:var(--text-primary)] transition hover:text-[color:var(--text-primary)]"
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
                delta: "NEEDS_REVIEW + unresolved merges",
                onClick: clearFilters,
              },
              {
                label: "Low Trust (<50%)",
                value: highPriorityCount,
                icon: ShieldAlert,
                tone: "danger" as Tone,
                delta: "aiMlConfidence < 50",
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
              {
                label: "Assigned to Me",
                value: myAssignedCount,
                icon: UserCircle2,
                tone: "accent" as Tone,
                delta: "assignedToId = me, real total",
                onClick: () => setAssignmentFilter("me"),
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
                        <div className="font-display mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
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
                        <div className="mt-2.5 text-[11px] text-[color:var(--text-muted)]">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--surface-2)] ring-1 ring-inset ring-[color:var(--border)]">
                  <ClipboardList className="h-4 w-4 text-[color:var(--text-secondary)]" />
                </div>
                <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                  Flagged Records
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone="accent">
                  {loading ? "LOADING" : `${filteredRows.length} of ${rows.length} SHOWN`}
                </StatusBadge>
              </div>
            </CardHeader>

            {/* Toolbar: search on the left, all filtering (incl. assignment) lives behind the Filters modal on the right */}
            <CardContent className="flex items-center justify-between gap-3 px-6 pb-0 pt-5">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--text-muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or place ID…"
                  className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] py-1.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
                  style={{ paddingLeft: 32, paddingRight: 12 }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {filtersActive ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[11.5px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setFilterModalOpen(true)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition",
                    activeFilterCount > 0
                      ? "border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/12 text-[color:var(--orange-400)] hover:bg-[color:var(--orange-500)]/20"
                      : "border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-3)]",
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
              </div>
            </CardContent>

            {isAdmin && selectedIds.size > 0 ? (
              <CardContent className="px-6 pb-0 pt-4">
                <div className="flex flex-wrap items-center gap-2.5 rounded-md border border-[color:var(--orange-400)]/30 bg-[color:var(--orange-500)]/10 px-3.5 py-2.5">
                  <Users className="h-3.5 w-3.5 text-[color:var(--orange-400)]" />
                  <span className="text-[12px] font-medium text-[color:var(--text-primary)]">
                    {selectedIds.size} selected
                  </span>
                  <select
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(e.target.value)}
                    className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-2.5 py-1.5 text-[12px] text-[color:var(--text-secondary)] outline-none focus:border-[color:var(--orange-400)]/50"
                  >
                    <option value="">Assign to…</option>
                    {adminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!assignTarget || assigning}
                    onClick={() => void handleBulkAssign(assignTarget)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-3 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Assign
                  </button>
                  <button
                    type="button"
                    disabled={assigning}
                    onClick={() => void handleBulkAssign(null)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    Unassign
                  </button>
                  <span className="h-4 w-px bg-[color:var(--border)]" />
                  <button
                    type="button"
                    disabled={selectedIds.size < 2 || assigning}
                    onClick={() => {
                      setSplitScope("selected");
                      setSplitModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)] disabled:pointer-events-none disabled:opacity-40"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Split evenly…
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
                  >
                    <X className="h-3 w-3" />
                    Clear selection
                  </button>
                </div>
              </CardContent>
            ) : null}

            <CardContent className="px-6 pb-6 pt-4">
              {rows.length === 0 && !loading ? (
                <div className="py-10 text-center text-[12px] text-[color:var(--text-muted)]">
                  No places are currently in NEEDS_REVIEW.
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredRows}
                  loading={loading}
                  emptyMessage="No records match these filters."
                  onRowClick={goToPlace}
                  enableSelection={isAdmin}
                  getRowId={(r) => String(r.id)}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
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
        assignmentFilter={assignmentFilter}
        adminUsers={adminUsers}
        onApply={(ai, trust, visibility, assignment) => {
          setAiDecisionFilter(ai);
          setTrustFilter(trust);
          setVisibilityFilter(visibility);
          setAssignmentFilter(assignment);
          setFilterModalOpen(false);
        }}
      />

      {splitModalOpen ? (
        <SplitAssignModal
          onClose={() => setSplitModalOpen(false)}
          adminUsers={adminUsers}
          adminUsersError={adminUsersError}
          scope={splitScope}
          placeCount={splitScope === "all" ? matchingTotal : selectedIds.size}
          assigning={assigning}
          onDivide={(targetIds) => void handleSplitAssign(targetIds, splitScope)}
        />
      ) : null}
    </div>
  );
}

type FilterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  aiDecisionFilter: AIDecisionFilter;
  trustFilter: TrustFilter;
  visibilityFilter: VisibilityFilter;
  assignmentFilter: AssignmentFilter;
  adminUsers: AdminUser[];
  onApply: (
    ai: AIDecisionFilter,
    trust: TrustFilter,
    visibility: VisibilityFilter,
    assignment: AssignmentFilter,
  ) => void;
};

function FilterModal({
  isOpen,
  onClose,
  aiDecisionFilter,
  trustFilter,
  visibilityFilter,
  assignmentFilter,
  adminUsers,
  onApply,
}: FilterModalProps) {
  const [draftAi, setDraftAi] = useState<AIDecisionFilter>(aiDecisionFilter);
  const [draftTrust, setDraftTrust] = useState<TrustFilter>(trustFilter);
  const [draftVisibility, setDraftVisibility] = useState<VisibilityFilter>(visibilityFilter);
  const [draftAssignment, setDraftAssignment] = useState<AssignmentFilter>(assignmentFilter);

  useEffect(() => {
    if (isOpen) {
      setDraftAi(aiDecisionFilter);
      setDraftTrust(trustFilter);
      setDraftVisibility(visibilityFilter);
      setDraftAssignment(assignmentFilter);
    }
  }, [isOpen, aiDecisionFilter, trustFilter, visibilityFilter, assignmentFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--text-secondary)]" />
            <span className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">Filters</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              AI decision
            </label>
            <select
              value={draftAi}
              onChange={(e) => setDraftAi(e.target.value as AIDecisionFilter)}
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-[12.5px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
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
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              Trust level
            </label>
            <select
              value={draftTrust}
              onChange={(e) => setDraftTrust(e.target.value as TrustFilter)}
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-[12.5px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All trust levels</option>
              <option value="low">Low (&lt;50%)</option>
              <option value="medium">Medium (50–75%)</option>
              <option value="high">High (&gt;75%)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              Visibility
            </label>
            <select
              value={draftVisibility}
              onChange={(e) => setDraftVisibility(e.target.value as VisibilityFilter)}
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-[12.5px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              Assigned to
            </label>
            <select
              value={draftAssignment}
              onChange={(e) => setDraftAssignment(e.target.value)}
              className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-2 text-[12.5px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
            >
              <option value="">All assignees</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setDraftAi("");
              setDraftTrust("");
              setDraftVisibility("");
              setDraftAssignment("");
            }}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draftAi, draftTrust, draftVisibility, draftAssignment)}
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

type SplitAssignModalProps = {
  onClose: () => void;
  adminUsers: AdminUser[];
  adminUsersError: string | null;
  scope: "selected" | "all";
  placeCount: number;
  assigning: boolean;
  onDivide: (targetIds: string[]) => void;
};

// Divides either the checkbox selection or the entire matching queue
// round-robin across every checked person here — see handleSplitAssign for
// the actual chunking logic. Only ever mounted while open (see the call
// site), so `checked` starts fresh each time without needing a reset effect.
function SplitAssignModal({
  onClose,
  adminUsers,
  adminUsersError,
  scope,
  placeCount,
  assigning,
  onDivide,
}: SplitAssignModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const n = checked.size;
  const per = n > 0 ? Math.floor(placeCount / n) : 0;
  const remainder = n > 0 ? placeCount % n : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-[color:var(--text-secondary)]" />
            <span className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
              Split evenly
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">
          <p className="text-[11.5px] text-[color:var(--text-muted)]">
            {scope === "all" ? (
              <>
                Divide all <strong className="text-[color:var(--text-secondary)]">{placeCount}</strong>{" "}
                place{placeCount === 1 ? "" : "s"} currently matching the queue&rsquo;s assignment
                filter equally between the people you check below — not just what&rsquo;s loaded on
                screen.
              </>
            ) : (
              <>
                Divide the {placeCount} selected place{placeCount === 1 ? "" : "s"} equally between the
                people you check below.
              </>
            )}
          </p>

          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-[color:var(--border)] p-1.5">
            {adminUsersError ? (
              <div className="px-2 py-3 text-center text-[11.5px] text-[color:var(--text-danger)]">
                Couldn&rsquo;t load admin users ({adminUsersError}). Your account may not have
                permission to list other users — an ADMIN-role account is needed.
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="px-2 py-3 text-center text-[11.5px] text-[color:var(--text-muted)]">
                No other admin users exist yet — add some under System → Users first.
              </div>
            ) : (
              adminUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(u.id)}
                    onChange={() => toggle(u.id)}
                    className="h-3.5 w-3.5 cursor-pointer accent-[color:var(--orange-400)]"
                  />
                  {u.fullName || u.email}
                </label>
              ))
            )}
          </div>

          {n > 0 ? (
            <p className="text-[11px] text-[color:var(--text-muted)]">
              {n} people selected — {per}
              {remainder > 0 ? `–${per + 1}` : ""} places each.
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 text-[12px] text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-3)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={n < 2 || assigning}
            onClick={() => onDivide(Array.from(checked))}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--orange-400)]/40 bg-[color:var(--orange-500)]/15 px-4 py-1.5 text-[12px] font-medium text-[color:var(--orange-400)] transition hover:bg-[color:var(--orange-500)]/25 disabled:pointer-events-none disabled:opacity-40"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Divide
          </button>
        </div>
      </div>
    </div>
  );
}
