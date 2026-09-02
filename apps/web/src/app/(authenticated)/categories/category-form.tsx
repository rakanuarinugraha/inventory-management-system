"use client";

import { useState } from "react";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  categories: Category[];
  onSubmit: (data: CreateCategoryInput | { id: string; data: UpdateCategoryInput }) => void;
  isSubmitting: boolean;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  categories,
  onSubmit,
  isSubmitting,
}: CategoryFormProps) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState<string>(category?.parentId ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevCategory, setPrevCategory] = useState(category);
  const [prevOpen, setPrevOpen] = useState(open);

  if (category !== prevCategory || open !== prevOpen) {
    setPrevCategory(category);
    setPrevOpen(open);
    if (open) {
      setName(category?.name ?? "");
      setParentId(category?.parentId ?? "");
      setErrors({});
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Category name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      parentId: parentId || null,
    };

    if (isEdit) {
      onSubmit({ id: category!.id, data: payload });
    } else {
      onSubmit(payload as CreateCategoryInput);
    }
  }

  const parentOptions = categories.filter(
    (c) => c.id !== category?.id
  );

  const selectItems = {
    __none: "None (top-level)",
    ...Object.fromEntries(parentOptions.map((c) => [c.id, c.name])),
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit Category" : "Create Category"}
      description={isEdit ? "Update category details." : "Add a new product category."}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Create"}
      isSubmitting={isSubmitting}
    >
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label>Parent Category (optional)</Label>
        <Select
          value={parentId || "__none"}
          onValueChange={(val: string | null) => setParentId(!val || val === "__none" ? "" : val)}
          items={selectItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None (top-level)</SelectItem>
            {parentOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
