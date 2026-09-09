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

// Ordered snapshot of the exact filtered row list VerificationQueuePage was
// showing at the moment a row was opened (see goToPlace) — lets
// PlaceDetailPage/MergeReviewPage jump straight to the next place in that
// same filtered view once the current one is fully resolved (approved/
// rejected, or its last pending merge candidate applied/rejected), instead
// of always bouncing back to the queue for the reviewer to pick again by
// hand. See setQueueNav/nextQueueTarget below.
const VERIFICATION_QUEUE_NAV_KEY = "verificationQueueNav";

export type QueueNavEntry = { id: number; hasMerge: boolean };

export function setQueueNav(entries: QueueNavEntry[]): void {
  try {
    sessionStorage.setItem(VERIFICATION_QUEUE_NAV_KEY, JSON.stringify(entries));
  } catch (cause) {
    console.warn("Failed to persist verification queue nav list:", cause);
  }
}

// Returns the next place's target URL (merge-review or plain detail,
// mirroring goToPlace's own routing rule) and advances the stored list past
// currentId — or null if there's no stored list, currentId isn't in it, or
// it was the last entry, in which case the caller should fall back to
// /verification/queue.
export function nextQueueTarget(currentId: number): string | null {
  try {
    const raw = sessionStorage.getItem(VERIFICATION_QUEUE_NAV_KEY);
    if (!raw) return null;
    const nav = JSON.parse(raw) as QueueNavEntry[];
    const idx = nav.findIndex((e) => e.id === currentId);
    if (idx === -1) return null;
    sessionStorage.setItem(
      VERIFICATION_QUEUE_NAV_KEY,
      JSON.stringify(nav.filter((e) => e.id !== currentId)),
    );
    const next = nav[idx + 1];
    if (!next) return null;
    return next.hasMerge ? `/verification/merge-review/${next.id}` : `/verification/queue/${next.id}`;
  } catch (cause) {
    console.warn("Failed to read verification queue nav list:", cause);
    return null;
  }
}
