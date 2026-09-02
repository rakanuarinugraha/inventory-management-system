"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusFilter, type StatusFilterValue } from "@/components/shared/status-filter";
import { Button } from "@/components/ui/button";
import { SupplierForm } from "./supplier-form";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
  useReactivateSupplier,
  type SupplierStatusFilter,
} from "@/hooks/use-suppliers";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/supplier";

export default function SuppliersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("active");
  const { data: suppliers = [], isLoading } = useSuppliers(statusFilter as SupplierStatusFilter);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const reactivateSupplier = useReactivateSupplier();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetSupplier, setTargetSupplier] = useState<Supplier | null>(null);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "reactivate">("deactivate");

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

  function handleDeactivatePrompt(supplier: Supplier) {
    setTargetSupplier(supplier);
    setConfirmAction("deactivate");
    setConfirmOpen(true);
  }

  function handleReactivatePrompt(supplier: Supplier) {
    setTargetSupplier(supplier);
    setConfirmAction("reactivate");
    setConfirmOpen(true);
  }

  function handleConfirmAction() {
    if (!targetSupplier) return;

    if (confirmAction === "deactivate") {
      deactivateSupplier.mutate(targetSupplier.id, {
        onSuccess: () => {
          toast.success(`Supplier "${targetSupplier.name}" has been deactivated.`);
          setConfirmOpen(false);
          setTargetSupplier(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to deactivate supplier.");
        },
      });
    } else {
      reactivateSupplier.mutate(targetSupplier.id, {
        onSuccess: () => {
          toast.success(`Supplier "${targetSupplier.name}" has been reactivated.`);
          setConfirmOpen(false);
          setTargetSupplier(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reactivate supplier.");
        },
      });
    }
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
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          label={row.isActive ? "Active" : "Inactive"}
          variant={row.isActive ? "success" : "destructive"}
        />
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Supplier & Record<string, unknown>) => {
              const isActive = row.isActive as boolean;
              return (
                <div className="flex items-center justify-end gap-1">
                  {isActive ? (
                    <>
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
                          onClick={() => handleDeactivatePrompt(row as unknown as Supplier)}
                          title="Deactivate supplier"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  ) : (
                    isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReactivatePrompt(row as unknown as Supplier)}
                        title="Reactivate supplier"
                      >
                        <RotateCcw className="size-4 text-primary" />
                      </Button>
                    )
                  )}
                </div>
              );
            },
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

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          statusFilter === "active"
            ? "No active suppliers found."
            : statusFilter === "inactive"
              ? "No inactive suppliers found."
              : "No suppliers found."
        }
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
        title={confirmAction === "deactivate" ? "Deactivate Supplier" : "Reactivate Supplier"}
        description={
          confirmAction === "deactivate"
            ? `Are you sure you want to deactivate "${targetSupplier?.name}"? This supplier will no longer appear in the supplier list but can be reactivated later.`
            : `Are you sure you want to reactivate "${targetSupplier?.name}"? It will reappear in the active supplier list.`
        }
        onConfirm={handleConfirmAction}
        confirmLabel={confirmAction === "deactivate" ? "Deactivate" : "Reactivate"}
        variant={confirmAction === "deactivate" ? "destructive" : "default"}
        isSubmitting={deactivateSupplier.isPending || reactivateSupplier.isPending}
      />
    </div>
  );
}
