import type { AdminUser } from "../../types";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditUserModal from "./EditUserModal";
import InviteUserModal from "./InviteUserModal";

type Props = {
  inviteOpen: boolean;
  onInviteClose: () => void;
  onCreated: () => void;
  editUser: AdminUser | null;
  onEditClose: () => void;
  onUpdated: () => void;
  deleteUser: AdminUser | null;
  onDeleteClose: () => void;
  onDeleted: () => void;
};

export default function ActionModals({
  inviteOpen,
  onInviteClose,
  onCreated,
  editUser,
  onEditClose,
  onUpdated,
  deleteUser,
  onDeleteClose,
  onDeleted,
}: Props) {
  return (
    <>
      <InviteUserModal isOpen={inviteOpen} onClose={onInviteClose} onCreated={onCreated} />
      <EditUserModal user={editUser} onClose={onEditClose} onUpdated={onUpdated} />
      <DeleteConfirmModal user={deleteUser} onClose={onDeleteClose} onDeleted={onDeleted} />
    </>
  );
}
