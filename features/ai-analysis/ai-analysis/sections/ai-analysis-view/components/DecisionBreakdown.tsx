import type { DecisionCount } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  items: DecisionCount[];
  total: number;
};

function dotColor(decision: string): string {
  if (decision === "DUPLICATE" || decision === "INVALID") return "#dc2626";
  if (decision === "AMBIGUOUS") return "#c07a0a";
  if (decision === "VALID") return "#1f9d52";
  return "#6b7280";
}

export default function DecisionBreakdown({ items, total }: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">AI Decision Breakdown</span>
      </div>
      <table>
        <colgroup>
          <col style={{ width: "40%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Decision</th>
            <th>Count</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.decision}>
              <td>
                <span className="dot" style={{ background: dotColor(d.decision) }} />
                {d.decision}
              </td>
              <td style={{ fontWeight: 600 }}>{d.count}</td>
              <td>{total > 0 ? `${((d.count / total) * 100).toFixed(1)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
