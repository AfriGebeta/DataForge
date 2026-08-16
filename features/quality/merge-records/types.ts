export type MergeStrategy = "MANUAL" | "AUTO_DISTANCE" | "AUTO_NAME_MATCH" | "AUTO_OVERLAP";
export type MergeRecordStatus = "PENDING" | "APPLIED" | "REJECTED";

export type MergeRecord = {
  id: string;
  winner_id: string;
  winner_name: string | null;
  winner_ai_duplicate_score: number | null;
  loser_id: string;
  loser_name: string | null;
  loser_ai_duplicate_score: number | null;
  strategy: MergeStrategy;
  status: MergeRecordStatus;
  reason: string;
  merged_by: string | null;
  merged_at: string | null;
};

export type CreateMergeRecordRequest = {
  winner_id: string;
  loser_id: string;
  strategy: MergeStrategy;
  reason: string;
  merged_by: string;
};

export type MergeRecordsParams = {
  page?: number;
  pageSize?: number;
  strategy?: MergeStrategy;
  status?: MergeRecordStatus;
  limit?: number;
};

export type MergeRecordsResponse = {
  data: MergeRecord[];
  total: number;
};