import type { AdminUser, CreateUserRequest, UpdateUserRequest, UsersParams, UsersResponse } from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/system/users" as const;

const fakeUsers: AdminUser[] = [
  {
    id: "usr-001",
    email: "admin@gebetamaps.com",
    fullName: "Abebe Girma",
    role: "ADMIN",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: "2023-09-01T12:00:00Z",
    updatedAt: "2023-09-01T12:00:00Z",
  },
  {
    id: "usr-002",
    email: "editor@gebetamaps.com",
    fullName: "Tigist Bekele",
    role: "DATA_EDITOR",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: "2023-09-02T12:00:00Z",
    updatedAt: "2023-09-02T12:00:00Z",
  },
  {
    id: "usr-003",
    email: "reviewer@gebetamaps.com",
    fullName: "Dawit Haile",
    role: "DATA_REVIEWER",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: "2023-09-03T12:00:00Z",
    updatedAt: "2023-09-03T12:00:00Z",
  },
  {
    id: "usr-004",
    email: "validator@gebetamaps.com",
    fullName: "Meron Tadesse",
    role: "DATA_VALIDATOR",
    isActive: true,
    lastLoginAt: null,
    createdAt: "2023-09-04T12:00:00Z",
    updatedAt: "2023-09-04T12:00:00Z",
  },
  {
    id: "usr-005",
    email: "viewer@gebetamaps.com",
    fullName: null,
    role: "VIEWER",
    isActive: false,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: "2023-09-05T12:00:00Z",
    updatedAt: "2023-09-05T12:00:00Z",
  },
  {
    id: "usr-006",
    email: "service@gebetamaps.com",
    fullName: "Pipeline Bot",
    role: "SERVICE_ACCOUNT",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: "2023-09-06T12:00:00Z",
    updatedAt: "2023-09-06T12:00:00Z",
  },
];

export async function fetchUsers(params?: UsersParams): Promise<UsersResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const roleQuery = params?.role ? `&role=${params.role}` : "";
    const res = await fetch(
      `${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}${roleQuery}`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const filtered = params?.role
      ? fakeUsers.filter((u) => u.role === params.role)
      : fakeUsers;
    return {
      data: filtered.slice(start, start + pageSize),
      total: filtered.length,
      limit: pageSize,
      offset: start,
    };
  }
}

export async function createUser(request: CreateUserRequest): Promise<AdminUser> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      email: request.email,
      fullName: request.fullName || null,
      role: request.role,
      isActive: request.isActive,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fakeUsers.push(newUser);
    return newUser;
  }
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const user = fakeUsers.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.isActive = isActive;
    return user;
  }
}

export async function updateUser(id: string, request: UpdateUserRequest): Promise<AdminUser> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const user = fakeUsers.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    user.fullName = request.fullName || null;
    user.role = request.role;
    user.isActive = request.isActive;
    user.updatedAt = new Date().toISOString();
    return user;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  } catch {
    const index = fakeUsers.findIndex((u) => u.id === id);
    if (index !== -1) fakeUsers.splice(index, 1);
  }
}
