/** Category metadata for the Verification sidebar group. */
export const categoryConfig = {
  title: "Verification",
  category: "verification",
} as const;

// MergeReviewPage redirects straight to /verification/queue the moment the
// last pending candidate for a place is resolved (see advanceAfterResolution
// in merge-review/MergeReviewPage.tsx) — that unmounts the page in the same
// tick its own success toast would have shown, so the confirmation is
// stashed here across the navigation and picked up once by
// VerificationQueuePage on mount instead of being silently lost.
export const VERIFICATION_QUEUE_TOAST_KEY = "verificationQueueToast";
