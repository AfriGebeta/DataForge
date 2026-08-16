import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * GlassCard — the shared card surface used across the dashboard.
 *
 * It is a thin wrapper around the shadcn `<Card>` primitive that bakes in
 * the exact classes the Overview / Data / Verification pages already apply
 * to their cards:
 *
 *   glass-surface | glass-surface-accent | glass-surface-danger
 *   glass-glow relative overflow-hidden border-0 py-0
 *   (+ ring-1 <tone> for the KPI cards)
 *
 * The rendered element and class set are identical to the previous inline
 * markup, so swapping a `<Card className="glass-surface glass-glow …">` for
 * `<GlassCard>` is a pure refactor with no visual change. `<CardHeader>`,
 * `<CardContent>`, `<CardTitle>` still compose inside it unchanged.
 */
export type GlassTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** Surface treatment. Only neutral/accent/danger surfaces exist in the design;
 *  success/warning reuse the neutral surface (they only differ via the ring). */
const surfaceByTone: Record<GlassTone, string> = {
  neutral: "glass-surface",
  accent: "glass-surface-accent",
  success: "glass-surface",
  warning: "glass-surface",
  danger: "glass-surface-danger",
};

/** Ring colour — mirrors the `toneRing` map the pages used inline. */
const ringByTone: Record<GlassTone, string> = {
  neutral: "ring-[color:var(--border)]",
  accent: "ring-[color:var(--orange-400)]/30",
  success: "ring-[color:var(--text-success)]/25",
  warning: "ring-[color:var(--text-warning)]/25",
  danger: "ring-[color:var(--text-danger)]/30",
};

export type GlassCardProps = ComponentProps<typeof Card> & {
  /** Glass surface treatment. Defaults to the neutral `glass-surface`. */
  tone?: GlassTone;
  /** Add the inset `ring-1` outline (as the KPI cards do). */
  ring?: boolean;
  /**
   * Ring colour when it differs from the surface tone — the KPI cards keep a
   * neutral/accent surface but ring in the metric's own tone. Defaults to `tone`.
   */
  ringTone?: GlassTone;
  /**
   * Layout-neutral mode. Renders a plain block `<div>` instead of the shadcn
   * `<Card>` (which imposes `flex flex-col gap-6`). Use for the free-form
   * legacy cards — panels whose children flow normally — so the card surface
   * comes from this component without changing their internal spacing.
   * The visible effect is identical; only the box layout differs.
   */
  flat?: boolean;
};

export function GlassCard({
  tone = "neutral",
  ring = false,
  ringTone,
  flat = false,
  className,
  ...props
}: GlassCardProps) {
  const classes = cn(
    "glass-glow relative overflow-hidden border py-0",
    surfaceByTone[tone],
    ring && cn("ring-1", ringByTone[ringTone ?? tone]),
    className,
  );

  if (flat) {
    // Plain block box + the shadcn Card's visual base (rounded-xl, shadow-sm),
    // no flex/gap — so it matches the legacy `.card`/`.mc` block flow exactly.
    return (
      <div data-slot="card" className={cn("rounded-xl shadow-sm", classes)} {...props} />
    );
  }

  return <Card className={classes} {...props} />;
}

export default GlassCard;
