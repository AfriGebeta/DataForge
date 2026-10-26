// Background imagery catalog — the equivalent of iD's Background pane.
// Only keyless, openly-usable tile sources are listed (each verified to
// return real tiles, not a placeholder — CARTO's basemaps, for one, now
// answer 200 with an "API key required" watermark, so they were removed).
// Satellite/aerial providers have their own terms, so those go through
// the "Custom" slot where the operator pastes a URL they're licensed to use.

export interface ImageryLayer {
  id: string;
  name: string;
  description: string;
  url: string; // XYZ template with {z}/{x}/{y} and optional {s}/{r}
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  // Served by PlaceForge's tile proxy (needs GOOGLE_MAPS_API_KEY server-side).
  google?: boolean;
}

export const IMAGERY: ImageryLayer[] = [
  {
    id: "osm",
    name: "OpenStreetMap",
    description: "Standard OSM map style",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: "abc",
  },
  {
    id: "esri-satellite",
    name: "Esri World Imagery",
    description: "Satellite / aerial photos (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    maxZoom: 19,
  },
  {
    id: "hot",
    name: "Humanitarian OSM",
    description: "HOT style — clear roads and buildings, good for mapping",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
    subdomains: "abc",
  },
  {
    id: "topo",
    name: "OpenTopoMap",
    description: "Terrain contours and relief",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: "abc",
  },
  {
    id: "cyclosm",
    name: "CyclOSM",
    description: "Cycling-oriented style — shows surfaces, paths and tracks clearly",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases">CyclOSM</a> | Map data &copy; OpenStreetMap contributors',
    maxZoom: 20,
    subdomains: "abc",
  },
  {
    id: "osm-de",
    name: "OpenStreetMap Germany",
    description: "German-style rendering, labels in the local language",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
];

// Google imagery goes through PlaceForge (GET /osm/tiles/google/…), which
// talks to Google's official Map Tiles API with the operator's own key.
// `url` here is a marker; resolveTileUrl() builds the real one at render time
// because it needs the signed-in user's token.
export const GOOGLE_IMAGERY: ImageryLayer[] = [
  { id: "google-satellite", name: "Google Satellite", description: "Aerial imagery (via your Google Maps key)", url: "google:satellite", attribution: "Imagery &copy; Google", maxZoom: 21, google: true },
  { id: "google-roadmap", name: "Google Roads", description: "Google's road map", url: "google:roadmap", attribution: "Map data &copy; Google", maxZoom: 21, google: true },
  { id: "google-roadmask", name: "Road mask", description: "Roads in white on black — the input the Auto-trace tool reads", url: "google:roadmask", attribution: "Map data &copy; Google", maxZoom: 21, google: true },
];

export const NO_IMAGERY_ID = "none";
export const CUSTOM_IMAGERY_ID = "custom";

// A custom template must be http(s) and contain the three XYZ tokens, or
// the tile layer would silently request garbage.
export function validCustomTemplate(url: string): boolean {
  return /^https?:\/\//i.test(url) && url.includes("{z}") && url.includes("{x}") && url.includes("{y}");
}

export function resolveImagery(id: string, customUrl: string): ImageryLayer | null {
  if (id === NO_IMAGERY_ID) return null;
  if (id === CUSTOM_IMAGERY_ID) {
    return validCustomTemplate(customUrl)
      ? { id, name: "Custom", description: "", url: customUrl, attribution: "Custom imagery", maxZoom: 22 }
      : IMAGERY[0];
  }
  return IMAGERY.find((l) => l.id === id) ?? GOOGLE_IMAGERY.find((l) => l.id === id) ?? IMAGERY[0];
}

// Meters-to-pixels at a latitude/zoom, so a ground-meter offset stays the
// same ground distance as the user zooms (Web-Mercator, 256px tiles).
export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

// The URL Leaflet should actually request. Google layers need the admin JWT
// in `?token=` because a tile <img> can't send an Authorization header.
export function resolveTileUrl(layer: ImageryLayer, apiBase: string): string {
  if (!layer.google) return layer.url;
  const name = layer.url.slice("google:".length);
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )gebeta_token=([^;]*)/) : null;
  const token = m ? decodeURIComponent(m[1]) : "";
  return `${apiBase}/api/v1/osm/tiles/google/${name}/{z}/{x}/{y}?token=${encodeURIComponent(token)}`;
}
