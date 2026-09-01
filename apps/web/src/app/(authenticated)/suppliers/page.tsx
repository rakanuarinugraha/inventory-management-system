"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "./supplier-form";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/supplier";

export default function SuppliersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetSupplier, setTargetSupplier] = useState<Supplier | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";
  const canManage = isAdmin || currentUser?.role === "MANAGER";

  function handleCreate() {
    setEditingSupplier(null);
    setFormOpen(true);
  }

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormOpen(true);
  }

  function handleDeletePrompt(supplier: Supplier) {
    setTargetSupplier(supplier);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!targetSupplier) return;
    deleteSupplier.mutate(targetSupplier.id, {
      onSuccess: () => {
        toast.success(`Supplier "${targetSupplier.name}" has been deleted.`);
        setConfirmOpen(false);
        setTargetSupplier(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete supplier.");
      },
    });
  }

  function handleFormSubmit(data: CreateSupplierInput | { id: string; data: UpdateSupplierInput }) {
    if ("id" in data) {
      updateSupplier.mutate(
        { id: data.id, data: data.data },
        {
          onSuccess: () => {
            toast.success("Supplier updated successfully.");
            setFormOpen(false);
            setEditingSupplier(null);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update supplier.");
          },
        }
      );
    } else {
      createSupplier.mutate(data as CreateSupplierInput, {
        onSuccess: () => {
          toast.success("Supplier created successfully.");
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create supplier.");
        },
      });
    }
  }

  const columns: DataTableColumn<Supplier & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "contactEmail",
      header: "Contact Email",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{(row.contactEmail as string) || "—"}</span>
      ),
    },
    {
      key: "contactPhone",
      header: "Contact Phone",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{(row.contactPhone as string) || "—"}</span>
      ),
    },
    {
      key: "address",
      header: "Address",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{(row.address as string) || "—"}</span>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Supplier & Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row as unknown as Supplier)}
                  title="Edit supplier"
                >
                  <Pencil className="size-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePrompt(row as unknown as Supplier)}
                    title="Delete supplier"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = suppliers.map((s) => ({ ...s })) as (Supplier & Record<string, unknown>)[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier information."
        actionLabel={canManage ? "Add Supplier" : undefined}
        onAction={canManage ? handleCreate : undefined}
      />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No suppliers found."
      />

      <SupplierForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSubmit={handleFormSubmit}
        isSubmitting={createSupplier.isPending || updateSupplier.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetSupplier(null);
        }}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${targetSupplier?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={deleteSupplier.isPending}
      />
    </div>
  );
}
