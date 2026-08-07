import type { CursorsParams, CursorsResponse, IngestCursor } from './types';

export const API_ENDPOINT = 'http://localhost:8080/api/channels';

const fakeCursors: IngestCursor[] = [
  {
    id: "1",
    channel_config_id: "@addis_poi_reports",
    cursor_key: "telegram_update_id",
    cursor_value: "99341",
    captured_at: new Date(Date.now() - 2000).toISOString(),
  },
  {
    id: "2",
    channel_config_id: "@addis_real_estate",
    cursor_key: "telegram_update_id",
    cursor_value: "54112",
    captured_at: new Date(Date.now() - 14 * 60000).toISOString(),
  },
  {
    id: "3",
    channel_config_id: "REST ingest",
    cursor_key: "last_event_id",
    cursor_value: "EVT-8821",
    captured_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "4",
    channel_config_id: "Nightly batch",
    cursor_key: "scrape_page",
    cursor_value: "142",
    captured_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

export async function fetchCursors(
  params?: CursorsParams,
): Promise<CursorsResponse> {
  try {
    if (!params?.channel_config_id) {
        throw new Error("channel_config_id is required");
    }
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));

    const query = searchParams.toString();
    const url = `${API_ENDPOINT}/${params.channel_config_id}/cursors/${query ? `?${query}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    
    return res.json();
  } catch (cause) {
    console.warn('Falling back to mock data for fetchCursors:', cause);
    
    let filtered = [...fakeCursors];
    if (params?.channel_config_id) {
        filtered = filtered.filter((c) => c.channel_config_id === params.channel_config_id);
    }
    
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;

    return { 
      items: filtered.slice(offset, offset + limit), 
      total: filtered.length 
    };
  }
}
