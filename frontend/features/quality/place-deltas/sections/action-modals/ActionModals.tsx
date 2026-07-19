import RecordDeltaModal from "./RecordDeltaModal";

type Props = {
  recordOpen: boolean;
  onRecordClose: () => void;
  onCreated: () => void;
};

export default function ActionModals({ recordOpen, onRecordClose, onCreated }: Props) {
  return (
    <RecordDeltaModal isOpen={recordOpen} onClose={onRecordClose} onCreated={onCreated} />
  );
}
