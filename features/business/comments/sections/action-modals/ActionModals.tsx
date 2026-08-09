import type { PlaceComment } from "../../types";
import CreateModal from "./CreateModal";
import DeleteModal from "./DeleteModal";
import EditModal from "./EditModal";

type Props = {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreated: () => void;
  editComment: PlaceComment | null;
  onEditClose: () => void;
  onEdited: () => void;
  deleteComment: PlaceComment | null;
  placeName?: string;
  onDeleteClose: () => void;
  onDeleted: () => void;
};

export default function ActionModals({
  createOpen, onCreateClose, onCreated,
  editComment, onEditClose, onEdited,
  deleteComment, placeName, onDeleteClose, onDeleted,
}: Props) {
  return (
    <>
      <CreateModal open={createOpen} onClose={onCreateClose} onCreated={onCreated} />
      <EditModal comment={editComment} onClose={onEditClose} onEdited={onEdited} />
      <DeleteModal comment={deleteComment} placeName={placeName} onClose={onDeleteClose} onDeleted={onDeleted} />
    </>
  );
}
