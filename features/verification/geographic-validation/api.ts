import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  AdminLevelChainItem,
  GeographicValidationParams,
  GeographicValidationResponse,
} from "./types";

// Real endpoint: PlaceForge's data-quality module, filtered to the two
// categories that are actually geographic in nature. There's no combined
// "geo anomaly" endpoint — GEOMETRY and HIERARCHY are fetched separately
// and merged client-side.
// GET /api/v1/flags?category=GEOMETRY | GET /api/v1/flags?category=HIERARCHY
export const FLAGS_ENDPOINT = `${API_BASE_URL}/api/v1/flags`;
export const ADMIN_LEVELS_ENDPOINT = `${API_BASE_URL}/api/v1/addresses`;

const emptyResponse: GeographicValidationResponse = { data: [], total: 0, limit: 50, offset: 0 };

export async function fetchGeographicValidation(
  params?: GeographicValidationParams,
): Promise<GeographicValidationResponse> {
  const pageSize = params?.pageSize ?? 50;
  const offset = params?.page ? (params.page - 1) * pageSize : 0;

  try {
    const [geometry, hierarchy] = await Promise.all(
      (["GEOMETRY", "HIERARCHY"] as const).map(async (category) => {
        const query = new URLSearchParams({ category, limit: String(pageSize), offset: String(offset) });
        const res = await apiFetch(`${FLAGS_ENDPOINT}?${query.toString()}`);
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<GeographicValidationResponse>;
      }),
    );
    return {
      data: [...geometry.data, ...hierarchy.data],
      total: geometry.total + hierarchy.total,
      limit: pageSize,
      offset,
    };
  } catch (cause) {
    console.warn("Falling back to empty data for fetchGeographicValidation:", cause);
    return emptyResponse;
  }
}

export async function fetchAdminLevelChain(addressId: string): Promise<AdminLevelChainItem[]> {
  try {
    const res = await apiFetch(`${ADMIN_LEVELS_ENDPOINT}/${addressId}/admin-levels`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body: { data: AdminLevelChainItem[] } = await res.json();
    return body.data;
  } catch (cause) {
    console.warn("fetchAdminLevelChain failed:", cause);
    return [];
  }
}
