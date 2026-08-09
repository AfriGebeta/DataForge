export type MergeStrategy = "MANUAL" | "AUTO_DISTANCE" | "AUTO_NAME_MATCH" | "AUTO_OVERLAP";
export type MergeRecordStatus = "PENDING" | "APPLIED" | "REJECTED";

export type MergeRecord = {
  id: string;
  winner_id: string;
  loser_id: string;
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
};

export type MergeRecordsResponse = {
  data: MergeRecord[];
  total: number;
};