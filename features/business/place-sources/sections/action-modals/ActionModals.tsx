import type { PlaceSource } from "../../types";
import CreateModal from "./CreateModal";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
  editSource: PlaceSource | null;
  onEditClose: () => void;
  onEdited: () => void;
  deleteSource: PlaceSource | null;
  placeName?: string;
  onDeleteClose: () => void;
  onDeleted: () => void;
};

export default function ActionModals({
  createOpen, onCreateClose, onCreated,
  editSource, onEditClose, onEdited,
  deleteSource, placeName, onDeleteClose, onDeleted,
}: Props) {
  return (
    <>
      <CreateModal open={createOpen} onClose={onCreateClose} onCreated={onCreated} />
      <EditModal source={editSource} onClose={onEditClose} onEdited={onEdited} />
      <DeleteModal source={deleteSource} placeName={placeName} onClose={onDeleteClose} onDeleted={onDeleted} />
    </>
  );
}
