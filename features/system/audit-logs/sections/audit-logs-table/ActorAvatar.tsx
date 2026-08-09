import type { AuditLogItem } from "../../types";

type Props = { log: AuditLogItem };

// An admin actor gets initials from actorLabel (usually an email); a
// system actor (no real caller identity — see types.ts) gets a server icon.
// No per-row color/icon comes from the backend — it's derived here from the
// two real fields we actually have.
export default function ActorAvatar({ log }: Props) {
  if (log.actorType === "admin") {
    const initials = log.actorLabel
      .split(/[@\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "var(--fill-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 600,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "var(--surface-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        flexShrink: 0,
      }}
    >
      <i className="ti ti-server" style={{ fontSize: 10, color: "var(--text-muted)" }} />
    </div>
  );
}