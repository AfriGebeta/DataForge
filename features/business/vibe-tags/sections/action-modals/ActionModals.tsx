import type { VibeTag } from "../../types";
import CreateModal from "./CreateModal";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
  editTag: VibeTag | null;
  onEditClose: () => void;
  onEdited: () => void;
  deleteTag: VibeTag | null;
  placeName?: string;
  onDeleteClose: () => void;
  onDeleted: () => void;
};

export default function ActionModals({
  createOpen, onCreateClose, onCreated,
  editTag, onEditClose, onEdited,
  deleteTag, placeName, onDeleteClose, onDeleted,
}: Props) {
  return (
    <>
      <CreateModal open={createOpen} onClose={onCreateClose} onCreated={onCreated} />
      <EditModal tag={editTag} onClose={onEditClose} onEdited={onEdited} />
      <DeleteModal tag={deleteTag} placeName={placeName} onClose={onDeleteClose} onDeleted={onDeleted} />
    </>
  );
}
