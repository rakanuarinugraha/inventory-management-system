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
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { WarehouseForm } from "./warehouse-form";
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from "@/hooks/use-warehouses";
import type { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from "@/types/warehouse";

export default function WarehousesPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: warehouses = [], isLoading } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetWarehouse, setTargetWarehouse] = useState<Warehouse | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";

  function handleCreate() {
    setEditingWarehouse(null);
    setFormOpen(true);
  }

  function handleEdit(warehouse: Warehouse) {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  }

  function handleDeletePrompt(warehouse: Warehouse) {
    setTargetWarehouse(warehouse);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!targetWarehouse) return;
    deleteWarehouse.mutate(targetWarehouse.id, {
      onSuccess: () => {
        toast.success(`Warehouse "${targetWarehouse.name}" has been deleted.`);
        setConfirmOpen(false);
        setTargetWarehouse(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete warehouse.");
      },
    });
  }

  function handleFormSubmit(data: CreateWarehouseInput | { id: string; data: UpdateWarehouseInput }) {
    if ("id" in data) {
      updateWarehouse.mutate(
        { id: data.id, data: data.data },
        {
          onSuccess: () => {
            toast.success("Warehouse updated successfully.");
            setFormOpen(false);
            setEditingWarehouse(null);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update warehouse.");
          },
        }
      );
    } else {
      createWarehouse.mutate(data as CreateWarehouseInput, {
        onSuccess: () => {
          toast.success("Warehouse created successfully.");
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create warehouse.");
        },
      });
    }
  }

  const columns: DataTableColumn<Warehouse & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "address",
      header: "Address",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.address as string}</span>
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
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.createdAt as string).toLocaleDateString()}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Warehouse & Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row as unknown as Warehouse)}
                  title="Edit warehouse"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePrompt(row as unknown as Warehouse)}
                  title="Delete warehouse"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = warehouses.map((w) => ({ ...w })) as (Warehouse & Record<string, unknown>)[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses"
        description="Manage warehouse and storage locations."
        actionLabel={isAdmin ? "Add Warehouse" : undefined}
        onAction={isAdmin ? handleCreate : undefined}
      />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No warehouses found."
      />

      <WarehouseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingWarehouse(null);
        }}
        warehouse={editingWarehouse}
        onSubmit={handleFormSubmit}
        isSubmitting={createWarehouse.isPending || updateWarehouse.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetWarehouse(null);
        }}
        title="Delete Warehouse"
        description={`Are you sure you want to delete "${targetWarehouse?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={deleteWarehouse.isPending}
      />
    </div>
  );
}
