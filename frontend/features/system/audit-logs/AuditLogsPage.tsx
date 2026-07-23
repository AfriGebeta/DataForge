"use client";

import { GlassCard } from "@/features/shared/GlassCard";
import { exportAuditLogsToCSV } from "./export/exportHandler";

export default function AuditLogsPage() {
  return (
    <div className="view active" id="v-audit-logs">
      <div className="page-hd">
        <h2>System Audit Logs</h2>
        <p>
          Comprehensive chronological record of all system, AI, and human
          actions affecting spatial data integrity. Retained for 90 days for
          compliance.
        </p>
      </div>

      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button className="btn sm">
          <i className="ti ti-calendar" />
          Oct 24, 2023 – Oct 25, 2023
        </button>
        <button className="btn sm">
          <i className="ti ti-adjustments" />
          Action Type ▾
        </button>
        <button className="btn sm">
          <i className="ti ti-user" />
          User / System ▾
        </button>
        <button
          className="btn sm"
          style={{ marginLeft: "auto" }}
          onClick={() => void exportAuditLogsToCSV()}
        >
          <i className="ti ti-download" />
          Export CSV
        </button>
      </div>

      <GlassCard flat className="card">
        <table>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">2023-10-25 14:32:01.442</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--fill-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    AS
                  </div>
                  <span>A. Smith (Analyst)</span>
                </div>
              </td>
              <td>
                <i
                  className="ti ti-git-merge"
                  style={{ fontSize: 12, marginRight: 4, color: "var(--text-accent)" }}
                />
                Merged Duplicates
              </td>
              <td className="mono">POI-8492-X, POI-8493-Y</td>
              <td>
                <span className="bx s">Success</span>
              </td>
            </tr>
            <tr>
              <td className="mono">2023-10-25 14:30:12.105</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--bg-accent)",
                      border: "1px solid var(--fill-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className="ti ti-map-pin"
                      style={{ fontSize: 10, color: "var(--text-accent)" }}
                    />
                  </div>
                  <span>Model_GeoVal_v4.2</span>
                </div>
              </td>
              <td>
                <i
                  className="ti ti-refresh"
                  style={{ fontSize: 12, marginRight: 4, color: "var(--text-accent)" }}
                />
                Rescored Record
              </td>
              <td className="mono">LOC-1029-A</td>
              <td>
                <span className="bx s">Success</span>
              </td>
            </tr>
            <tr>
              <td className="mono">2023-10-25 14:28:55.992</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      flexShrink: 0,
                    }}
                  >
                    <i className="ti ti-server" style={{ fontSize: 10 }} />
                  </div>
                  <span>System (API Sync)</span>
                </div>
              </td>
              <td>
                <i
                  className="ti ti-map-pin"
                  style={{ fontSize: 12, marginRight: 4, color: "var(--text-accent)" }}
                />
                Coordinates Updated
              </td>
              <td className="mono">BATCH-774-K</td>
              <td>
                <span className="bx w">Review Flagged</span>
              </td>
            </tr>
            <tr>
              <td className="mono">2023-10-25 14:15:00.003</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      flexShrink: 0,
                    }}
                  >
                    <i className="ti ti-cloud" style={{ fontSize: 10 }} />
                  </div>
                  <span>OSM Ingestion Bot</span>
                </div>
              </td>
              <td>
                <i
                  className="ti ti-database"
                  style={{ fontSize: 12, marginRight: 4, color: "var(--text-danger)" }}
                />
                Schema Validation Failed
              </td>
              <td className="mono">FILE-OSM-ETH-23</td>
              <td>
                <span className="bx d">Failed</span>
              </td>
            </tr>
            <tr>
              <td className="mono">2023-10-25 13:50:22.118</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    JD
                  </div>
                  <span>J. Doe (Admin)</span>
                </div>
              </td>
              <td>
                <i
                  className="ti ti-link"
                  style={{ fontSize: 12, marginRight: 4, color: "var(--text-accent)" }}
                />
                Modified Attributes
              </td>
              <td className="mono">POI-9921-Z</td>
              <td>
                <span className="bx s">Success</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          Showing 1 to 5 of 97,214 results
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button className="btn ghost sm">
              <i className="ti ti-chevron-left" />
            </button>
            <button className="btn p sm">1</button>
            <button className="btn ghost sm">2</button>
            <button className="btn ghost sm">3</button>
            <span>…</span>
            <button className="btn ghost sm">
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
