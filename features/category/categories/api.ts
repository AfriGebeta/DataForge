import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  BulkDeleteCategoriesRequestBody,
  BulkUpdateCategoriesRequestBody,
  Category,
  CategoryFormValues,
  CategoryLanguage,
  CategoryListResponse,
  CategoryNameMap,
  CategoryTreeNode,
  CreateCategoryRequestBody,
  UpdateCategoryRequestBody,
} from "./types";

/** Real endpoint: PlaceForge's category module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/categories`;

const JSON_CONTENT_TYPE_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * Walks the nested wire tree and yields the flat internal `Category`
 * shape (adjacency-list with `parentId`), preserving pre-order traversal
 * so the UI can render indented rows without extra sorting.
 */
export function flattenCategoryTree(
  nodes: CategoryTreeNode[] | undefined,
  parentId: string | null = null,
): Category[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const flat: Category[] = [];

  nodes.forEach((node) => {
    flat.push({
      id: node.id,
      slug: node.slug,
      parentId,
      icon: "",
      name: node.name,
      deletedAt: null,
      needsReview: node.needsReview,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    });

    if (node.children && node.children.length > 0) {
      flat.push(...flattenCategoryTree(node.children, node.id));
    }
  });

  return flat;
}

export function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLocalizedName(
  category: Category,
  language: CategoryLanguage,
): string {
  return (
    category.name[language] ??
    category.name.en ??
    category.name.am ??
    category.slug ??
    "Unnamed category"
  );
}

export function makeInitialFormValues(category?: Category): CategoryFormValues {
  return {
    nameEn: category?.name.en ?? "",
    nameAm: category?.name.am ?? "",
    slug: category?.slug ?? "",
    parentId: category?.parentId ?? "",
    icon: category?.icon ?? "",
  };
}

function buildNameMap(values: CategoryFormValues): CategoryNameMap {
  const name: CategoryNameMap = {};

  if (values.nameEn.trim()) {
    name.en = values.nameEn.trim();
  }

  if (values.nameAm.trim()) {
    name.am = values.nameAm.trim();
  }

  return name;
}

/** Builds the exact POST /api/v1/categories request body. */
export function buildCreateRequestBody(
  values: CategoryFormValues,
): CreateCategoryRequestBody {
  const body: CreateCategoryRequestBody = {
    name: buildNameMap(values),
    slug: values.slug.trim(),
  };

  const icon = values.icon.trim();
  if (icon) {
    body.icon = icon;
  }

  if (values.parentId) {
    body.parentId = values.parentId;
  }

  return body;
}

/**
 * Builds the exact PUT /api/v1/categories/{id} request body.
 * Only fields that changed from `original` are included, so untouched
 * fields are left alone by the API. Clearing the icon is supported by
 * explicitly sending an empty string when it changed to blank.
 */
export function buildUpdateRequestBody(
  values: CategoryFormValues,
  original: Category,
): UpdateCategoryRequestBody {
  const body: UpdateCategoryRequestBody = {};

  const nextName = buildNameMap(values);
  if (JSON.stringify(nextName) !== JSON.stringify(original.name ?? {})) {
    body.name = nextName;
  }

  const nextSlug = values.slug.trim();
  if (nextSlug !== original.slug) {
    body.slug = nextSlug;
  }

  const nextIcon = values.icon.trim();
  if (nextIcon !== (original.icon ?? "")) {
    body.icon = nextIcon;
  }

  const nextParentId = values.parentId || null;
  if (nextParentId !== (original.parentId ?? null)) {
    body.parentId = nextParentId;
  }

  return body;
}

/** Thrown by requestJson on a non-OK response; carries the real HTTP status. */
export class CategoryApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_ENDPOINT}${path}`, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      if (
        errorBody &&
        typeof errorBody === "object" &&
        typeof (errorBody as { error?: unknown }).error === "string"
      ) {
        message = (errorBody as { error: string }).error;
      }
    } catch {
      // ignore non-JSON error bodies
    }

    throw new CategoryApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * GET /api/v1/categories?limit=&offset=&search=
 * Without `search`: `limit`/`offset` paginate over top-level (root)
 * categories; each root's full nested subtree is always included alongside
 * it so hierarchy display stays correct regardless of page size.
 * With `search`: matches slug/name at any depth in the tree (not just
 * roots) and returns a flat list — see `mapSearchResults`, not
 * `flattenCategoryTree`, for turning the response into `Category[]`.
 */
export async function fetchCategories(
  limit = 10,
  offset = 0,
  search = "",
): Promise<CategoryListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }

  try {
    return await requestJson<CategoryListResponse>(`?${params.toString()}`);
  } catch (cause) {
    console.warn("fetchCategories failed:", cause);
    return { data: [], total: 0, limit, offset };
  }
}

/**
 * Maps a flat search response (no `children`, real `parentId` per node)
 * into the internal `Category[]` shape — the sibling of
 * `flattenCategoryTree` for the non-hierarchical case.
 */
export function mapSearchResults(nodes: CategoryTreeNode[]): Category[] {
  return nodes.map((node) => ({
    id: node.id,
    slug: node.slug,
    parentId: node.parentId ?? null,
    icon: "",
    name: node.name,
    deletedAt: null,
    needsReview: node.needsReview,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }));
}

/**
 * GET /api/v1/categories/{slug} — looks up a single category by its slug
 * (the same endpoint also accepts a UUID id). Returns null on a 404 so
 * callers can distinguish "doesn't exist" from a real network/server error.
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await requestJson<Category>(`/${encodeURIComponent(slug)}`);
  } catch (cause) {
    if (!(cause instanceof CategoryApiError && cause.status === 404)) {
      console.warn("fetchCategoryBySlug failed:", cause);
    }
    return null;
  }
}

/**
 * GET /api/v1/categories?flat=true&needsReview=true — every category
 * (root or nested) still flagged `needsReview`, regardless of pagination,
 * for the "categories awaiting review" count/list.
 */
export async function fetchCategoriesNeedingReview(): Promise<Category[]> {
  try {
    const response = await requestJson<CategoryListResponse>(
      "?flat=true&needsReview=true&limit=250&offset=0",
    );
    return response.data.map((node) => ({
      id: node.id,
      slug: node.slug,
      parentId: null,
      icon: "",
      name: node.name,
      needsReview: node.needsReview,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      deletedAt: null,
    }));
  } catch (cause) {
    console.warn("fetchCategoriesNeedingReview failed:", cause);
    return [];
  }
}

/**
 * Fetches all active categories in hierarchy order for parent dropdowns.
 * The wire response is a nested tree; we flatten it into pre-ordered
 * `Category[]` so existing consumers can keep using `parentId` traversal.
 */
export async function fetchParentCategories(): Promise<Category[]> {
  try {
    const response = await requestJson<CategoryListResponse>(
      "?limit=250&offset=0",
    );
    return flattenCategoryTree(response.data);
  } catch (cause) {
    console.warn("fetchParentCategories failed:", cause);
    return [];
  }
}

/** @deprecated Use fetchParentCategories for deep-tree parent selection. */
export async function fetchRootCategories(): Promise<Category[]> {
  return fetchParentCategories();
}

/** POST /api/v1/categories. Throws on failure so the caller can show the real error. */
export async function createCategory(
  values: CategoryFormValues,
): Promise<Category> {
  const body = buildCreateRequestBody(values);

  return requestJson<Category>("", {
    method: "POST",
    headers: JSON_CONTENT_TYPE_HEADERS,
    body: JSON.stringify(body),
  });
}

/**
 * PUT /api/v1/categories/{id}
 * `original` is the category before edits, used to build a partial diff so
 * only changed fields are sent. Pass an emptied icon field to clear it.
 * Throws on failure so the caller can show the real error.
 */
export async function updateCategory(
  id: string,
  values: CategoryFormValues,
  original: Category,
): Promise<Category> {
  const body = buildUpdateRequestBody(values, original);

  return requestJson<Category>(`/${id}`, {
    method: "PUT",
    headers: JSON_CONTENT_TYPE_HEADERS,
    body: JSON.stringify(body),
  });
}

/**
 * PUT /api/v1/categories/{id} with just `{needsReview: false}` — clears the
 * auto-created review flag without touching name/slug/icon/parent, for the
 * "looks correct, dismiss the flag" action distinct from a full edit.
 * Throws on failure so the caller can show the real error.
 */
export async function markCategoryReviewed(id: string): Promise<Category> {
  const body: UpdateCategoryRequestBody = { needsReview: false };

  return requestJson<Category>(`/${id}`, {
    method: "PUT",
    headers: JSON_CONTENT_TYPE_HEADERS,
    body: JSON.stringify(body),
  });
}

/** DELETE /api/v1/categories/{id}. Throws on failure so the caller can show the real error. */
export async function deleteCategory(id: string): Promise<void> {
  await requestJson<void>(`/${id}`, { method: "DELETE" });
}

/**
 * DELETE /api/v1/categories/bulk. Each deleted category's children/places
 * just fall back to root/uncategorized server-side (ON DELETE SET NULL) — no
 * confirmation-of-cascade needed here. Throws on failure.
 */
export async function bulkDeleteCategories(ids: string[]): Promise<void> {
  const body: BulkDeleteCategoriesRequestBody = { ids };
  await requestJson<void>("/bulk", {
    method: "DELETE",
    headers: JSON_CONTENT_TYPE_HEADERS,
    body: JSON.stringify(body),
  });
}

/**
 * PATCH /api/v1/categories/bulk. `patch.parentId`/`patch.needsReview` follow
 * the single-category PUT's omitted-vs-value convention — only include a key
 * here if that field should actually change for every selected category.
 * Throws on failure (including the backend's "at least one field required"
 * and "cannot be moved under itself" 400s).
 */
export async function bulkUpdateCategories(
  ids: string[],
  patch: { parentId?: string | null; needsReview?: boolean },
): Promise<void> {
  const body: BulkUpdateCategoriesRequestBody = { ids };
  if (patch.parentId !== undefined) {
    body.parentId = patch.parentId;
  }
  if (patch.needsReview !== undefined) {
    body.needsReview = patch.needsReview;
  }

  await requestJson<void>("/bulk", {
    method: "PATCH",
    headers: JSON_CONTENT_TYPE_HEADERS,
    body: JSON.stringify(body),
  });
}
