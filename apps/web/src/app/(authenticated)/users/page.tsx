"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { UserForm } from "./user-form";
import { useUsers, useCreateUser, useUpdateUser, useToggleUserStatus } from "@/hooks/use-users";
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";

function roleBadgeVariant(role: User["role"]) {
  switch (role) {
    case "ADMIN":
      return "default" as const;
    case "MANAGER":
      return "warning" as const;
    case "STAFF":
      return "secondary" as const;
  }
}

function statusBadgeVariant(isActive: boolean) {
  return isActive ? ("success" as const) : ("destructive" as const);
}

export default function UsersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleStatus = useToggleUserStatus();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";

  function handleCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function handleDeactivatePrompt(user: User) {
    setTargetUser(user);
    setConfirmOpen(true);
  }

  function handleConfirmDeactivate() {
    if (!targetUser) return;
    toggleStatus.mutate(
      { id: targetUser.id, isActive: !targetUser.isActive },
      {
        onSuccess: () => {
          toast.success(
            targetUser.isActive
              ? `User "${targetUser.name}" has been deactivated.`
              : `User "${targetUser.name}" has been reactivated.`
          );
          setConfirmOpen(false);
          setTargetUser(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update user status.");
        },
      }
    );
  }

  function handleFormSubmit(data: CreateUserInput | { id: string; data: UpdateUserInput }) {
    if ("id" in data) {
      updateUser.mutate(
        { id: data.id, data: data.data },
        {
          onSuccess: () => {
            toast.success("User updated successfully.");
            setFormOpen(false);
            setEditingUser(null);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update user.");
          },
        }
      );
    } else {
      createUser.mutate(data as CreateUserInput, {
        onSuccess: () => {
          toast.success("User created successfully.");
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create user.");
        },
      });
    }
  }

  const columns: DataTableColumn<User & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (row) => (
        <StatusBadge label={row.role} variant={roleBadgeVariant(row.role)} />
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          label={row.isActive ? "Active" : "Inactive"}
          variant={statusBadgeVariant(row.isActive)}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: User & Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row as unknown as User)}
                  title="Edit user"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeactivatePrompt(row as unknown as User)}
                  title={row.isActive ? "Deactivate user" : "Reactivate user"}
                  disabled={row.id === currentUser?.id}
                >
                  {row.isActive ? (
                    <ToggleRight className="size-4 text-success" />
                  ) : (
                    <ToggleLeft className="size-4 text-destructive" />
                  )}
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = users.map((u) => ({ ...u })) as (User & Record<string, unknown>)[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create, edit, and manage user accounts and roles."
        actionLabel={isAdmin ? "Add User" : undefined}
        onAction={isAdmin ? handleCreate : undefined}
      />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <UserForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={handleFormSubmit}
        isSubmitting={createUser.isPending || updateUser.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetUser(null);
        }}
        title={targetUser?.isActive ? "Deactivate User" : "Reactivate User"}
        description={
          targetUser?.isActive
            ? `Are you sure you want to deactivate "${targetUser?.name}"? They will no longer be able to log in.`
            : `Are you sure you want to reactivate "${targetUser?.name}"? They will be able to log in again.`
        }
        onConfirm={handleConfirmDeactivate}
        confirmLabel={targetUser?.isActive ? "Deactivate" : "Reactivate"}
        variant={targetUser?.isActive ? "destructive" : "default"}
        isSubmitting={toggleStatus.isPending}
      />
    </div>
  );
}
