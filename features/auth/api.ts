import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";
/** Real endpoint: PlaceForge's admin module (POST /admin/login, mounted under /api/v1). */
export const LOGIN_ENDPOINT = `${API_BASE_URL}/api/v1/admin/login`;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await apiFetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error("Could not reach the server. Is PlaceForge running on :8080?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "Invalid email or password.");
  }
  return res.json();
}
