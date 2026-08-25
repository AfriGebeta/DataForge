"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Building,
  Building2,
  Globe2,
  Info,
  Map as MapIcon,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/features/shared/GlassCard";
import { cn } from "@/lib/utils";
import { fetchAdminLevelChain, fetchGeographicValidation } from "./api";
import type { AdminLevelChainItem, ValidationFlag } from "./types";
import { fetchAddressLevels } from "@/features/address/nodes/api";
import { addressLevelName, type AddressLevelDef } from "@/features/address/nodes/types";

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

// ── Real data helpers — every value traces back to ValidationFlag
// (category=GEOMETRY|HIERARCHY) or AddressAdminLevel fields. There is no
// anomaly-detection / RAG / knowledge-retrieval logic anywhere in this
// codebase — see INTEGRATION.md for why.

function severityTone(severity: ValidationFlag["severity"]): Tone {
  if (severity === "CRITICAL") return "danger";
  if (severity === "ERROR") return "danger";
  if (severity === "WARNING") return "warning";
  return "neutral";
}

const levelIcons = [Globe2, MapIcon, Building2, Building, Building2, MapPin];

function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono tracking-wide text-[10px] px-2 py-0.5", toneBadgeVariant[tone])}
    >
      {children}
    </Badge>
  );
}

export default function GeographicValidationPage() {
  const router = useRouter();
  const [flags, setFlags] = useState<ValidationFlag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [addressId, setAddressId] = useState("");
  const [chain, setChain] = useState<AdminLevelChainItem[] | null>(null);
  const [chainLoading, setChainLoading] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [addressLevels, setAddressLevels] = useState<AddressLevelDef[]>([]);

  useEffect(() => {
    void fetchAddressLevels().then(setAddressLevels);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchGeographicValidation({ pageSize: 50 });
    setFlags(res.data);
    setTotal(res.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unresolved = flags.filter((f) => !f.is_resolved);
  const criticalCount = unresolved.filter((f) => f.severity === "CRITICAL").length;

  async function lookupChain() {
    const id = addressId.trim();
    if (!id) return;
    setChainLoading(true);
    setChainError(null);
    const rows = await fetchAdminLevelChain(id);
    setChainLoading(false);
    if (rows.length === 0) {
      setChain(null);
      setChainError("No admin-level chain stored for that address ID.");
      return;
    }
    setChain([...rows].sort((a, b) => a.level - b.level));
  }

  return (
    <div
      className="view active relative min-h-full overflow-hidden bg-[color:var(--surface-0)] px-6 pt-10 pb-8 md:px-10 md:pt-14 md:pb-10 xl:px-14 xl:pt-16 xl:pb-12"
      id="v-geographic-validation"
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
              <span
                className={cn(
                  "inline-flex h-2 w-2 rounded-full pulse-dot",
                  criticalCount > 0 ? "bg-[color:var(--text-danger)]" : "bg-[color:var(--text-success)]",
                )}
              />
              <span className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                Live · GEOMETRY + HIERARCHY flags
              </span>
            </div>
            <h2 className="font-display-tight mt-2 text-[32px] font-semibold text-[color:var(--text-primary)]">
              Geographic Validation
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-relaxed text-[color:var(--text-muted)]">
              Validation flags a worker already raised for geometry or admin-hierarchy issues.
              <span className="ml-1 text-[color:var(--orange-400)]">
                {unresolved.length} unresolved of {total}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 py-1 pl-2 pr-2.5",
                criticalCount > 0
                  ? "border-[color:var(--text-danger)]/30 bg-[color:var(--text-danger)]/12 text-[color:var(--text-danger)]"
                  : "border-[color:var(--text-success)]/30 bg-[color:var(--text-success)]/12 text-[color:var(--text-success)]",
              )}
            >
              {criticalCount} critical
            </Badge>
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

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          {/* LEFT column: flags table + hierarchy lookup */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", toneIconWrap.neutral)}>
                      <Globe2 className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                      Geometry &amp; Hierarchy Flags
                    </CardTitle>
                  </div>
                  <StatusBadge tone={unresolved.length > 0 ? "warning" : "success"}>
                    {unresolved.length} / {total} OPEN
                  </StatusBadge>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  {flags.length === 0 && !loading ? (
                    <div className="py-8 text-center text-[12px] text-[color:var(--text-muted)]">
                      No GEOMETRY or HIERARCHY flags recorded.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg ring-1 ring-inset ring-[color:var(--border)]">
                      <table className="w-full text-left text-[12px]">
                        <thead>
                          <tr className="bg-[color:var(--surface-1)] text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                            <th className="px-4 py-3 font-medium">Place</th>
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Message</th>
                            <th className="px-4 py-3 font-medium">Severity</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flags.map((f, i) => (
                            <motion.tr
                              key={f.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.32, delay: 0.2 + i * 0.05, ease: "easeOut" }}
                              onClick={() => router.push(`/verification/geographic-validation/${f.place_id}`)}
                              className={cn(
                                "cursor-pointer border-t border-[color:var(--border)] transition hover:bg-[color:var(--surface-2)]",
                                !f.is_resolved && f.severity === "CRITICAL" && "bg-[color:var(--text-danger)]/[0.05]",
                              )}
                            >
                              <td className="px-4 py-3 font-mono text-[11px] text-[color:var(--text-secondary)]">#{f.place_id}</td>
                              <td className="px-4 py-3 text-[color:var(--text-secondary)]">{f.category}</td>
                              <td className="px-4 py-3 text-[color:var(--text-primary)]">{f.message}</td>
                              <td className="px-4 py-3">
                                <StatusBadge tone={severityTone(f.severity)}>{f.severity}</StatusBadge>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge tone={f.is_resolved ? "success" : "warning"}>
                                  {f.is_resolved ? "RESOLVED" : "OPEN"}
                                </StatusBadge>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pb-0 pt-6">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", toneIconWrap.neutral)}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                      Admin-Level Chain Lookup
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-5">
                  <div className="flex gap-2">
                    <input
                      value={addressId}
                      onChange={(e) => setAddressId(e.target.value)}
                      placeholder="Address UUID"
                      className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5 font-mono text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--orange-400)]/50"
                    />
                    <button
                      type="button"
                      onClick={() => void lookupChain()}
                      disabled={chainLoading}
                      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[11.5px] font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-3)] disabled:opacity-40"
                    >
                      {chainLoading ? "Loading…" : "Look Up"}
                    </button>
                  </div>

                  {chainError ? (
                    <div className="mt-3 text-[11.5px] text-[color:var(--text-muted)]">{chainError}</div>
                  ) : null}

                  {chain ? (
                    <div className="relative mt-5 grid grid-cols-3 items-start gap-3 sm:grid-cols-6">
                      {chain.map((node, i) => {
                        const Icon = levelIcons[node.level] ?? MapPin;
                        const label = addressLevelName(
                          addressLevels.find((l) => l.level === node.level),
                          node.level,
                        );
                        const name = node.name.en ?? Object.values(node.name)[0] ?? node.code ?? "—";
                        return (
                          <motion.div
                            key={node.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease: "easeOut" }}
                            className="flex flex-col items-center gap-2 text-center"
                          >
                            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneIconWrap.accent)}>
                              <Icon className="h-[18px] w-[18px]" />
                            </div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                              {label}
                            </div>
                            <div className="text-[11px] font-semibold text-[color:var(--text-primary)]">{name}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-[color:var(--text-muted)]">
                      Paste an address UUID to load its stored admin-level chain
                      (GET /addresses/&#123;id&#125;/admin-levels). This is plain storage — there is
                      no expected-vs-actual comparison here.
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            </motion.div>
          </div>

          {/* RIGHT column: honest scope note */}
          <div className="flex flex-col gap-7">
            <motion.div variants={item}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center gap-2 px-6 pb-0 pt-6">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", toneIconWrap.neutral)}>
                    <Info className="h-4 w-4" />
                  </div>
                  <CardTitle className="font-display text-[14px] font-semibold text-[color:var(--text-primary)]">
                    About this page
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-5 text-[11.5px] leading-relaxed text-[color:var(--text-muted)]">
                  <p>
                    This page shows real flags and admin-level data stored in PlaceForge.
                    It does not compute anomalies live — comparing a place&apos;s coordinates
                    against its claimed country/region/city is GeoValidate&apos;s job, and that
                    logic isn&apos;t implemented there yet (its <code>geography</code>/
                    <code>validation</code> modules are empty stubs).
                  </p>
                  <p>
                    There is also no RAG pipeline, confidence-scoring model, or external
                    knowledge-source integration (OSM/Gov registry lookups) anywhere in this
                    codebase — those were mockup placeholders, not real capability.
                  </p>
                  <p className="text-[color:var(--text-muted)]">
                    See <code>features/verification/INTEGRATION.md</code> for the full
                    breakdown of what&apos;s real vs. planned on this page.
                  </p>
                </CardContent>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
