"use client";

import { useEffect, useState } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from "@/types/warehouse";

interface WarehouseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  onSubmit: (data: CreateWarehouseInput | { id: string; data: UpdateWarehouseInput }) => void;
  isSubmitting: boolean;
}

export function WarehouseForm({
  open,
  onOpenChange,
  warehouse,
  onSubmit,
  isSubmitting,
}: WarehouseFormProps) {
  const isEdit = !!warehouse;
  const [name, setName] = useState(warehouse?.name ?? "");
  const [address, setAddress] = useState(warehouse?.address ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(warehouse?.name ?? "");
      setAddress(warehouse?.address ?? "");
      setErrors({});
    }
  }, [open, warehouse]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Warehouse name is required";
    if (!address.trim()) next.address = "Address is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      address: address.trim(),
    };

    if (isEdit) {
      onSubmit({ id: warehouse!.id, data: payload });
    } else {
      onSubmit(payload as CreateWarehouseInput);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Warehouse" : "Create Warehouse"}
      description={isEdit ? "Update warehouse details." : "Add a new warehouse or location."}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Create"}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-2">
        <Label htmlFor="warehouse-name">Name</Label>
        <Input
          id="warehouse-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Warehouse name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="warehouse-address">Address</Label>
        <Input
          id="warehouse-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Warehouse address"
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>
    </FormDialog>
  );
}
