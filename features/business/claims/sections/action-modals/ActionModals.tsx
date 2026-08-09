import type { BusinessClaim } from "../../types";
import ApproveModal from "./ApproveModal";
import CancelModal from "./CancelModal";
import DetailModal from "./DetailModal";
import RejectModal from "./RejectModal";

type Props = {
  placeNames: Record<string, string>;
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
  placeNames,
  detailClaim, onDetailClose,
  approveClaim, onApproveClose, onApproved,
  rejectClaim, onRejectClose, onRejected,
  cancelClaim, onCancelClose, onCancelled,
}: Props) {
  return (
    <>
      <DetailModal claim={detailClaim} placeName={detailClaim ? placeNames[detailClaim.placeId] : undefined} onClose={onDetailClose} />
      <ApproveModal claim={approveClaim} placeName={approveClaim ? placeNames[approveClaim.placeId] : undefined} onClose={onApproveClose} onApproved={onApproved} />
      <RejectModal claim={rejectClaim} placeName={rejectClaim ? placeNames[rejectClaim.placeId] : undefined} onClose={onRejectClose} onRejected={onRejected} />
      <CancelModal claim={cancelClaim} placeName={cancelClaim ? placeNames[cancelClaim.placeId] : undefined} onClose={onCancelClose} onCancelled={onCancelled} />
    </>
  );
}
