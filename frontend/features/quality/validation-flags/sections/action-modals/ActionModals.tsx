import BulkResolveModal from "./BulkResolveModal";
import CreateFlagModal from "./CreateFlagModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
  bulkOpen: boolean;
  onBulkClose: () => void;
  onResolved: () => void;
};

export default function ActionModals({ createOpen, onCreateClose, onCreated, bulkOpen, onBulkClose, onResolved }: Props) {
  return (
    <>
      <CreateFlagModal isOpen={createOpen} onClose={onCreateClose} onCreated={onCreated} />
      <BulkResolveModal isOpen={bulkOpen} onClose={onBulkClose} onResolved={onResolved} />
    </>
  );
}
