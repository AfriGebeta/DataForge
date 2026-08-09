import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  humanCorrections: number;
  humanCorrectionsDelta: string;
  aiMistakes: number;
  aiMistakesDelta: string;
  retrainedSamples: number;
  retrainedPercent: number;
};

export default function MetricCards({
  humanCorrections,
  humanCorrectionsDelta,
  aiMistakes,
  aiMistakesDelta,
  retrainedSamples,
  retrainedPercent,
}: Props) {
  return (
    <div className="g3">
      <GlassCard flat className="mc">
        <i className="ti ti-pencil mc-icon" style={{ color: "var(--text-accent)" }} />
        <div className="ml">Human Corrections</div>
        <div className="mv" style={{ color: "var(--text-accent)" }}>
          {humanCorrections.toLocaleString()}
        </div>
        <div className="ms" style={{ color: "var(--text-success)" }}>
          ↑ {humanCorrectionsDelta}
        </div>
      </GlassCard>
      <GlassCard flat className="mc">
        <i className="ti ti-alert-triangle mc-icon" style={{ color: "var(--text-warning)" }} />
        <div className="ml">AI Mistakes Detected</div>
        <div className="mv">{aiMistakes.toLocaleString()}</div>
        <div className="ms" style={{ color: "var(--text-success)" }}>
          ↓ {aiMistakesDelta}
        </div>
      </GlassCard>
      <GlassCard flat className="mc">
        <i className="ti ti-refresh mc-icon" />
        <div className="ml">Retrained Samples</div>
        <div className="mv">{retrainedSamples.toLocaleString()}</div>
        <div className="ms">
          {retrainedPercent}% integrated into v2.4.2
          <div className="pb" style={{ marginTop: 5 }}>
            <div className="pbf" style={{ width: `${retrainedPercent}%` }} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}