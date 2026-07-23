"use client";

import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { GlassCard } from "@/features/shared/GlassCard";

export default function SettingsPage() {
  const { message, visible, showToast } = useToast();

  return (
    <div className="view active" id="v-settings">
      <div className="page-hd">
        <h2>Platform Settings</h2>
        <p>
          Configure analytical thresholds, model integrations, and operational
          parameters for the cartographic intelligence engine.
        </p>
      </div>

      <div className="g2">
        <div>
          <GlassCard flat className="card" style={{ marginBottom: 12 }}>
            <div className="ch">
              <span className="ct">
                <i className="ti ti-brain" style={{ fontSize: 14, marginRight: 5 }} />
                AI Threshold Configuration
              </span>
            </div>
            <div className="fg">
              <div className="fl" style={{ display: "flex", justifyContent: "space-between" }}>
                Anomaly Detection Sensitivity{" "}
                <strong style={{ color: "var(--text-accent)" }}>0.85</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.85"
                style={{ padding: 0, border: "none", background: "transparent", cursor: "pointer", width: "100%" }}
              />
              <div className="fh">Higher values require stricter geometric conformity.</div>
            </div>
            <div className="fr">
              <div className="fg">
                <div className="fl">Max Processing Threads</div>
                <input type="number" defaultValue="16" min="1" />
              </div>
              <div className="fg">
                <div className="fl">Inference Timeout (ms)</div>
                <input type="number" defaultValue="2500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard flat className="card" style={{ marginBottom: 12 }}>
            <div className="ch">
              <span className="ct">
                <i className="ti ti-refresh" style={{ fontSize: 14, marginRight: 5 }} />
                Model Selection
              </span>
            </div>
            <div className="g3" style={{ gap: 8, marginBottom: 0 }}>
              <div style={{ background: "var(--bg-accent)", border: "2px solid var(--fill-accent)", borderRadius: 8, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <strong style={{ fontSize: 11 }}>Gebeta Vision v4</strong>
                  <span className="dot db" style={{ margin: "2px 0 0" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Primary production model. Satellite imagery analysis.
                </div>
                <span className="bx s" style={{ fontSize: 10 }}>ACTIVE</span>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                <strong style={{ fontSize: 11 }}>GeoBERT Fast</strong>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", margin: "4px 0 6px" }}>
                  Lower latency, reduced resolution. Rapid triage.
                </div>
                <span className="bx m" style={{ fontSize: 10 }}>AVAILABLE</span>
              </div>
              <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, opacity: 0.5 }}>
                <strong style={{ fontSize: 11 }}>Custom Hybrid</strong>
                <div style={{ fontSize: 10, color: "var(--text-muted)", margin: "4px 0 6px" }}>
                  Requires enterprise license and dedicated compute.
                </div>
                <span className="bx m" style={{ fontSize: 10 }}>LOCKED</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard flat className="card">
            <div className="ch">
              <span className="ct">
                <i className="ti ti-shield-check" style={{ fontSize: 14, marginRight: 5 }} />
                User Roles
              </span>
              <button className="btn ghost sm">Manage Team</button>
            </div>
            <div className="fg">
              <div className="fl">Default permission for new domain accounts</div>
              <select className="glass-select" defaultValue="Analyst (Read-only + Annotate)">
                <option>Analyst (Read-only + Annotate)</option>
                <option>Reviewer (Read + Review)</option>
                <option>Admin (Full Access)</option>
              </select>
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard flat className="card" style={{ marginBottom: 12 }}>
            <div className="ch">
              <span className="ct">
                <i className="ti ti-scale" style={{ fontSize: 14, marginRight: 5 }} />
                Trust Score Weights
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
              Weights determining the composite reliability metric.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span>Source Credibility</span>
                  <strong>40%</strong>
                </div>
                <div className="pb"><div className="pbf" style={{ width: "40%" }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span>Historical Accuracy</span>
                  <strong>35%</strong>
                </div>
                <div className="pb"><div className="pbf" style={{ width: "35%" }} /></div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span>Human Verification</span>
                  <strong>25%</strong>
                </div>
                <div className="pb"><div className="pbf" style={{ width: "25%" }} /></div>
              </div>
            </div>
          </GlassCard>

          <GlassCard flat className="card" style={{ marginBottom: 12 }}>
            <div className="ch">
              <span className="ct">
                <i className="ti ti-plug" style={{ fontSize: 14, marginRight: 5 }} />
                API Integrations
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-map" style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>OpenStreetMap Sync</div>
                    <div style={{ fontSize: 10, color: "var(--text-success)" }}>Connected</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <i className="ti ti-satellite" style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>Maxar Imagery</div>
                    <div style={{ fontSize: 10, color: "var(--text-danger)" }}>Auth Expired</div>
                  </div>
                </div>
                <button className="btn sm p" onClick={() => showToast("Renewing auth…")}>
                  RENEW
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard flat className="card">
            <div className="ch">
              <span className="ct">
                <i className="ti ti-bell" style={{ fontSize: 14, marginRight: 5 }} />
                Alert Preferences
              </span>
            </div>
            <div className="pref-list">
              <label className="pref-check">
                <input type="checkbox" defaultChecked />
                <span>Critical Anomaly Detected (Score &gt; 0.9)</span>
              </label>
              <label className="pref-check">
                <input type="checkbox" defaultChecked />
                <span>API Sync Failures</span>
              </label>
              <label className="pref-check">
                <input type="checkbox" />
                <span>Weekly Metric Summary Digest</span>
              </label>
            </div>
          </GlassCard>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
        <button className="btn" onClick={() => showToast("Changes discarded")}>
          Discard Changes
        </button>
        <button className="btn p" onClick={() => showToast("Configuration saved!")}>
          <i className="ti ti-check" />
          Save Configuration
        </button>
      </div>

      <Toast message={message} visible={visible} />
    </div>
  );
}
