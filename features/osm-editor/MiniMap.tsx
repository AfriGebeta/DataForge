"use client";

// Minimap (/) — iD's overview inset: the same imagery zoomed out five
// levels, a rectangle showing what the main map currently covers, and
// click-to-recenter. It only *follows* the main map (store.mapRef); all
// state stays with the main map.

import { useEffect, useState } from "react";
import { MapContainer, Rectangle, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type L from "leaflet";
import { API_BASE_URL } from "@/lib/api-config";
import { resolveImagery, resolveTileUrl } from "./lib/imagery";
import type { EditorStore } from "./useEditorStore";

const ZOOM_OFFSET = 5;

function Follow({ store }: { store: EditorStore }) {
  const mini = useMap();
  const { mapRef, focusOn } = store;
  const [viewport, setViewport] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    const main = mapRef.current;
    if (!main) return;
    const sync = () => {
      mini.setView(main.getCenter(), Math.max(0, main.getZoom() - ZOOM_OFFSET), { animate: false });
      setViewport(main.getBounds());
    };
    // Initial placement once the inset exists, then follow every move.
    sync();
    main.on("move", sync);
    return () => {
      main.off("move", sync);
    };
  }, [mini, mapRef]);

  useMapEvents({
    click(e) {
      focusOn(e.latlng.lat, e.latlng.lng, mapRef.current?.getZoom(), true);
    },
  });

  return viewport ? <Rectangle bounds={viewport} pathOptions={{ color: "#e11d48", weight: 1.5, fillOpacity: 0.08 }} interactive={false} /> : null;
}

export default function MiniMap({ store }: { store: EditorStore }) {
  const layer = resolveImagery(store.imagery.id, store.imagery.customUrl) ?? resolveImagery("osm", "")!;
  return (
    <div className="absolute bottom-14 left-3 z-[1000] h-36 w-48 overflow-hidden rounded-md border border-[color:var(--border)] shadow-lg">
      <MapContainer
        center={[9.03, 38.74]}
        zoom={9}
        style={{ height: "100%", width: "100%", cursor: "pointer" }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer key={layer.id} url={resolveTileUrl(layer, API_BASE_URL)} subdomains={layer.subdomains ?? "abc"} maxZoom={layer.maxZoom} />
        <Follow store={store} />
      </MapContainer>
    </div>
  );
}
