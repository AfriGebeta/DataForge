import type { MergeRecord, MergeStrategy } from "../../types";
import StrategyBadge from "./StrategyBadge";
type Props = {
  records: MergeRecord[];
  loading: boolean;
  strategyFilter: MergeStrategy | "";
  onStrategyFilter: (value: MergeStrategy | "") => void;
  onRecordMerge: () => void;
};

export default function MergeRecordsSection({
  records,
  loading,
  strategyFilter,
  onStrategyFilter,
  onRecordMerge,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Merge Records</h2>
        <p>History of entity merges — automated and manual.</p>
      </div>

      <div className="toolbar">
        <select
          value={strategyFilter}
          onChange={(e) => onStrategyFilter(e.target.value as MergeStrategy | "")}
          style={{ width: 150 }}
        >
          <option value="">All strategies</option>
          <option value="MANUAL">MANUAL</option>
          <option value="AUTO_DISTANCE">AUTO_DISTANCE</option>
          <option value="AUTO_NAME_MATCH">AUTO_NAME_MATCH</option>
          <option value="AUTO_OVERLAP">AUTO_OVERLAP</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onRecordMerge}
        >
          <i className="ti ti-plus" />
          Record merge
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : records.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No merge records found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Winner</th>
                <th>Loser</th>
                <th>Strategy</th>
                <th>Reason</th>
                <th>Merged by</th>
                <th>Merged at</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="mono">{record.winner_id}…</td>
                  <td className="mono">{record.loser_id}…</td>
                  <td><StrategyBadge strategy={record.strategy} /></td>
                  <td style={{ color: "var(--text-secondary)" }}>{record.reason}</td>
                  <td style={{ color: "var(--text-muted)" }}>{record.merged_by}</td>
                  <td style={{ color: "var(--text-muted)" }}>{record.merged_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}