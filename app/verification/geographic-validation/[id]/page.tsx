import PlaceDetailPage from "@/features/verification/shared/PlaceDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PlaceDetailPage
      placeId={Number(id)}
      mode="geographic"
      backHref="/verification/geographic-validation"
      backLabel="Geographic Validation"
    />
  );
}
