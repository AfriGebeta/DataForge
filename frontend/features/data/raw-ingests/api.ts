import type { RawIngestsParams, RawIngestsResponse, RawIngestItem } from './types';


export const API_ENDPOINT = 'http://localhost:8080/api/data/ingests' as const;


const fakeRawIngests: RawIngestItem[] = [
  {
    id: "a4e2b91f-0000-0000-0000-000000000001",
    channel: "TELEGRAM_BOT",
    source_type: "POI",
    status: "DONE",
    received_at: new Date(Date.now() - 3000).toISOString(),
    created_at: new Date(Date.now() - 3000).toISOString(),
    updated_at: new Date(Date.now() - 3000).toISOString(),
    retry_count: 0,
  },
  {
    id: "b7c1a33a-0000-0000-0000-000000000002",
    channel: "TELEGRAM_BOT",
    source_type: "POI",
    status: "PARSING",
    received_at: new Date(Date.now() - 12000).toISOString(),
    created_at: new Date(Date.now() - 12000).toISOString(),
    updated_at: new Date(Date.now() - 12000).toISOString(),
    retry_count: 0,
  },
  {
    id: "c9d4b77b-0000-0000-0000-000000000003",
    channel: "REST_API",
    source_type: "ROAD",
    status: "FAILED",
    received_at: new Date(Date.now() - 60000).toISOString(),
    created_at: new Date(Date.now() - 60000).toISOString(),
    updated_at: new Date(Date.now() - 60000).toISOString(),
    retry_count: 2,
  },
  {
    id: "d0e5c12c-0000-0000-0000-000000000004",
    channel: "TELEGRAM_BOT",
    source_type: "POI",
    status: "DUPLICATE",
    received_at: new Date(Date.now() - 180000).toISOString(),
    created_at: new Date(Date.now() - 180000).toISOString(),
    updated_at: new Date(Date.now() - 180000).toISOString(),
    retry_count: 0,
  },
  {
    id: "e1f6d45d-0000-0000-0000-000000000005",
    channel: "BATCH_IMPORT",
    source_type: "NATURAL",
    status: "DONE",
    received_at: new Date(Date.now() - 28800000).toISOString(),
    created_at: new Date(Date.now() - 28800000).toISOString(),
    updated_at: new Date(Date.now() - 28800000).toISOString(),
    retry_count: 0,
  },
];



export async function fetchRawIngests(
  params?: RawIngestsParams,
): Promise<RawIngestsResponse> {
  try {
    const searchParams = new URLSearchParams();

    if (params) {
      if (params.page !== undefined) searchParams.append('page', String(params.page));
      if (params.limit !== undefined) searchParams.append('limit', String(params.limit));
      if (params.status) searchParams.append('status', params.status);
      if (params.channel) searchParams.append('channel', params.channel);
      if (params.workerId) searchParams.append('workerId', params.workerId);
    }

    const query = searchParams.toString();
    const url = query ? `${API_ENDPOINT}?${query}` : API_ENDPOINT;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

    return res.json();
  } catch (cause) {
    console.warn('Falling back to mock data for fetchRawIngests:', cause);

    let filtered = [...fakeRawIngests];

    if (params?.status) filtered = filtered.filter((d) => d.status === params.status);
    if (params?.channel) filtered = filtered.filter((d) => d.channel === params.channel);

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length
    };
  }
}

