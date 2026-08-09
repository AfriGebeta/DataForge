import PlaceDetailPage from "@/features/verification/shared/PlaceDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PlaceDetailPage
      placeId={Number(id)}
      mode="queue"
      backHref="/verification/queue"
      backLabel="Verification Queue"
    />
  );
}
