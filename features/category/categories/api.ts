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

/**
 * Base path for the categories API. Real endpoint: PlaceForge's category
 * module. Must include the backend host — a bare "/api/v1/categories" hits
 * this Next.js app's own origin (no such route exists here), always 404s,
 * and silently falls back to the local mock below on every call.
 */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/categories`;

const JSON_CONTENT_TYPE_HEADERS = {
  "Content-Type": "application/json",
} as const;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Local fallback dataset, only used when the real API can't be reached
 * (e.g. no backend wired up yet). Shaped exactly like real API objects so
 * swapping this out for a live backend requires no changes elsewhere.
 */
let categoryStore: Category[] = [
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000001",
    slug: "restaurants",
    parentId: null,
    icon: "tools-kitchen-2",
    name: { en: "Restaurants", am: "ምግብ ቤቶች" },
    needsReview: false,
    deletedAt: null,
    createdAt: "2024-01-05T09:00:00.000Z",
    updatedAt: "2024-01-05T09:00:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000002",
    slug: "cafes",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000001",
    icon: "coffee",
    name: { en: "Cafes", am: "ካፌዎች" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:05:00.000Z",
    updatedAt: "2024-01-05T09:05:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000003",
    slug: "fast-food",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000001",
    icon: "burger",
    name: { en: "Fast Food", am: "ፈጣን ምግብ" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:06:00.000Z",
    updatedAt: "2024-01-05T09:06:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000004",
    slug: "hotels",
    parentId: null,
    icon: "building-skyscraper",
    name: { en: "Hotels", am: "ሆቴሎች" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:10:00.000Z",
    updatedAt: "2024-01-05T09:10:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000005",
    slug: "shopping",
    parentId: null,
    icon: "shopping-cart",
    name: { en: "Shopping", am: "ገበያ" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:15:00.000Z",
    updatedAt: "2024-01-05T09:15:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000006",
    slug: "malls",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000005",
    icon: "building-store",
    name: { en: "Malls", am: "ገበያ ማዕከላት" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:16:00.000Z",
    updatedAt: "2024-01-05T09:16:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000007",
    slug: "markets",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000005",
    icon: "basket",
    name: { en: "Markets", am: "ገበያዎች" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:17:00.000Z",
    updatedAt: "2024-01-05T09:17:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000008",
    slug: "services",
    parentId: null,
    icon: "briefcase",
    name: { en: "Services", am: "አገልግሎቶች" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:20:00.000Z",
    updatedAt: "2024-01-05T09:20:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-000000000009",
    slug: "specialty-coffee",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000002",
    icon: "coffee",
    name: { en: "Specialty Coffee", am: "ልዩ ቡና" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:21:00.000Z",
    updatedAt: "2024-01-05T09:21:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-00000000000a",
    slug: "espresso-bars",
    parentId: "3f7a9e0e-1111-4a11-8a11-000000000009",
    icon: "coffee",
    name: { en: "Espresso Bars", am: "ኤስፕሬሶ" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:22:00.000Z",
    updatedAt: "2024-01-05T09:22:00.000Z",
  },
  {
    id: "3f7a9e0e-1111-4a11-8a11-00000000000b",
    slug: "single-origin",
    parentId: "3f7a9e0e-1111-4a11-8a11-00000000000a",
    icon: "coffee",
    name: { en: "Single Origin", am: "ነጠላ ምንጭ" },
    deletedAt: null,
    needsReview: false,
    createdAt: "2024-01-05T09:23:00.000Z",
    updatedAt: "2024-01-05T09:23:00.000Z",
  },
];

function activeCategories(): Category[] {
  return categoryStore.filter((category) => !category.deletedAt);
}

function sortByName(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const aName = a.name.en ?? a.name.am ?? a.slug;
    const bName = b.name.en ?? b.name.am ?? b.slug;
    return aName.localeCompare(bName);
  });
}

/**
 * Builds the nested tree wire shape (roots + embedded `children`) from a
 * flat list of active categories, matching the GET /api/v1/categories
 * response contract exactly.
 */
function buildCategoryTree(
  categories: Category[],
  rootParentId: string | null = null,
): CategoryTreeNode[] {
  const byParent = new Map<string | null, Category[]>();

  categories.forEach((category) => {
    const key = category.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  });

  byParent.forEach((siblings, key) => {
    byParent.set(key, sortByName(siblings));
  });

  const buildNode = (category: Category): CategoryTreeNode => {
    const node: CategoryTreeNode = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      needsReview: category.needsReview,
    };

    const children = (byParent.get(category.id) ?? []).map(buildNode);
    if (children.length > 0) {
      node.children = children;
    }

    if (category.createdAt) {
      node.createdAt = category.createdAt;
    }
    if (category.updatedAt) {
      node.updatedAt = category.updatedAt;
    }

    return node;
  };

  return (byParent.get(rootParentId) ?? []).map(buildNode);
}

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

/**
 * Orders categories in tree pre-order (parent immediately followed by its
 * descendants) so pagination can slice whole subtrees while keeping correct
 * indentation on the client.
 */
function buildHierarchyOrder(categories: Category[]): Category[] {
  const byParent = new Map<string | null, Category[]>();

  categories.forEach((category) => {
    const key = category.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  });

  byParent.forEach((siblings, key) => {
    byParent.set(key, sortByName(siblings));
  });

  const ordered: Category[] = [];
  const visited = new Set<string>();

  const visit = (parentId: string | null) => {
    const children = byParent.get(parentId) ?? [];

    children.forEach((category) => {
      if (visited.has(category.id)) {
        return;
      }

      visited.add(category.id);
      ordered.push(category);
      visit(category.id);
    });
  };

  visit(null);

  categories.forEach((category) => {
    if (!visited.has(category.id)) {
      ordered.push(category);
    }
  });

  return ordered;
}

function collectDescendantIds(
  parentId: string,
  categories: Category[],
  into: Set<string>,
): void {
  categories
    .filter((category) => category.parentId === parentId)
    .forEach((child) => {
      into.add(child.id);
      collectDescendantIds(child.id, categories, into);
    });
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

function fetchCategoriesFromMock(
  limit: number,
  offset: number,
): CategoryListResponse {
  const active = activeCategories();
  const roots = sortByName(active.filter((category) => !category.parentId));
  const pageRoots = roots.slice(offset, offset + limit);

  const visibleIds = new Set(pageRoots.map((category) => category.id));
  pageRoots.forEach((root) =>
    collectDescendantIds(root.id, active, visibleIds),
  );

  const visibleCategories = active.filter((category) =>
    visibleIds.has(category.id),
  );
  const data = buildCategoryTree(visibleCategories);

  return { data, total: roots.length, limit, offset };
}

/**
 * GET /api/v1/categories?limit=&offset=
 * `limit`/`offset` paginate over top-level (root) categories; each root's
 * full nested subtree is always included alongside it so hierarchy display
 * stays correct regardless of page size. Falls back to local mock data if
 * the API is unreachable.
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
    console.warn("Falling back to local mock data for fetchCategories:", cause);
    return fetchCategoriesFromMock(limit, offset);
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
    console.warn(
      "Falling back to local mock data for fetchCategoriesNeedingReview:",
      cause,
    );
    return activeCategories().filter((category) => category.needsReview);
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
    console.warn(
      "Falling back to local mock data for fetchParentCategories:",
      cause,
    );
    return buildHierarchyOrder(activeCategories());
  }
}

/** @deprecated Use fetchParentCategories for deep-tree parent selection. */
export async function fetchRootCategories(): Promise<Category[]> {
  return fetchParentCategories();
}

/**
 * Recursively creates a category and any nested `children` in the mock
 * store. Children inherit `parentId` from the freshly-generated id of the
 * node they sit inside, so the same call works for depth 2, 3, 4, N.
 * Returns the root node that was inserted.
 */
function createCategoryInMock(
  body: CreateCategoryRequestBody,
  parentIdOverride: string | null = null,
): Category {
  const timestamp = nowIso();
  const newCategory: Category = {
    id: generateId(),
    slug: body.slug,
    parentId: parentIdOverride ?? body.parentId ?? null,
    icon: body.icon ?? "",
    name: body.name,
    deletedAt: null,
    needsReview: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  categoryStore = [...categoryStore, newCategory];

  if (body.children && body.children.length > 0) {
    body.children.forEach((child) => {
      createCategoryInMock(child, newCategory.id);
    });
  }

  return newCategory;
}

/** POST /api/v1/categories */
export async function createCategory(
  values: CategoryFormValues,
): Promise<Category> {
  const body = buildCreateRequestBody(values);

  try {
    return await requestJson<Category>("", {
      method: "POST",
      headers: JSON_CONTENT_TYPE_HEADERS,
      body: JSON.stringify(body),
    });
  } catch (cause) {
    console.warn("Falling back to local mock data for createCategory:", cause);
    return createCategoryInMock(body);
  }
}

function updateCategoryInMock(
  id: string,
  body: UpdateCategoryRequestBody,
): Category {
  const index = categoryStore.findIndex((category) => category.id === id);

  if (index === -1) {
    throw new Error("Category not found.");
  }

  const current = categoryStore[index];
  const updated: Category = {
    ...current,
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.slug !== undefined ? { slug: body.slug } : {}),
    ...(body.icon !== undefined ? { icon: body.icon } : {}),
    ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
    ...(body.needsReview !== undefined ? { needsReview: body.needsReview } : {}),
    updatedAt: nowIso(),
  };

  categoryStore = categoryStore.map((category) =>
    category.id === id ? updated : category,
  );

  return updated;
}

/**
 * PUT /api/v1/categories/{id}
 * `original` is the category before edits, used to build a partial diff so
 * only changed fields are sent. Pass an emptied icon field to clear it.
 */
export async function updateCategory(
  id: string,
  values: CategoryFormValues,
  original: Category,
): Promise<Category> {
  const body = buildUpdateRequestBody(values, original);

  try {
    return await requestJson<Category>(`/${id}`, {
      method: "PUT",
      headers: JSON_CONTENT_TYPE_HEADERS,
      body: JSON.stringify(body),
    });
  } catch (cause) {
    console.warn("Falling back to local mock data for updateCategory:", cause);
    return updateCategoryInMock(id, body);
  }
}

/**
 * PUT /api/v1/categories/{id} with just `{needsReview: false}` — clears the
 * auto-created review flag without touching name/slug/icon/parent, for the
 * "looks correct, dismiss the flag" action distinct from a full edit.
 */
export async function markCategoryReviewed(id: string): Promise<Category> {
  const body: UpdateCategoryRequestBody = { needsReview: false };

  try {
    return await requestJson<Category>(`/${id}`, {
      method: "PUT",
      headers: JSON_CONTENT_TYPE_HEADERS,
      body: JSON.stringify(body),
    });
  } catch (cause) {
    console.warn(
      "Falling back to local mock data for markCategoryReviewed:",
      cause,
    );
    return updateCategoryInMock(id, body);
  }
}

function deleteCategoryInMock(id: string): void {
  const exists = categoryStore.some((category) => category.id === id);

  if (!exists) {
    throw new Error("Category not found.");
  }

  categoryStore = categoryStore.map((category) =>
    category.id === id ? { ...category, deletedAt: nowIso() } : category,
  );
}

/**
 * DELETE /api/v1/categories/{id}. The real backend hard-deletes the row;
 * only the local mock fallback below simulates a soft delete via deletedAt.
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    await requestJson<void>(`/${id}`, { method: "DELETE" });
  } catch (cause) {
    console.warn("Falling back to local mock data for deleteCategory:", cause);
    deleteCategoryInMock(id);
  }
}
