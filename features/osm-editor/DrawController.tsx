"use client";

// Draw Point/Line/Area interaction — map-editor-full-spec.md §C2. Lives
// as its own component (rather than inside OsmEditorMap's render) since
// it owns a live, high-frequency local buffer (in-progress points +
// rubber-band cursor position) that has no business being store state
// (spec §C12: "in-progress draw/drag operations are not committed to
// history until finished").

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, Polyline, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import type { DrawPoint } from "./lib/drawing";
import { wouldSelfIntersect } from "./lib/drawing";
import { commonWay, followPath } from "./lib/navigation";
import { findSnap, type SnapResult } from "./lib/snapping";
import { SpatialIndex } from "./lib/spatialIndex";
import type { EditorStore } from "./useEditorStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

// A click within this many pixels of the draw session's first/last
// committed point counts as "clicking that point" for finishing
// purposes — same order of magnitude as the vertex touch target (§B7).
const CLOSE_HIT_PX = 10;

function resolveLatLon(latlng: L.LatLng, snap: SnapResult): { lat: number; lon: number } {
  if (snap?.kind === "node") return { lat: snap.node.lat, lon: snap.node.lon };
  if (snap?.kind === "way") return { lat: snap.lat, lon: snap.lon };
  return { lat: latlng.lat, lon: latlng.lng };
}

export default function DrawController({ store }: { store: EditorStore }) {
  const map = useMap();
  // A Continue session starts with its existing end node already placed;
  // the lazy initializer reads the target once at mount (the parent
  // remounts this component per mode).
  const [committedPoints, setCommittedPoints] = useState<DrawPoint[]>(() => {
    const t = store.continueTarget;
    const node = t ? store.graph.node(t.nodeId) : undefined;
    return node ? [{ lat: node.lat, lon: node.lon, existingNodeId: node.id }] : [];
  });
  const [livePoint, setLivePoint] = useState<{ lat: number; lon: number; snap: SnapResult } | null>(null);

  const index = useMemo(() => new SpatialIndex(store.graph), [store.graph]);
  const drawingLine = store.mode === "drawLine" || store.mode === "drawArea";

  // Auto-zoom-in when starting an edit action below the minimum
  // editable zoom (§B5). The in-progress point buffer resets for free
  // whenever the mode changes, since the parent remounts this component
  // with `key={mode}` — no effect-based reset needed.
  useEffect(() => {
    if ((store.mode === "drawPoint" || drawingLine) && store.zoom < store.minEditZoom) {
      map.setZoom(store.minEditZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode]);

  function excludeIds(): Set<number> {
    const ids = new Set<number>();
    for (const p of committedPoints) if (p.existingNodeId !== undefined) ids.add(p.existingNodeId);
    return ids;
  }

  function reset() {
    setCommittedPoints([]);
    setLivePoint(null);
  }

  const continuing = store.continueTarget !== null;

  // iD's Follow (F): with the line's last point on an existing vertex and the
  // pointer on another vertex of the same way, walk along that way between
  // them instead of cutting across.
  function follow() {
    const last = committedPoints[committedPoints.length - 1];
    if (!last || last.existingNodeId === undefined) {
      store.flash("Follow: start the line on an existing vertex first");
      return;
    }
    const target = livePoint?.snap?.kind === "node" ? livePoint.snap.node : null;
    if (!target) {
      store.flash("Follow: put the pointer on another vertex of the same way, then press F");
      return;
    }
    const way = commonWay(store.graph, last.existingNodeId, target.id);
    const path = way ? followPath(way, last.existingNodeId, target.id) : null;
    if (!path) {
      store.flash("Follow: that vertex isn't on the same way");
      return;
    }
    const added = path.slice(1).flatMap((id) => {
      const n = store.graph.node(id);
      return n ? [{ lat: n.lat, lon: n.lon, existingNodeId: id }] : [];
    });
    setCommittedPoints((prev) => [...prev, ...added]);
  }

  function finish(close: boolean) {
    if (committedPoints.length < 2) {
      // Degenerate result (§C2.10) — silently discarded, not saved.
      reset();
      store.setMode("browse");
      return;
    }
    if (continuing) {
      // Continue never closes into a new area; it just extends the line.
      const wayId = store.commitContinuedLine(committedPoints);
      reset();
      if (wayId !== null) store.select({ type: "way", id: wayId }, false);
      else store.setMode("browse");
      return;
    }
    const wayId = store.commitDrawnLine(committedPoints, {}, close);
    reset();
    store.select({ type: "way", id: wayId }, false);
  }

  // Places a point at `latlng` — shared by mouse clicks and the Space key
  // (iD: Space = click at the cursor). `alt` disables snapping and the
  // self-intersection guard, like iD's Alt.
  function place(latlng: L.LatLng, alt: boolean) {
    // Add-note mode: the click only picks a spot; the panel saves the note.
    // Notes aren't edits, so the minimum-edit-zoom gate doesn't apply.
    if (store.mode === "addNote") {
      store.setNoteDraft({ lat: latlng.lat, lon: latlng.lng });
      return;
    }
    if (store.zoom < store.minEditZoom) return;

    if (store.mode === "drawPoint") {
      const id = store.createPoint(latlng.lat, latlng.lng);
      // select() already transitions mode to "select" — a trailing
      // setMode("browse") here would immediately wipe the selection
      // straight back out (setMode clears selection whenever the next
      // mode isn't "select") and leave the just-drawn point unselected.
      store.select({ type: "node", id }, false);
      return;
    }
    if (!drawingLine) return;

    const snap = (store.snapping ? alt : !alt) ? null : findSnap(L, map, index, latlng.lat, latlng.lng, excludeIds());
    const { lat, lon } = resolveLatLon(latlng, snap);
    const clickPx = map.latLngToContainerPoint([lat, lon]);

    if (committedPoints.length >= 2) {
      const first = committedPoints[0];
      if (map.latLngToContainerPoint([first.lat, first.lon]).distanceTo(clickPx) < CLOSE_HIT_PX) {
        finish(true);
        return;
      }
      const head = committedPoints[committedPoints.length - 1];
      if (map.latLngToContainerPoint([head.lat, head.lon]).distanceTo(clickPx) < CLOSE_HIT_PX) {
        finish(false);
        return;
      }
    }

    const tentative = [...committedPoints, { lat, lon }];
    if (wouldSelfIntersect(tentative) && !alt) return; // blocked (§C2.8)

    setCommittedPoints((prev) => [
      ...prev,
      {
        lat,
        lon,
        existingNodeId: snap?.kind === "node" ? snap.node.id : undefined,
        insertIntoWay: snap?.kind === "way" ? { wayId: snap.way.id, atIndex: snap.segmentIndex + 1 } : undefined,
      },
    ]);
  }

  useMapEvent("click", (e) => place(e.latlng, e.originalEvent.altKey));

  useMapEvent("mousemove", (e) => {
    if (!drawingLine) return;
    const snap = (store.snapping ? e.originalEvent.altKey : !e.originalEvent.altKey) ? null : findSnap(L, map, index, e.latlng.lat, e.latlng.lng, excludeIds());
    const { lat, lon } = resolveLatLon(e.latlng, snap);
    setLivePoint({ lat, lon, snap });
  });

  useEffect(() => {
    if (!drawingLine && store.mode !== "drawPoint" && store.mode !== "addNote") return;
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        reset();
        store.setMode("browse");
      } else if (e.key === "Enter" && drawingLine) {
        finish(false);
      } else if (e.key === " ") {
        // Space places a point at the pointer, like a click.
        const at = store.cursorRef.current;
        if (at) {
          e.preventDefault();
          place(L.latLng(at.lat, at.lon), e.altKey);
        }
      } else if ((e.key === "f" || e.key === "F") && drawingLine && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        follow();
      } else if (e.key === "Backspace" && drawingLine) {
        e.preventDefault();
        setCommittedPoints((prev) => prev.slice(0, -1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode, committedPoints]);

  if (!drawingLine) return null;

  const previewPoints = livePoint ? [...committedPoints, livePoint] : committedPoints;
  const blocked = committedPoints.length >= 2 && !!livePoint && wouldSelfIntersect([...committedPoints, livePoint]);

  return (
    <>
      {previewPoints.length >= 2 ? (
        <Polyline
          positions={previewPoints.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: blocked ? "#ef4444" : "#38bdf8", weight: 3, dashArray: "6 4" }}
          interactive={false}
        />
      ) : null}
      {committedPoints.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lon]}
          radius={4}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: p.existingNodeId !== undefined || p.insertIntoWay ? "#22c55e" : "#38bdf8",
            fillOpacity: 1,
          }}
          interactive={false}
        />
      ))}
      {livePoint ? (
        <CircleMarker
          center={[livePoint.lat, livePoint.lon]}
          radius={5}
          pathOptions={{
            color: blocked ? "#ef4444" : "#fff",
            weight: 1.5,
            fillColor: livePoint.snap ? "#22c55e" : blocked ? "#ef4444" : "#38bdf8",
            fillOpacity: 0.9,
          }}
          interactive={false}
        />
      ) : null}
    </>
  );
}
