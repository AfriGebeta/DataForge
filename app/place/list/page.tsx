import { Suspense } from "react";
import PlaceListPage from "@/features/place/places/sections/place-list/PlaceListPage";
export default function Page() {
  return (
    <Suspense>
      <PlaceListPage />
    </Suspense>
  );
}
