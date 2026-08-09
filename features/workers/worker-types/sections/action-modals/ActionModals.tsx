import RegisterWorkerModal from "./RegisterWorkerModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function ActionModals({ isOpen, onClose, onCreated }: Props) {
  return (
    <RegisterWorkerModal
      isOpen={isOpen}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}