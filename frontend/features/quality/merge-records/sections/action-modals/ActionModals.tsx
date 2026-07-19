import RecordMergeModal from "./RecordMergeModal";

type Props = {
  recordOpen: boolean;
  onRecordClose: () => void;
  onCreated: () => void;
};

export default function ActionModals({ recordOpen, onRecordClose, onCreated }: Props) {
  return (
    <RecordMergeModal isOpen={recordOpen} onClose={onRecordClose} onCreated={onCreated} />
  );
}
