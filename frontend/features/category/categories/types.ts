export type CategoryLanguage = "en" | "am";

export type CategoryNameMap = {
  en?: string;
  am?: string;
  [key: string]: string | undefined;
};

/**
 * Domain shape used throughout the frontend. Mirrors the flat object the
 * API returns for single-object responses (POST / PUT / GET by id):
 * system-managed `id`, `createdAt`, `updatedAt` plus the category fields.
 *
 * Hierarchy JSON model:
 * - The API uses an adjacency-list format (flat array + parentId links).
 * - Any category can be a parent, allowing unlimited tree depth.
 */
export type Category = {
  id: string;
  slug: string;
  parentId: string | null;
  icon: string;
  name: CategoryNameMap;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Paginated list response shape for GET /api/v1/categories.
 * The array of categories is wrapped inside a `data` envelope alongside
 * `total`/`limit`/`offset`.
 */
export type CategoryListResponse = {
  data: Category[];
  total: number;
  limit: number;
  offset: number;
};

/** Local form state — always split into English/Amharic text fields. */
export type CategoryFormValues = {
  nameEn: string;
  nameAm: string;
  slug: string;
  parentId: string;
  icon: string;
};

/** Exact wire payload for POST /api/v1/categories. */
export type CreateCategoryRequestBody = {
  name: CategoryNameMap;
  slug: string;
  icon?: string;
  /** Parent can point to any category id (not only roots). */
  parentId?: string;
};

/**
 * Exact wire payload for PUT /api/v1/categories/{id}.
 * Partial by design — only fields being changed should be included.
 * `icon` may be explicitly set to "" to clear it.
 */
export type UpdateCategoryRequestBody = {
  name?: CategoryNameMap;
  slug?: string;
  icon?: string;
  /** Parent can point to any category id (not only roots). */
  parentId?: string | null;
};
