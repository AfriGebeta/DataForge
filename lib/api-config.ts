/** Base URL for PlaceForge's API. Set NEXT_PUBLIC_API_URL in production; defaults to the local dev backend. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
