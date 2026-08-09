import type { AnalyticsData } from "../../types";
import { RiskRanking, TrustScoreChart } from "./components";

type Props = {
  data: AnalyticsData;
  onExportCsv: () => void;
  onReportPdf: () => void;
  onViewRegistry: () => void;
};

export default function AnalyticsSection({
  data,
  onExportCsv,
  onReportPdf,
  onViewRegistry,
}: Props) {
  return (
    <>
      <div
        className="page-hd"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2>Executive Insights</h2>
          <p>Global cartographic fidelity and reviewer throughput analysis.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn sm" onClick={onExportCsv}>
            <i className="ti ti-download" />
            Export CSV
          </button>
          <button className="btn sm" onClick={onReportPdf}>
            <i className="ti ti-file-text" />
            Report PDF
          </button>
        </div>
      </div>

      <div className="g2-3">
        <TrustScoreChart
          bars={data.trust_score_trend}
          delta={data.trust_score_delta}
          duplicateRate={data.duplicate_detection_rate}
          duplicateDelta={data.duplicate_detection_delta}
          reviewerProductivity={data.reviewer_productivity}
          peakHours={data.peak_hours}
        />
        <RiskRanking zones={data.risk_zones} onViewRegistry={onViewRegistry} />
      </div>
    </>
  );
}