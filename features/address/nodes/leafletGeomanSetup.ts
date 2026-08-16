// @geoman-io/leaflet-geoman-free's bundle (dist/leaflet-geoman.js) is a
// plain self-invoking script that references the bare identifier `L`
// throughout (`L.Map.addInitHook(...)`, `L.PM.initialize()`, etc.) without
// ever importing Leaflet itself - it was built assuming Leaflet is already
// a global, the classic "loaded via <script src="leaflet.js">" plugin
// pattern. Bundled as a real ES module, that bare `L` has nothing to
// resolve to and throws `ReferenceError: L is not defined` the moment the
// module evaluates.
//
// Fix: import Leaflet here and stash it on `window.L` *before* anything
// imports the geoman side-effect module. ES module imports evaluate once,
// depth-first, in the order they're first encountered - as long as every
// call site imports this setup module ahead of
// "@geoman-io/leaflet-geoman-free" itself, `window.L` is guaranteed to
// exist by the time geoman's top-level code runs.
import L from "leaflet";

if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}
