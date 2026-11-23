"use client";

// Draws the edit tasks in view (rows of edit_task) as dots inside <MapContainer>. Click a dot to select it; the
// selected one becomes a big draggable marker (drop it where the object really is). Built with
// imperative Leaflet because react-leaflet bakes `interactive`/`draggable` in at construction.

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { EditorStore } from "./useEditorStore";

const MIN_ZOOM = 15; // below this the dots are too dense to be useful

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;box-sizing:border-box;border:3px solid #fff;background:${color};box-shadow:0 0 0 2px #000,0 2px 8px rgba(0,0,0,.6);cursor:grab"></div>`,
  });
}

export default function TasksLayer({ store }: { store: EditorStore }) {
  const map = useMap();
  const t = store.tasks;
  const groupRef = useRef<L.LayerGroup | null>(null);
  const [view, setView] = useState(0); // bumped on pan/zoom to recompute what's visible

  useEffect(() => {
    const bump = () => setView((v) => v + 1);
    map.on("moveend zoomend", bump);
    return () => void map.off("moveend zoomend", bump);
  }, [map]);

  useEffect(() => {
    const g = L.layerGroup().addTo(map);
    groupRef.current = g;
    return () => void g.remove();
  }, [map]);

  const { open, typeById, items, byId, selectedId, setSelectedId, move, setBounds } = t;

  // Tell the store what's in view so it can load those rows from the table (zoomed out = nothing).
  useEffect(() => {
    if (!open) return;
    if (map.getZoom() < MIN_ZOOM) {
      setBounds(null);
      return;
    }
    const b = map.getBounds().pad(0.1);
    setBounds({ minLat: b.getSouth(), minLon: b.getWest(), maxLat: b.getNorth(), maxLon: b.getEast() });
  }, [map, view, open, setBounds]);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.clearLayers();
    if (!open) return;
    const color = (type: string) => typeById.get(type)?.color ?? "#888";
    const label = (type: string) => typeById.get(type)?.label ?? type.replace(/_/g, " ");

    for (const it of items) {
      if (it.id === selectedId) continue;
      const movedAway = it.lat !== it.sourceLat || it.lon !== it.sourceLon;
      const dot = L.circleMarker([it.lat, it.lon], {
        radius: movedAway ? 6 : 5,
        color: movedAway ? "#fff" : "#000",
        weight: movedAway ? 2 : 1,
        fillColor: color(it.type),
        fillOpacity: it.status === "pending" ? 0.95 : 0.4,
        bubblingMouseEvents: false,
      });
      dot.bindTooltip(label(it.type) + (it.note ? " — " + it.note.replace(/--g\d+$/, "").split("--").pop() : ""), { direction: "top" });
      dot.on("click", () => setSelectedId(it.id));
      dot.addTo(g);
    }

    // The selected task: draggable (while pending), with a dashed line back to where it started.
    const sel = selectedId != null ? byId.get(selectedId) : null;
    if (sel) {
      const col = color(sel.type);
      const line = L.polyline([[sel.sourceLat, sel.sourceLon], [sel.lat, sel.lon]], { color: col, weight: 2, dashArray: "4 4", interactive: false });
      line.addTo(g);
      L.circleMarker([sel.sourceLat, sel.sourceLon], { radius: 3, color: "#000", weight: 1, fillColor: "#fff", fillOpacity: 1, interactive: false }).addTo(g);
      const mk = L.marker([sel.lat, sel.lon], { draggable: sel.status === "pending", icon: pinIcon(col), zIndexOffset: 5000, keyboard: false });
      mk.on("drag", () => {
        const p = mk.getLatLng();
        line.setLatLngs([[sel.sourceLat, sel.sourceLon], [p.lat, p.lng]]);
      });
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        move(sel.id, +p.lat.toFixed(7), +p.lng.toFixed(7));
      });
      mk.addTo(g);
    }
    // `view` is intentionally not a dependency here: pan/zoom reloads `items` via setBounds.
  }, [map, open, typeById, items, selectedId, byId, setSelectedId, move]);

  return null;
}
