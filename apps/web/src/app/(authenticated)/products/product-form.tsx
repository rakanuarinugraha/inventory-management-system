"use client";

import { useState } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";
import type { Category } from "@/types/category";

interface SkuCollisionError {
  inactiveProductId: string;
  inactiveProductName: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSubmit: (data: CreateProductInput | { id: string; data: UpdateProductInput }) => void;
  isSubmitting: boolean;
  skuCollisionError?: SkuCollisionError | null;
  onReactivateFromForm?: () => void;
  isReactivating?: boolean;
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
  isSubmitting,
  skuCollisionError,
  onReactivateFromForm,
  isReactivating,
}: ProductFormProps) {
  const isEdit = !!product;
  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [reorderPoint, setReorderPoint] = useState(product?.reorderPoint?.toString() ?? "0");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevProduct, setPrevProduct] = useState(product);
  const [prevOpen, setPrevOpen] = useState(open);

  if (product !== prevProduct || open !== prevOpen) {
    setPrevProduct(product);
    setPrevOpen(open);
    if (open) {
      setSku(product?.sku ?? "");
      setName(product?.name ?? "");
      setCategoryId(product?.categoryId ?? "");
      setUnit(product?.unit ?? "");
      setReorderPoint(product?.reorderPoint?.toString() ?? "0");
      setErrors({});
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!sku.trim()) next.sku = "SKU is required";
    if (!name.trim()) next.name = "Product name is required";
    if (!categoryId) next.categoryId = "Category is required";
    if (!unit.trim()) next.unit = "Unit is required";
    const rp = parseInt(reorderPoint, 10);
    if (reorderPoint === "" || isNaN(rp) || rp < 0) next.reorderPoint = "Reorder point must be 0 or greater";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      categoryId,
      unit: unit.trim(),
      reorderPoint: parseInt(reorderPoint, 10) || 0,
    };

    if (isEdit) {
      onSubmit({ id: product!.id, data: payload });
    } else {
      onSubmit(payload as CreateProductInput);
    }
  }

  const selectItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit Product" : "Create Product"}
      description={isEdit ? "Update product details." : "Add a new product to inventory."}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Create"}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-2">
        <Label htmlFor="product-sku">SKU</Label>
        <Input
          id="product-sku"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="e.g. PRD-001"
        />
        {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
      </div>

      {skuCollisionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-sm text-destructive font-medium">
            This SKU belongs to an inactive product: &quot;{skuCollisionError.inactiveProductName}&quot;
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReactivateFromForm}
            disabled={isReactivating}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            {isReactivating ? "Reactivating..." : "Reactivate instead?"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="product-name">Name</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={categoryId}
          onValueChange={(val: string | null) => setCategoryId(val ?? "")}
          items={selectItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-unit">Unit</Label>
        <Input
          id="product-unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. pcs, kg, box"
        />
        {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-reorder-point">Reorder Point</Label>
        <Input
          id="product-reorder-point"
          type="number"
          min={0}
          value={reorderPoint}
          onChange={(e) => setReorderPoint(e.target.value)}
          placeholder="0"
        />
        {errors.reorderPoint && <p className="text-xs text-destructive">{errors.reorderPoint}</p>}
      </div>
    </FormDialog>
  );
}
