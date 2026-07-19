export type MergeStrategy = "MANUAL" | "AUTO_DISTANCE" | "AUTO_NAME_MATCH" | "AUTO_OVERLAP";

export type MergeRecord = {
  id: string;
  winner_id: string;
  loser_id: string;
  strategy: MergeStrategy;
  reason: string;
  merged_by: string;
  merged_at: string;
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
};

export type MergeRecordsResponse = {
  data: MergeRecord[];
  total: number;
};