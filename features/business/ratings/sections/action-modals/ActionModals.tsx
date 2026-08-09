import type { Rating } from "../../types";
import DeleteModal from "./DeleteModal";

type Props = {
  deleteRating: Rating | null;
  placeName?: string;
  onDeleteClose: () => void;
  onDeleted: () => void;
};

export default function ActionModals({ deleteRating, placeName, onDeleteClose, onDeleted }: Props) {
  return (
    <DeleteModal rating={deleteRating} placeName={placeName} onClose={onDeleteClose} onDeleted={onDeleted} />
  );
}
