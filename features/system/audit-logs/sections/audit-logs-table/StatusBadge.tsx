import type { AuditStatus } from "../../types";

type Props = { status: AuditStatus };

export default function StatusBadge({ status }: Props) {
  const map: Record<AuditStatus, string> = {
    SUCCESS: "bx s",
    FAILURE: "bx d",
  };
  return <span className={map[status]}>{status}</span>;
}