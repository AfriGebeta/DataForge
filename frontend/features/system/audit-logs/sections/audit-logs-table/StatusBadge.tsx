import type { AuditLogStatus } from "../../types";

type Props = { status: AuditLogStatus };

export default function StatusBadge({ status }: Props) {
  const map: Record<AuditLogStatus, string> = {
    Success: "bx s",
    Failed: "bx d",
    "Review Flagged": "bx w",
  };
  return <span className={map[status]}>{status}</span>;
}