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
  const [committedPoints, setCommittedPoints] = useState<DrawPoint[]>([]);
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

  function finish(close: boolean) {
    if (committedPoints.length < 2) {
      // Degenerate result (§C2.10) — silently discarded, not saved.
      reset();
      store.setMode("browse");
      return;
    }
    const wayId = store.commitDrawnLine(committedPoints, {}, close);
    reset();
    store.select({ type: "way", id: wayId }, false);
  }

  useMapEvent("click", (e) => {
    if (store.zoom < store.minEditZoom) return;

    if (store.mode === "drawPoint") {
      const id = store.createPoint(e.latlng.lat, e.latlng.lng);
      // select() already transitions mode to "select" — a trailing
      // setMode("browse") here would immediately wipe the selection
      // straight back out (setMode clears selection whenever the next
      // mode isn't "select") and leave the just-drawn point unselected.
      store.select({ type: "node", id }, false);
      return;
    }
    if (!drawingLine) return;

    const snap = findSnap(L, map, index, e.latlng.lat, e.latlng.lng, excludeIds());
    const { lat, lon } = resolveLatLon(e.latlng, snap);
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
    if (wouldSelfIntersect(tentative) && !e.originalEvent.altKey) return; // blocked (§C2.8)

    setCommittedPoints((prev) => [
      ...prev,
      {
        lat,
        lon,
        existingNodeId: snap?.kind === "node" ? snap.node.id : undefined,
        insertIntoWay: snap?.kind === "way" ? { wayId: snap.way.id, atIndex: snap.segmentIndex + 1 } : undefined,
      },
    ]);
  });

  useMapEvent("mousemove", (e) => {
    if (!drawingLine) return;
    const snap = findSnap(L, map, index, e.latlng.lat, e.latlng.lng, excludeIds());
    const { lat, lon } = resolveLatLon(e.latlng, snap);
    setLivePoint({ lat, lon, snap });
  });

  useEffect(() => {
    if (!drawingLine && store.mode !== "drawPoint") return;
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Escape") {
        reset();
        store.setMode("browse");
      } else if (e.key === "Enter" && drawingLine) {
        finish(false);
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
