import MergeReviewPage from "@/features/verification/merge-review/MergeReviewPage";

export default async function Page({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  return <MergeReviewPage placeId={Number(placeId)} />;
}
