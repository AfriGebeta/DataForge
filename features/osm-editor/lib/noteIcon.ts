// Map-note pin: a speech bubble, red while open, green once closed, with a
// thicker ring when selected. The dashed variant marks an unsaved draft
// (the spot you clicked in Add-note mode).

import L from "leaflet";

export function noteDivIcon(status: "open" | "closed" | "draft", selected: boolean): L.DivIcon {
  const fill = status === "closed" ? "#16a34a" : status === "draft" ? "#ffffff" : "#e11d48";
  const stroke = status === "draft" ? "#e11d48" : "#ffffff";
  const ring = selected ? '<circle cx="14" cy="13" r="14" fill="none" stroke="#38bdf8" stroke-width="2.5"/>' : "";
  const dash = status === "draft" ? ' stroke-dasharray="3 2"' : "";
  const glyph = status === "closed" ? '<path d="M9 13.2l3.2 3.2L19 9.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' : status === "draft" ? "" : '<circle cx="9.5" cy="12" r="1.5" fill="#fff"/><circle cx="14" cy="12" r="1.5" fill="#fff"/><circle cx="18.5" cy="12" r="1.5" fill="#fff"/>';
  return L.divIcon({
    className: "osm-editor-note",
    iconSize: [28, 34],
    iconAnchor: [14, 32], // the pin's tip sits on the note's coordinate
    html: `<svg width="28" height="34" viewBox="0 0 28 34" xmlns="http://www.w3.org/2000/svg">${ring}<path d="M14 2C7.4 2 3 6.4 3 12c0 4.1 2.4 7.3 6 9v8l5.2-6.4C20.6 22.5 25 18.1 25 12 25 6.4 20.6 2 14 2z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"${dash}/>${glyph}</svg>`,
  });
}
