import type { AnalyticsData } from "../../types";
import { RiskRanking, TrustScoreChart } from "./components";

type Props = {
  data: AnalyticsData;
};

export default function AnalyticsSection({ data }: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Analytics</h2>
        <p>Trust score trend, duplicate detection accuracy, and reviewer activity.</p>
      </div>

      <div className="g2-3">
        <TrustScoreChart
          trend={data.trust_score_trend}
          duplicateRate={data.duplicate_detection_rate}
          reviewerProductivity7d={data.reviewer_productivity_7d}
          peakReviewHour={data.peak_review_hour}
        />
        <RiskRanking segments={data.risk_segments} />
      </div>
    </>
  );
}
