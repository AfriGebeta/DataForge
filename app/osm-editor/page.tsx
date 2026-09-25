import { Suspense } from "react";
import OsmEditorPage from "@/features/osm-editor/OsmEditorPage";

export default function Page() {
  return (
    <Suspense>
      <OsmEditorPage />
    </Suspense>
  );
}
