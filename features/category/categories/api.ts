import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type {
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`${API_ENDPOINT}${path}`, init);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      if (
        errorBody &&
        typeof errorBody === "object" &&
        typeof (errorBody as { message?: unknown }).message === "string"
      ) {
        message = (errorBody as { message: string }).message;
      }
    } catch {
      // ignore non-JSON error bodies
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * GET /api/v1/categories?limit=&offset=
 * `limit`/`offset` paginate over top-level (root) categories; each root's
 * full nested subtree is always included alongside it so hierarchy display
 * stays correct regardless of page size.
 */
export async function fetchCategories(
  limit = 10,
  offset = 0,
): Promise<CategoryListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  try {
    return await requestJson<CategoryListResponse>(`?${params.toString()}`);
  } catch (cause) {
    console.warn("fetchCategories failed:", cause);
    return { data: [], total: 0, limit, offset };
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
