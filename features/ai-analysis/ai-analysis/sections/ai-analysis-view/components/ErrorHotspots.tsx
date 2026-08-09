import type { ErrorHotspot } from "../../../types";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  hotspots: ErrorHotspot[];
};

export default function ErrorHotspots({ hotspots }: Props) {
  return (
    <GlassCard flat className="card">
      <div className="ch">
        <span className="ct">Error Hotspots</span>
        <span className="chip hi">Anomaly Detected</span>
      </div>
      <table>
        <colgroup>
          <col style={{ width: "35%" }} />
          <col style={{ width: "40%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Region/Country</th>
            <th>Failure Type</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {hotspots.map((h) => (
            <tr key={h.region}>
              <td>
                <span className="dot" style={{ background: h.dot_color }} />
                {h.region}
              </td>
              <td>{h.failure_type}</td>
              <td style={{ fontWeight: 600 }}>{h.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}