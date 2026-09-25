// Point rendering as a teardrop pin — map-editor-full-spec.md §B3/§3.6:
// "points are not colored per category on the map itself — the only
// per-category color lives in the icon glyph inset into the pin." Pin
// body stays neutral (white fill, #444 stroke); `iconGlyphHtml` (wired
// up in lib/presets.ts, phase 8) is what carries category color.

import L from "leaflet";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Preset } from "./presets";

const PIN_PATH = "M8.5 0C3.8 0 0 3.8 0 8.5c0 6 8.5 15.5 8.5 15.5S17 14.5 17 8.5C17 3.8 13.2 0 8.5 0z";

// Renders a preset's lucide icon (a React component — this repo's only
// icon library, standing in for the maki/temaki sets the spec names,
// see lib/presets.ts) to an inline SVG string for use inside a Leaflet
// DivIcon, which only accepts HTML, not JSX.
export function presetIconHtml(preset: Preset): string {
  return renderToStaticMarkup(createElement(preset.icon, { size: 11, color: preset.color, strokeWidth: 2.5 }));
}

export interface PinOptions {
  stroke?: string;
  fill?: string;
  iconGlyphHtml?: string;
}

export function pinDivIcon({ stroke = "#444", fill = "#fff", iconGlyphHtml = "" }: PinOptions = {}): L.DivIcon {
  const html = `<span style="position:relative;display:block;width:17px;height:24px;">
    <svg width="17" height="24" viewBox="0 0 17 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <path d="${PIN_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    </svg>
    ${iconGlyphHtml ? `<span style="position:absolute;top:1px;left:0;width:17px;height:11px;display:flex;align-items:center;justify-content:center;pointer-events:none;">${iconGlyphHtml}</span>` : ""}
  </span>`;
  return L.divIcon({ html, className: "osm-editor-pin", iconSize: [17, 24], iconAnchor: [8.5, 23] });
}

// A small filled circle matching the plain CircleMarker vertex style
// (§3.6: black fill / #666 ring, light-gray fill for junctions) — used
// only for the currently-selected vertex, swapped in for the normal
// CircleMarker specifically because CircleMarker has no drag support
// and a real `L.Marker` does (§C5 drag-to-move).
export function vertexDivIcon(radius: number, junction: boolean): L.DivIcon {
  const size = radius * 2 + 3;
  const c = size / 2;
  const html = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${c}" cy="${c}" r="${radius}" fill="${junction ? "#bbb" : "#000"}" stroke="#666" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({ html, className: "osm-editor-vertex", iconSize: [size, size], iconAnchor: [c, c] });
}

// Small triangular virtual marker for a way-segment midpoint (§C4) —
// "not a real graph node until interacted with."
export function midpointDivIcon(): L.DivIcon {
  const html = `<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <polygon points="5,1 9,9 1,9" fill="#eee" stroke="#444" stroke-width="1" opacity="0.85"/>
  </svg>`;
  return L.divIcon({ html, className: "osm-editor-midpoint", iconSize: [10, 10], iconAnchor: [5, 5] });
}
