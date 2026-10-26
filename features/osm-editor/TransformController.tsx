"use client";

// Interactive Move / Rotate modes (iD's M and R): after the operation is
// started the selection follows the pointer with no button held; click
// confirms, Escape cancels. The preview graph is recomputed from the
// *committed* graph on every pointer move (never accumulated), so the
// result is always exactly "original + current delta" and cancelling is
// just dropping the preview.
//
// This component is also the editor's single source of the live pointer
// position (store.cursorRef), which Paste uses.

import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import * as geo from "./lib/geo";
import { rotateNodes, selectionCenter, translateNodes } from "./lib/operations";
import type { EditorStore } from "./useEditorStore";

export default function TransformController({ store }: { store: EditorStore }) {
  const map = useMap();
  const { transform, committedGraph, setPreview, finishTransform, cursorRef } = store;
  // Pointer position (mercator) at the first move event after the
  // transform started — the reference all deltas/angles are measured from.
  const startRef = useRef<geo.Vec | null>(null);
  const centerRef = useRef<geo.Vec | null>(null);

  useEffect(() => {
    startRef.current = null;
    centerRef.current = transform ? selectionCenter(committedGraph, transform.nodeIds) : null;
    // committedGraph is stable for the duration of a transform (the user
    // can't commit anything else while the pointer owns the map).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transform]);

  useEffect(() => {
    if (!transform) return;
    const container = map.getContainer();
    container.classList.add("osm-editor-transforming");
    map.doubleClickZoom.disable();
    return () => {
      container.classList.remove("osm-editor-transforming");
      map.doubleClickZoom.enable();
    };
  }, [transform, map]);

  useEffect(() => {
    if (!transform) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        finishTransform(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        finishTransform(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transform, finishTransform]);

  useMapEvents({
    mousemove(e) {
      cursorRef.current = { lat: e.latlng.lat, lon: e.latlng.lng };
      if (!transform) return;
      const p = geo.project(e.latlng.lat, e.latlng.lng);
      if (!startRef.current) {
        startRef.current = p;
        return;
      }
      if (transform.kind === "move") {
        setPreview(translateNodes(committedGraph, transform.nodeIds, p.x - startRef.current.x, p.y - startRef.current.y));
      } else if (centerRef.current) {
        const c = centerRef.current;
        const a0 = Math.atan2(startRef.current.y - c.y, startRef.current.x - c.x);
        const a1 = Math.atan2(p.y - c.y, p.x - c.x);
        setPreview(rotateNodes(committedGraph, transform.nodeIds, c, a1 - a0));
      }
    },
    click(e) {
      if (!transform) return;
      e.originalEvent.stopPropagation();
      finishTransform(true);
    },
  });

  return null;
}
