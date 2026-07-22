import type { AuditLogItem } from "../../types";

type Props = { log: AuditLogItem };

export default function ActorAvatar({ log }: Props) {
  if (log.actor_initials) {
    return (
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: log.actor_color ?? "var(--fill-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 600,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {log.actor_initials}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: log.actor_type === "model"
          ? "var(--bg-accent)"
          : "var(--surface-3)",
        border: log.actor_type === "model"
          ? "1px solid var(--fill-accent)"
          : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        flexShrink: 0,
      }}
    >
      <i
        className={`ti ${log.actor_icon ?? "ti-user"}`}
        style={{
          fontSize: 10,
          color: log.actor_type === "model"
            ? "var(--text-accent)"
            : "var(--text-muted)",
        }}
      />
    </div>
  );
}