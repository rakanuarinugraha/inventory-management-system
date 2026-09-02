"use client";

import { useState } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/supplier";

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSubmit: (data: CreateSupplierInput | { id: string; data: UpdateSupplierInput }) => void;
  isSubmitting: boolean;
}

export function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  isSubmitting,
}: SupplierFormProps) {
  const isEdit = !!supplier;
  const [name, setName] = useState(supplier?.name ?? "");
  const [contactEmail, setContactEmail] = useState(supplier?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(supplier?.contactPhone ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevSupplier, setPrevSupplier] = useState(supplier);
  const [prevOpen, setPrevOpen] = useState(open);

  if (supplier !== prevSupplier || open !== prevOpen) {
    setPrevSupplier(supplier);
    setPrevOpen(open);
    if (open) {
      setName(supplier?.name ?? "");
      setContactEmail(supplier?.contactEmail ?? "");
      setContactPhone(supplier?.contactPhone ?? "");
      setAddress(supplier?.address ?? "");
      setErrors({});
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Supplier name is required";
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      next.contactEmail = "Invalid email address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
      address: address.trim() || null,
    };

    if (isEdit) {
      onSubmit({ id: supplier!.id, data: payload });
    } else {
      onSubmit(payload as CreateSupplierInput);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Supplier" : "Create Supplier"}
      description={isEdit ? "Update supplier details." : "Add a new supplier."}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Create"}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-2">
        <Label htmlFor="supplier-name">Name</Label>
        <Input
          id="supplier-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Supplier name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier-email">Contact Email</Label>
        <Input
          id="supplier-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="email@example.com"
        />
        {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier-phone">Contact Phone</Label>
        <Input
          id="supplier-phone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Phone number"
        />
        {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier-address">Address</Label>
        <Input
          id="supplier-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Supplier address"
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>
    </FormDialog>
  );
}
