import { Suspense } from "react";
import ChangesetHistoryPage from "@/features/osm-editor/history/ChangesetHistoryPage";

export default function Page() {
  return (
    <Suspense>
      <ChangesetHistoryPage />
    </Suspense>
  );
}
