/**
 * Drop-in replacement for `fetch` that attaches the admin JWT (read from the
 * `gebeta_token` cookie set at login) as `Authorization: Bearer <token>`.
 * PlaceForge now requires this on every /api/v1/* route except login, so any
 * fetch to the backend needs to go through this instead of the raw global
 * `fetch`. On a 401 the token is gone/expired — clear the cookie and bounce
 * to /login rather than let every call site handle it individually.
 */
function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )gebeta_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function handleUnauthorized() {
  if (typeof document === "undefined") return;
  document.cookie = "gebeta_token=; path=/; max-age=0";
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    handleUnauthorized();
  }

  return res;
}
