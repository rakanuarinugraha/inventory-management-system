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
import { CategoryForm } from "./category-form";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";

export default function CategoriesPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";

  function handleCreate() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleDeletePrompt(category: Category) {
    setTargetCategory(category);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!targetCategory) return;
    deleteCategory.mutate(targetCategory.id, {
      onSuccess: () => {
        toast.success(`Category "${targetCategory.name}" has been deleted.`);
        setConfirmOpen(false);
        setTargetCategory(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete category.");
      },
    });
  }

  function handleFormSubmit(data: CreateCategoryInput | { id: string; data: UpdateCategoryInput }) {
    if ("id" in data) {
      updateCategory.mutate(
        { id: data.id, data: data.data },
        {
          onSuccess: () => {
            toast.success("Category updated successfully.");
            setFormOpen(false);
            setEditingCategory(null);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to update category.");
          },
        }
      );
    } else {
      createCategory.mutate(data as CreateCategoryInput, {
        onSuccess: () => {
          toast.success("Category created successfully.");
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create category.");
        },
      });
    }
  }

  function getParentName(category: Category) {
    if (!category.parent) return "—";
    return category.parent.name;
  }

  function getChildCount(category: Category) {
    return category.children?.length ?? 0;
  }

  const columns: DataTableColumn<Category & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "parent",
      header: "Parent",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {getParentName(row as unknown as Category)}
        </span>
      ),
    },
    {
      key: "children",
      header: "Subcategories",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {getChildCount(row as unknown as Category)}
        </span>
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
            cell: (row: Category & Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row as unknown as Category)}
                  title="Edit category"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePrompt(row as unknown as Category)}
                  title="Delete category"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = categories.map((c) => ({ ...c })) as (Category & Record<string, unknown>)[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products into categories."
        actionLabel={isAdmin ? "Add Category" : undefined}
        onAction={isAdmin ? handleCreate : undefined}
      />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No categories found."
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
        category={editingCategory}
        categories={categories}
        onSubmit={handleFormSubmit}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetCategory(null);
        }}
        title="Delete Category"
        description={`Are you sure you want to delete "${targetCategory?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        variant="destructive"
        isSubmitting={deleteCategory.isPending}
      />
    </div>
  );
}
