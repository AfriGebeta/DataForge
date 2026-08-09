/**
 * Domain types for merge-review — ported from the standalone reviewer tool
 * at PlaceForge/scripts/merge_review.html. Mirrors PlaceForge's data-quality
 * module (`MergeRecordResponse`, snake_case JSON) plus the place module's
 * `PlaceResponse` (camelCase JSON) for the winner/loser summary cards.
 */

export type MergeStrategy = "MANUAL" | "AUTO_DISTANCE" | "AUTO_NAME_MATCH" | "AUTO_OVERLAP";
export type MergeStatus = "PENDING" | "APPLIED" | "REJECTED";

export type MergeRecord = {
  id: string;
  winner_id: number;
  loser_id: number;
  strategy: MergeStrategy;
  status: MergeStatus;
  merge_reason: string;
  merged_by?: string;
  field_resolution?: unknown;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  merged_at?: string;

  winner_name?: string;
  loser_name?: string;
  winner_ai_duplicate_score?: number;
  loser_ai_duplicate_score?: number;
};

export type FieldChoiceSource = "winner" | "loser" | "custom";
export type FieldChoice = { source?: FieldChoiceSource; value?: unknown };

export type MergeFieldResolution = {
  place?: Record<string, FieldChoice>;
  address?: "winner" | "loser";
  attributes?: Record<string, FieldChoice>;
  names?: Record<string, FieldChoice>;
};

export type PlaceFieldDiff = { winner: unknown; loser: unknown };

export type AttributeRow = { key: string; value: unknown };
export type AttributeConflict = { key: string; winner_value: unknown; loser_value: unknown };
export type NameRow = { language_code: string; name: string; is_primary: boolean };
export type NameConflict = { language_code: string; winner_name: string; loser_name: string };
export type ContactRow = { type: string; value: string };

export type MergeDiff = {
  place: Record<string, PlaceFieldDiff>;
  address?: { winner: unknown; loser: unknown; same: boolean };
  attributes: { winner_only: AttributeRow[]; loser_only: AttributeRow[]; conflicts: AttributeConflict[] };
  names: { winner_only: NameRow[]; loser_only: NameRow[]; conflicts: NameConflict[] };
  contacts: { winner_only: ContactRow[]; loser_only: ContactRow[] };
};

// Lean place summary for the winner/loser order-banner cards — mirrors
// PlaceForge's place module (camelCase JSON), just the counts/flags the
// original merge_review.html shows. Note: this API has no rating/aggregate
// endpoint, so unlike the original HTML tool, ratings are not shown here.
// PlaceResponse marks contacts/attributes/images/openingHours `omitempty` in
// Go — an empty place omits the key entirely rather than sending `[]`, so
// these come back `undefined`, not `[]`, when there's nothing to list.
export type PlaceSummary = {
  id: number;
  isVisible: boolean;
  reviewStatus: string;
  names: { name: string; isPrimary: boolean }[];
  contacts?: unknown[];
  attributes?: unknown[];
  images?: unknown[];
};
