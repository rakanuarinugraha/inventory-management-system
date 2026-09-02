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
import { ProductForm } from "./product-form";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { ApiError } from "@/lib/api";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";

export default function ProductsPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";

  function handleCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleDeletePrompt(product: Product) {
    setTargetProduct(product);
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    if (!targetProduct) return;
    deleteProduct.mutate(targetProduct.id, {
      onSuccess: () => {
        toast.success(`Product "${targetProduct.name}" has been deactivated.`);
        setConfirmOpen(false);
        setTargetProduct(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete product.");
      },
    });
  }

  function handleFormSubmit(data: CreateProductInput | { id: string; data: UpdateProductInput }) {
    if ("id" in data) {
      updateProduct.mutate(
        { id: data.id, data: data.data },
        {
          onSuccess: () => {
            toast.success("Product updated successfully.");
            setFormOpen(false);
            setEditingProduct(null);
          },
          onError: (err) => {
            if (err instanceof ApiError && err.statusCode === 409) {
              toast.error(err.message || "A product with this SKU already exists.");
            } else {
              toast.error(err.message || "Failed to update product.");
            }
          },
        }
      );
    } else {
      createProduct.mutate(data as CreateProductInput, {
        onSuccess: () => {
          toast.success("Product created successfully.");
          setFormOpen(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.statusCode === 409) {
            toast.error(err.message || "A product with this SKU already exists.");
          } else {
            toast.error(err.message || "Failed to create product.");
          }
        },
      });
    }
  }

  function getCategoryName(product: Product) {
    return product.category?.name ?? "—";
  }

  const columns: DataTableColumn<Product & Record<string, unknown>>[] = [
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      cell: (row) => <span className="font-medium text-foreground">{row.sku}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (row) => <span className="text-foreground">{row.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {getCategoryName(row as unknown as Product)}
        </span>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      sortable: false,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.unit}</span>
      ),
    },
    {
      key: "reorderPoint",
      header: "Reorder Point",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.reorderPoint}</span>
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
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "",
            cell: (row: Product & Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(row as unknown as Product)}
                  title="Edit product"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePrompt(row as unknown as Product)}
                  title="Deactivate product"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = products.map((p) => ({ ...p })) as (Product & Record<string, unknown>)[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product inventory."
        actionLabel={isAdmin ? "Add Product" : undefined}
        onAction={isAdmin ? handleCreate : undefined}
      />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage="No products found."
      />

      <ProductForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetProduct(null);
        }}
        title="Deactivate Product"
        description={`Are you sure you want to deactivate "${targetProduct?.name}"? This product will no longer appear in the product list but will remain in historical records.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Deactivate"
        variant="destructive"
        isSubmitting={deleteProduct.isPending}
      />
    </div>
  );
}
