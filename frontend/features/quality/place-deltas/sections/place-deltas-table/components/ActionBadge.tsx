import type { DeltaAction } from "../../../types";

type Props = { action: DeltaAction };

export default function ActionBadge({ action }: Props) {
  const map: Record<DeltaAction, string> = {
    UPDATE: "bx a",
    ADD: "bx s",
    REMOVE: "bx d",
  };
  return <span className={map[action]}>{action}</span>;
}