import { fetchChannels } from "../channels/api";
import type { ChannelConfig } from "../channels/types";
import { fetchIngestStats } from "../raw-ingests/api";
import type { SourceHealthSummary } from "./types";

/**
 * Composes the Data Sources dashboard from two real ingest-module endpoints
 * rather than a dedicated one — see types.ts for why.
 */
export async function fetchDataSourcesOverview(): Promise<{
  channels: ChannelConfig[];
  summary: SourceHealthSummary;
}> {
  const [channelsRes, stats] = await Promise.all([fetchChannels(), fetchIngestStats()]);

  const totalIngests = Object.values(stats.counts).reduce((a, b) => a + b, 0);
  const doneCount = stats.counts.DONE ?? 0;
  const failedCount = stats.counts.FAILED ?? 0;
  const successRate = totalIngests > 0 ? Math.round((doneCount / totalIngests) * 100) : 0;

  return {
    channels: channelsRes.data,
    summary: { totalIngests, doneCount, failedCount, successRate },
  };
}
