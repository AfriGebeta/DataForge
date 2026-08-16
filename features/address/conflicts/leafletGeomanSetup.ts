// Duplicate of features/address/nodes/leafletGeomanSetup.ts - see that
// file's comment for why this needs to run before "@geoman-io/leaflet-geoman-free"
// is imported (it references the bare global `L`, which a real ES module
// bundle doesn't provide on its own).
import L from "leaflet";

if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}
