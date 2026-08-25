export type CategoryLanguage = "en" | "am";

export type CategoryNameMap = {
  en?: string;
  am?: string;
  [key: string]: string | undefined;
};

/**
 * Internal flat shape used throughout the frontend UI. Any category can be
 * a parent, allowing unlimited tree depth via `parentId` links.
 *
 * The wire format (see `CategoryTreeNode`) is nested; `flattenCategoryTree`
 * in `api.ts` converts wire → this shape.
 */
export type Category = {
  id: string;
  slug: string;
  parentId: string | null;
  icon: string;
  name: CategoryNameMap;
  /**
   * True for categories auto-created by the ingest pipeline from an
   * AI-extracted free-text category string (e.g. "shop") that didn't match
   * any existing category — the extraction/slugification may be wrong, so
   * an admin should confirm or fix it. False for admin-authored categories.
   */
  needsReview: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Nested tree node returned by GET /api/v1/categories. Each node embeds
 * its descendants under `children`; there is no `parentId` on the wire.
 * `children` is omitted (or empty) for leaf nodes.
 */
export type CategoryTreeNode = {
  id: string;
  name: CategoryNameMap;
  slug: string;
  needsReview: boolean;
  /**
   * Present on the wire even for nested nodes, but normally ignored in
   * favor of tree position (see `flattenCategoryTree`). Search results
   * come back as a flat list with no `children`, so that's the only
   * place a node's real parent is recovered from.
   */
  parentId?: string | null;
  children?: CategoryTreeNode[];
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Paginated list response shape for GET /api/v1/categories. `data` is a
 * nested tree of root categories with their full subtrees embedded under
 * `children`; `total`/`limit`/`offset` paginate over the roots.
 */
export type CategoryListResponse = {
  data: CategoryTreeNode[];
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

/**
 * Exact wire payload for POST /api/v1/categories.
 *
 * `children` is self-referential so a single request can create an entire
 * subtree of arbitrary depth (root → child → grandchild → …). Each child
 * inherits its parent from tree position — `parentId` on children is
 * ignored by the server when the node appears inside a `children` array.
 */
export type CreateCategoryRequestBody = {
  name: CategoryNameMap;
  slug: string;
  icon?: string;
  /** Parent can point to any category id (not only roots). */
  parentId?: string;
  children?: CreateCategoryRequestBody[];
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
  needsReview?: boolean;
};

/** Exact wire payload for DELETE /api/v1/categories/bulk. */
export type BulkDeleteCategoriesRequestBody = {
  ids: string[];
};

/**
 * Exact wire payload for PATCH /api/v1/categories/bulk. Same
 * omitted-vs-null-vs-value convention as `UpdateCategoryRequestBody.parentId`
 * — omitted means "leave every selected category's parent alone."
 */
export type BulkUpdateCategoriesRequestBody = {
  ids: string[];
  parentId?: string | null;
  needsReview?: boolean;
};

/**
 * Exact wire payload for POST /api/v1/categories/{id}/merge. The path id is
 * the duplicate being folded away; `targetId` is the survivor that absorbs
 * its places and child categories.
 */
export type MergeCategoryRequestBody = {
  targetId: string;
};

/** Exact wire response for POST /api/v1/categories/{id}/merge. */
export type MergeCategoryResponseBody = {
  target: CategoryTreeNode;
  movedPlaces: number;
  movedChildren: number;
};
