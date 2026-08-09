"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/custom/Toast";
import { useToast } from "@/hooks/useToast";
import { deleteUser, fetchUsers, toggleUserStatus, updateUser } from "../../api";
import type { AdminRole, AdminUser } from "../../types";
import ActionModals from "../action-modals";
import UsersSection from "./UsersSection";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<AdminRole | "">("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const { message, visible, showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ role: roleFilter || undefined });
      setUsers(res.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load users right now.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      await toggleUserStatus(id, isActive);
      showToast(isActive ? "User activated." : "User deactivated.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update user status.");
    }
  }, [load, showToast]);

  const handleUpdate = useCallback(async () => {
    showToast("User updated successfully.");
    await load();
  }, [load, showToast]);

  const handleDeleted = useCallback(async () => {
    showToast("User deleted.");
    await load();
  }, [load, showToast]);

  return (
    <div>
      {error && (
        <div style={{ color: "var(--text-danger)", fontSize: 12, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <UsersSection
        users={users}
        loading={loading}
        roleFilter={roleFilter}
        onRoleFilter={setRoleFilter}
        onToggleStatus={handleToggleStatus}
        onInvite={() => setInviteOpen(true)}
        onEdit={(user) => setEditUser(user)}
        onDelete={(user) => setDeleteTarget(user)}
      />

      <ActionModals
        inviteOpen={inviteOpen}
        onInviteClose={() => setInviteOpen(false)}
        onCreated={() => { showToast("User invited successfully."); void load(); }}
        editUser={editUser}
        onEditClose={() => setEditUser(null)}
        onUpdated={handleUpdate}
        deleteUser={deleteTarget}
        onDeleteClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />

      <Toast message={message} visible={visible} />
    </div>
  );
}
