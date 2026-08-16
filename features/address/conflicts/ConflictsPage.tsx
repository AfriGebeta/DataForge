"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAddressBoundary,
  fetchAddressNode,
  fetchBoundaryConflicts,
  fetchConflictPlace,
  fetchHierarchyConflicts,
  updateAddressBoundary,
} from "./api";
import type { AddressBoundary, AddressNode, BoundaryConflict, ConflictPlaceInfo, HierarchyConflictFlag } from "./types";
import type { ConflictEditTarget } from "./ConflictMap";

// Leaflet touches `window` at module load time, which crashes during
// Next's server render of this "use client" tree - same reason
// map-explorer's MapCanvas.tsx loads its map client-only.
const ConflictMap = dynamic(() => import("./ConflictMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        height: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-1)",
        color: "var(--text-muted)",
        fontSize: 12,
      }}
    >
      Loading map…
    </div>
  ),
});

function nodeLabel(node: AddressNode | null): string {
  if (!node) return "Unknown node";
  const name = node.name?.en ?? Object.values(node.name ?? {})[0] ?? "(unnamed)";
  return node.level != null ? `${name} (level ${node.level})` : name;
}

function boundaryConflictNodeName(name: Record<string, string> | null): string {
  return name?.en ?? Object.values(name ?? {})[0] ?? "(unnamed)";
}

// BoundaryConflict pairs have no id of their own (they're computed live,
// not a stored row - see fetchBoundaryConflicts) - the two node ids
// together are already unique per pair since the backend query only ever
// emits nodeAId < nodeBId once each.
function boundaryConflictKey(c: BoundaryConflict): string {
  return `${c.nodeAId}:${c.nodeBId}`;
}

const editBoundaryButtonStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  color: "var(--text-primary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default function ConflictsPage() {
  const [flags, setFlags] = useState<HierarchyConflictFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [place, setPlace] = useState<ConflictPlaceInfo | null>(null);
  const [conflictingNode, setConflictingNode] = useState<AddressNode | null>(null);
  const [conflictingBoundary, setConflictingBoundary] = useState<AddressBoundary | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [boundaryConflicts, setBoundaryConflicts] = useState<BoundaryConflict[]>([]);
  const [boundaryLoading, setBoundaryLoading] = useState(true);
  const [boundaryError, setBoundaryError] = useState<string | null>(null);
  const [selectedBoundaryKey, setSelectedBoundaryKey] = useState<string | null>(null);
  const [boundaryA, setBoundaryA] = useState<AddressBoundary | null>(null);
  const [boundaryB, setBoundaryB] = useState<AddressBoundary | null>(null);
  const [boundaryDetailLoading, setBoundaryDetailLoading] = useState(false);

  // Inline "fix it right here" editing for one side of the selected
  // boundary conflict - lets a user drag vertices on this page's own map
  // instead of needing to go to the Address map for the same PUT
  // /addresses/{id}/boundary action.
  const [editingSide, setEditingSide] = useState<"a" | "b" | null>(null);
  const [savingBoundary, setSavingBoundary] = useState(false);
  const [saveBoundaryError, setSaveBoundaryError] = useState<string | null>(null);
  // Written on every vertex drag while editing; read once when Save is
  // clicked - same ref-not-state reasoning as AddressNodesPage's
  // editDraftRef (fires many times per second, already rendered by
  // ConflictMap's own imperative Leaflet layer).
  const editBoundaryDraftRef = useRef<GeoJSON.Geometry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHierarchyConflicts();
      setFlags(data);
      if (data.length > 0) setSelectedId((current) => current ?? data[0].id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load hierarchy conflicts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadBoundaryConflicts = useCallback(async () => {
    setBoundaryLoading(true);
    setBoundaryError(null);
    try {
      const data = await fetchBoundaryConflicts();
      setBoundaryConflicts(data);
      if (data.length > 0) setSelectedBoundaryKey((current) => current ?? boundaryConflictKey(data[0]));
    } catch (cause) {
      setBoundaryError(cause instanceof Error ? cause.message : "Unable to load boundary conflicts.");
    } finally {
      setBoundaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoundaryConflicts();
  }, [loadBoundaryConflicts]);

  const selected = flags.find((f) => f.id === selectedId) ?? null;
  const selectedBoundaryConflict = boundaryConflicts.find((c) => boundaryConflictKey(c) === selectedBoundaryKey) ?? null;

  useEffect(() => {
    if (!selected) {
      setPlace(null);
      setConflictingNode(null);
      setConflictingBoundary(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      const [p, node, boundary] = await Promise.all([
        fetchConflictPlace(selected.placeId),
        selected.conflictingNodeId ? fetchAddressNode(selected.conflictingNodeId) : Promise.resolve(null),
        selected.conflictingNodeId ? fetchAddressBoundary(selected.conflictingNodeId) : Promise.resolve(null),
      ]);
      if (!cancelled) {
        setPlace(p);
        setConflictingNode(node);
        setConflictingBoundary(boundary);
        setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    // Switching to a different conflict (or away from all of them) aborts
    // any in-progress edit rather than leaving it silently pointed at the
    // wrong pair.
    editBoundaryDraftRef.current = null;
    setEditingSide(null);
    setSaveBoundaryError(null);

    if (!selectedBoundaryConflict) {
      setBoundaryA(null);
      setBoundaryB(null);
      return;
    }
    let cancelled = false;
    setBoundaryDetailLoading(true);
    void (async () => {
      const [a, b] = await Promise.all([
        fetchAddressBoundary(selectedBoundaryConflict.nodeAId),
        fetchAddressBoundary(selectedBoundaryConflict.nodeBId),
      ]);
      if (!cancelled) {
        setBoundaryA(a);
        setBoundaryB(b);
        setBoundaryDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBoundaryConflict]);

  const points = [
    place ? { id: `place-${place.id}`, label: place.name, sublabel: "Flagged place", lat: place.latitude, lng: place.longitude, color: "#f59e0b" } : null,
    conflictingNode?.latitude != null && conflictingNode?.longitude != null
      ? {
          id: `node-${conflictingNode.id}`,
          label: nodeLabel(conflictingNode),
          sublabel: "Conflicting admin area",
          lat: conflictingNode.latitude,
          lng: conflictingNode.longitude,
          color: "#ef4444",
        }
      : null,
  ].filter((p): p is NonNullable<typeof p> => p !== null);

  const boundaries =
    conflictingBoundary?.boundary
      ? [{ id: conflictingBoundary.id, label: nodeLabel(conflictingNode), color: "#ef4444", geometry: conflictingBoundary.boundary }]
      : [];

  const boundaryMapBoundaries = [
    boundaryA?.boundary && selectedBoundaryConflict
      ? {
          id: `a-${selectedBoundaryConflict.nodeAId}`,
          label: boundaryConflictNodeName(selectedBoundaryConflict.nodeAName),
          color: "#f59e0b",
          geometry: boundaryA.boundary,
        }
      : null,
    boundaryB?.boundary && selectedBoundaryConflict
      ? {
          id: `b-${selectedBoundaryConflict.nodeBId}`,
          label: boundaryConflictNodeName(selectedBoundaryConflict.nodeBName),
          color: "#ef4444",
          geometry: boundaryB.boundary,
        }
      : null,
  ].filter((b): b is NonNullable<typeof b> => b !== null);

  const editingBoundaryTarget: ConflictEditTarget | null =
    editingSide && selectedBoundaryConflict
      ? editingSide === "a"
        ? boundaryA?.boundary
          ? { id: `a-${selectedBoundaryConflict.nodeAId}`, geometry: boundaryA.boundary }
          : null
        : boundaryB?.boundary
          ? { id: `b-${selectedBoundaryConflict.nodeBId}`, geometry: boundaryB.boundary }
          : null
      : null;

  function startEditingSide(side: "a" | "b") {
    const geometry = side === "a" ? boundaryA?.boundary : boundaryB?.boundary;
    if (!geometry) return;
    editBoundaryDraftRef.current = geometry;
    setSaveBoundaryError(null);
    setEditingSide(side);
  }

  function cancelEditingSide() {
    editBoundaryDraftRef.current = null;
    setSaveBoundaryError(null);
    setEditingSide(null);
  }

  // useCallback: passed to ConflictMap's EditableBoundary as an effect
  // dependency-adjacent prop - matches AddressNodesPage's
  // handleEditChange, kept stable for the same reason.
  const handleEditBoundaryChange = useCallback((geometry: GeoJSON.Geometry) => {
    editBoundaryDraftRef.current = geometry;
  }, []);

  async function saveEditingSide() {
    if (!editingSide || !selectedBoundaryConflict) return;
    const nodeId = editingSide === "a" ? selectedBoundaryConflict.nodeAId : selectedBoundaryConflict.nodeBId;
    const geometry = editBoundaryDraftRef.current;
    if (!geometry) return;
    setSavingBoundary(true);
    setSaveBoundaryError(null);
    try {
      await updateAddressBoundary(nodeId, geometry);
      if (editingSide === "a") setBoundaryA({ id: nodeId, boundary: geometry });
      else setBoundaryB({ id: nodeId, boundary: geometry });
      editBoundaryDraftRef.current = null;
      setEditingSide(null);
      // The fix may have resolved this pair entirely (it'll just stop
      // showing up) or changed its overlap ratio - either way the list
      // needs a fresh read from Postgres, same as any other reshape.
      void loadBoundaryConflicts();
    } catch (cause) {
      setSaveBoundaryError(cause instanceof Error ? cause.message : "Failed to update boundary.");
    } finally {
      setSavingBoundary(false);
    }
  }

  return (
    <div>
      <div className="page-hd">
        <h2>Hierarchy Conflicts</h2>
        <p>
          Places whose address hierarchy (Country → Neighborhood) conflicts with another address&apos;s —
          see GeoValidate/docs/hierarchy-conflict-detection.md.
        </p>
      </div>

      {loading ? <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading…</p> : null}
      {error ? <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</p> : null}

      {!loading && !error && flags.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          No open hierarchy conflicts right now.
        </div>
      ) : null}

      {flags.length > 0 ? (
        <div className="g2" style={{ alignItems: "start" }}>
          <div className="card" style={{ maxHeight: 480, overflowY: "auto" }}>
            {flags.map((flag) => (
              <button
                key={flag.id}
                onClick={() => setSelectedId(flag.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  background: flag.id === selectedId ? "var(--surface-2)" : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Place #{flag.placeId}</div>
                <div style={{ color: "var(--text-secondary)" }}>{flag.message}</div>
              </button>
            ))}
          </div>

          <div>
            <ConflictMap points={points} boundaries={boundaries} />
            {detailLoading ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>Loading details…</p>
            ) : selected ? (
              <div className="card" style={{ marginTop: 12, padding: 14, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>Flagged place:</strong> {place?.name ?? `Place #${selected.placeId}`}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>Conflicting node:</strong> {nodeLabel(conflictingNode)}
                  {conflictingNode && conflictingNode.latitude == null ? (
                    <span style={{ color: "var(--text-muted)" }}> (no coordinates recorded yet)</span>
                  ) : null}
                </div>
                <div style={{ color: "var(--text-secondary)" }}>{selected.message}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="page-hd" style={{ marginTop: 32 }}>
        <h2>Boundary Overlaps</h2>
        <p>
          Same-level address nodes whose boundary polygons geometrically overlap — e.g. after reshaping one on
          the Address map and eating into a neighbor. Computed directly from PostGIS
          (address-admin-level/repository/main.go&apos;s ListBoundaryConflicts), not GeoValidate/AI — a
          neighborhood sitting inside its parent kebele is normal nesting, not a conflict, so only same-level
          pairs are ever compared.
        </p>
      </div>

      {boundaryLoading ? <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading…</p> : null}
      {boundaryError ? <p style={{ color: "var(--text-danger)", fontSize: 12 }}>{boundaryError}</p> : null}

      {!boundaryLoading && !boundaryError && boundaryConflicts.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          No overlapping boundaries right now.
        </div>
      ) : null}

      {boundaryConflicts.length > 0 ? (
        <div className="g2" style={{ alignItems: "start" }}>
          <div className="card" style={{ maxHeight: 480, overflowY: "auto" }}>
            {boundaryConflicts.map((c) => {
              const key = boundaryConflictKey(c);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedBoundaryKey(key)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: key === selectedBoundaryKey ? "var(--surface-2)" : "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {boundaryConflictNodeName(c.nodeAName)} ↔ {boundaryConflictNodeName(c.nodeBName)}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    Level {c.level} · {(c.overlapRatio * 100).toFixed(0)}% overlap
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <ConflictMap
              points={[]}
              boundaries={boundaryMapBoundaries}
              editing={editingBoundaryTarget}
              onEditChange={handleEditBoundaryChange}
            />
            {boundaryDetailLoading ? (
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>Loading details…</p>
            ) : selectedBoundaryConflict ? (
              <div className="card" style={{ marginTop: 12, padding: 14, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <span><span style={{ color: "#f59e0b" }}>●</span> {boundaryConflictNodeName(selectedBoundaryConflict.nodeAName)}</span>
                  {editingSide !== "a" ? (
                    <button
                      type="button"
                      onClick={() => startEditingSide("a")}
                      disabled={editingSide !== null || !boundaryA?.boundary}
                      style={editBoundaryButtonStyle}
                    >
                      Edit boundary
                    </button>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <span><span style={{ color: "#ef4444" }}>●</span> {boundaryConflictNodeName(selectedBoundaryConflict.nodeBName)}</span>
                  {editingSide !== "b" ? (
                    <button
                      type="button"
                      onClick={() => startEditingSide("b")}
                      disabled={editingSide !== null || !boundaryB?.boundary}
                      style={editBoundaryButtonStyle}
                    >
                      Edit boundary
                    </button>
                  ) : null}
                </div>

                {editingSide ? (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: 8 }}>
                      Drag the vertices on the map above to reshape{" "}
                      {editingSide === "a"
                        ? boundaryConflictNodeName(selectedBoundaryConflict.nodeAName)
                        : boundaryConflictNodeName(selectedBoundaryConflict.nodeBName)}
                      , then save.
                    </p>
                    {saveBoundaryError ? (
                      <div style={{ color: "var(--text-danger)", marginBottom: 8 }}>{saveBoundaryError}</div>
                    ) : null}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <button type="button" className="btn sm" onClick={cancelEditingSide} disabled={savingBoundary}>
                        Cancel
                      </button>
                      <button type="button" className="btn sm" onClick={() => void saveEditingSide()} disabled={savingBoundary}>
                        {savingBoundary ? "Saving…" : "Save boundary"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-secondary)" }}>
                    These overlap by {(selectedBoundaryConflict.overlapRatio * 100).toFixed(1)}% of the smaller
                    polygon&apos;s area. Click &quot;Edit boundary&quot; above to fix it right here.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
