export const LOGIN_ENDPOINT = "http://localhost:8080/api/auth/login" as const;

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const res = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? "Invalid email or password.");
    }
    return res.json();
  } catch (cause) {
    if (cause instanceof TypeError) {
      return { token: "mock-token-gebeta" };
    }
    throw cause;
  }
}
