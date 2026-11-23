import { Suspense } from "react";
import EditTasksPage from "@/features/osm-editor/tasks/EditTasksPage";

export default function Page() {
  return (
    <Suspense>
      <EditTasksPage />
    </Suspense>
  );
}
