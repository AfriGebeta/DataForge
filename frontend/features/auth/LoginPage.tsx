"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "./api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token } = await login({ email, password });
      document.cookie = `gebeta_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      router.push("/overview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "var(--surface-0)", overflow: "hidden" }}>

      <div style={{ flex: "0 0 48%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(208,90,11,0.12) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 32, padding: "0 52px", maxWidth: 420 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, overflow: "hidden", background: "var(--sidebar-elevated)", border: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Image src="/image.png" alt="GebetaMaps" width={56} height={56} style={{ objectFit: "contain", display: "block" }} priority />
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>GebetaMaps</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Cartographic Intel Platform</div>
          </div>

          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 300 }}>
            Real-time geographical data health and AI analysis metrics.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20, background: "var(--sidebar-elevated)", border: "1px solid var(--sidebar-border)", borderRadius: 12, padding: "14px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-accent)", letterSpacing: "-0.01em" }}>42M+</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Places</span>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--sidebar-border)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-success)", letterSpacing: "-0.01em" }}>98.4%</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Accuracy</span>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--sidebar-border)", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot da" style={{ margin: 0 }} />Live
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pipeline</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <form onSubmit={handleSubmit} noValidate style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Sign in to your account to continue</p>
          </div>

          <div className="fg">
            <label className="fl" htmlFor="gb-email">Email</label>
            <input
              id="gb-email"
              type="email"
              placeholder="you@gebetamaps.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="fg">
            <label className="fl" htmlFor="gb-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="gb-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, fontSize: 15 }}
              >
                <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-danger)", background: "var(--bg-danger)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 13, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn p"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 13, fontWeight: 600, marginTop: 4 }}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2" style={{ animation: "spin 0.8s linear infinite" }} />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <i className="ti ti-arrow-right" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
