import CreateRuleModal from "./CreateRuleModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
};

export default function ActionModals({ createOpen, onCreateClose, onCreated }: Props) {
  return (
    <CreateRuleModal isOpen={createOpen} onClose={onCreateClose} onCreated={onCreated} />
  );
}
