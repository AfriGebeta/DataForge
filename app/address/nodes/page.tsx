import { Suspense } from "react";
import AddressNodesPage from "@/features/address/nodes/AddressNodesPage";
export default function Page() {
  return (
    <Suspense>
      <AddressNodesPage />
    </Suspense>
  );
}
