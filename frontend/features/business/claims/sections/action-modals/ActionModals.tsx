import type { BusinessClaim } from "../../types";
import ApproveModal from "./ApproveModal";
import CancelModal from "./CancelModal";
import DetailModal from "./DetailModal";
import RejectModal from "./RejectModal";

type Props = {
  detailClaim: BusinessClaim | null;
  onDetailClose: () => void;
  approveClaim: BusinessClaim | null;
  onApproveClose: () => void;
  onApproved: () => void;
  rejectClaim: BusinessClaim | null;
  onRejectClose: () => void;
  onRejected: () => void;
  cancelClaim: BusinessClaim | null;
  onCancelClose: () => void;
  onCancelled: () => void;
};

export default function ActionModals({
  detailClaim, onDetailClose,
  approveClaim, onApproveClose, onApproved,
  rejectClaim, onRejectClose, onRejected,
  cancelClaim, onCancelClose, onCancelled,
}: Props) {
  return (
    <>
      <DetailModal claim={detailClaim} onClose={onDetailClose} />
      <ApproveModal claim={approveClaim} onClose={onApproveClose} onApproved={onApproved} />
      <RejectModal claim={rejectClaim} onClose={onRejectClose} onRejected={onRejected} />
      <CancelModal claim={cancelClaim} onClose={onCancelClose} onCancelled={onCancelled} />
    </>
  );
}
