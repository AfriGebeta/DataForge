import type {
  CompletenessLevel,
  CompletenessRule,
  PlaceType,
} from "../../types";
import LevelBadge from "./LevelBadge";
import PlaceTypeBadge from "./PlaceTypeBadge";
import { GlassCard } from "@/features/shared/GlassCard";

type Props = {
  rules: CompletenessRule[];
  loading: boolean;
  placeTypeFilter: PlaceType | "";
  levelFilter: CompletenessLevel | "";
  onPlaceTypeFilter: (value: PlaceType | "") => void;
  onLevelFilter: (value: CompletenessLevel | "") => void;
  onDelete: (id: string) => void;
  onCreateRule: () => void;
};

export default function CompletenessRulesSection({
  rules,
  loading,
  placeTypeFilter,
  levelFilter,
  onPlaceTypeFilter,
  onLevelFilter,
  onDelete,
  onCreateRule,
}: Props) {
  return (
    <>
      <div className="page-hd">
        <h2>Completeness Rules</h2>
        <p>Define required fields and quality thresholds for each place type.</p>
      </div>

      <div className="toolbar">
        <select
          value={placeTypeFilter}
          onChange={(e) => onPlaceTypeFilter(e.target.value as PlaceType | "")}
          style={{ width: 120 }}
        >
          <option value="">All types</option>
          <option value="POI">POI</option>
          <option value="ROAD">ROAD</option>
          <option value="BUILDING">BUILDING</option>
          <option value="MUNICIPALITY">MUNICIPALITY</option>
          <option value="TRANSIT_STOP">TRANSIT_STOP</option>
        </select>

        <select
          value={levelFilter}
          onChange={(e) => onLevelFilter(e.target.value as CompletenessLevel | "")}
          style={{ width: 110 }}
        >
          <option value="">All levels</option>
          <option value="MINIMAL">MINIMAL</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="GOOD">GOOD</option>
          <option value="COMPLETE">COMPLETE</option>
        </select>

        <button
          className="btn p"
          style={{ marginLeft: "auto" }}
          onClick={onCreateRule}
        >
          <i className="ti ti-plus" />
          Create rule
        </button>
      </div>

      <GlassCard flat className="card">
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</p>
        ) : rules.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No rules found.</p>
        ) : (
          <table>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Place type</th>
                <th>Required field</th>
                <th>Weight</th>
                <th>Level</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <PlaceTypeBadge placeType={rule.place_type} />
                  </td>
                  <td className="mono">{rule.required_field}</td>
                  <td>{rule.weight.toFixed(2)}</td>
                  <td>
                    <LevelBadge level={rule.level} />
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {rule.description}
                  </td>
                  <td>
                    <button
                      className="btn sm d"
                      onClick={() => onDelete(rule.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </>
  );
}