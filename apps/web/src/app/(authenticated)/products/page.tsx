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
import { ProductForm } from "./product-form";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  useReactivateProduct,
  type ProductStatusFilter,
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

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("active");
  const { data: products = [], isLoading } = useProducts(statusFilter as ProductStatusFilter);
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deactivateProduct = useDeactivateProduct();
  const reactivateProduct = useReactivateProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "reactivate">("deactivate");
  const [skuCollisionError, setSkuCollisionError] = useState<{
    inactiveProductId: string;
    inactiveProductName: string;
  } | null>(null);

  if (!isAuthenticated) return null;

  const isAdmin = currentUser?.role === "ADMIN";

  function handleCreate() {
    setEditingProduct(null);
    setSkuCollisionError(null);
    setFormOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setSkuCollisionError(null);
    setFormOpen(true);
  }

  function handleDeactivatePrompt(product: Product) {
    setTargetProduct(product);
    setConfirmAction("deactivate");
    setConfirmOpen(true);
  }

  function handleReactivatePrompt(product: Product) {
    setTargetProduct(product);
    setConfirmAction("reactivate");
    setConfirmOpen(true);
  }

  function handleConfirmAction() {
    if (!targetProduct) return;

    if (confirmAction === "deactivate") {
      deactivateProduct.mutate(targetProduct.id, {
        onSuccess: () => {
          toast.success(`Product "${targetProduct.name}" has been deactivated.`);
          setConfirmOpen(false);
          setTargetProduct(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to deactivate product.");
        },
      });
    } else {
      reactivateProduct.mutate(targetProduct.id, {
        onSuccess: () => {
          toast.success(`Product "${targetProduct.name}" has been reactivated.`);
          setConfirmOpen(false);
          setTargetProduct(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reactivate product.");
        },
      });
    }
  }

  function handleFormSubmit(data: CreateProductInput | { id: string; data: UpdateProductInput }) {
    setSkuCollisionError(null);

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
              const details = err.data as { details?: { inactiveProductId?: string; inactiveProductName?: string; suggestReactivation?: boolean } } | undefined;
              if (details?.details?.suggestReactivation) {
                setSkuCollisionError({
                  inactiveProductId: details.details.inactiveProductId!,
                  inactiveProductName: details.details.inactiveProductName!,
                });
              } else {
                toast.error(err.message || "A product with this SKU already exists.");
              }
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
          setSkuCollisionError(null);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.statusCode === 409) {
            const details = err.data as { details?: { inactiveProductId?: string; inactiveProductName?: string; suggestReactivation?: boolean } } | undefined;
            if (details?.details?.suggestReactivation) {
              setSkuCollisionError({
                inactiveProductId: details.details.inactiveProductId!,
                inactiveProductName: details.details.inactiveProductName!,
              });
            } else {
              toast.error(err.message || "A product with this SKU already exists.");
            }
          } else {
            toast.error(err.message || "Failed to create product.");
          }
        },
      });
    }
  }

  function handleReactivateFromForm() {
    if (!skuCollisionError) return;
    reactivateProduct.mutate(skuCollisionError.inactiveProductId, {
      onSuccess: () => {
        toast.success(`Product "${skuCollisionError.inactiveProductName}" has been reactivated.`);
        setFormOpen(false);
        setSkuCollisionError(null);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to reactivate product.");
      },
    });
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
            cell: (row: Product & Record<string, unknown>) => {
              const isActive = row.isActive as boolean;
              return (
                <div className="flex items-center justify-end gap-1">
                  {isActive ? (
                    <>
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
                        onClick={() => handleDeactivatePrompt(row as unknown as Product)}
                        title="Deactivate product"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReactivatePrompt(row as unknown as Product)}
                      title="Reactivate product"
                    >
                      <RotateCcw className="size-4 text-primary" />
                    </Button>
                  )}
                </div>
              );
            },
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

      <StatusFilter value={statusFilter} onChange={setStatusFilter} />

      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        emptyMessage={
          statusFilter === "active"
            ? "No active products found."
            : statusFilter === "inactive"
              ? "No inactive products found."
              : "No products found."
        }
      />

      <ProductForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingProduct(null);
            setSkuCollisionError(null);
          }
        }}
        product={editingProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        skuCollisionError={skuCollisionError}
        onReactivateFromForm={handleReactivateFromForm}
        isReactivating={reactivateProduct.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setTargetProduct(null);
        }}
        title={confirmAction === "deactivate" ? "Deactivate Product" : "Reactivate Product"}
        description={
          confirmAction === "deactivate"
            ? `Are you sure you want to deactivate "${targetProduct?.name}"? This product will no longer appear in the product list but can be reactivated later.`
            : `Are you sure you want to reactivate "${targetProduct?.name}"? It will reappear in the active product list.`
        }
        onConfirm={handleConfirmAction}
        confirmLabel={confirmAction === "deactivate" ? "Deactivate" : "Reactivate"}
        variant={confirmAction === "deactivate" ? "destructive" : "default"}
        isSubmitting={deactivateProduct.isPending || reactivateProduct.isPending}
      />
    </div>
  );
}
