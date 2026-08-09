import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
import type { AdminUser, CreateUserRequest, UpdateUserRequest, UsersParams, UsersResponse } from "./types";

/** Real endpoint: PlaceForge's admin module. */
export const API_ENDPOINT = `${API_BASE_URL}/api/v1/admin/users`;

async function throwOnError(res: Response): Promise<never> {
  let msg = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) msg = body.error;
  } catch {
    // ignore non-JSON error bodies
  }
  throw new Error(msg);
}

export async function fetchUsers(params?: UsersParams): Promise<UsersResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  });
  if (params?.role) query.set("role", params.role);

  const res = await apiFetch(`${API_ENDPOINT}?${query.toString()}`);
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function createUser(request: CreateUserRequest): Promise<AdminUser> {
  const res = await apiFetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function updateUser(id: string, request: UpdateUserRequest): Promise<AdminUser> {
  // password: "" from the edit form means "leave it alone" — drop the key
  // entirely rather than sending it, since the backend treats an omitted
  // key and a present-but-unset key differently (PATCH semantics).
  const body: UpdateUserRequest = { ...request };
  if (!body.password) delete body.password;

  const res = await apiFetch(`${API_ENDPOINT}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return throwOnError(res);
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
  if (!res.ok) return throwOnError(res);
}
