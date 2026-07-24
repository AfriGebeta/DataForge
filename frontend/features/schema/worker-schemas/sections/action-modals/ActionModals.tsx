import type { WorkerSchema } from "../../types";
import CreateSchemaModal from "./CreateSchemaModal";
import EditSchemaModal from "./EditSchemaModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
  editSchema: WorkerSchema | null;
  onEditClose: () => void;
  onUpdated: () => void;
};

export default function ActionModals({ createOpen, onCreateClose, onCreated, editSchema, onEditClose, onUpdated }: Props) {
  return (
    <>
      <CreateSchemaModal isOpen={createOpen} onClose={onCreateClose} onCreated={onCreated} />
      <EditSchemaModal schema={editSchema} onClose={onEditClose} onUpdated={onUpdated} />
    </>
  );
}
