"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMovementHistory, type MovementHistoryFilters } from "@/hooks/use-stock-movements";
import { useProducts } from "@/hooks/use-products";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useUsers } from "@/hooks/use-users";
import type { StockMovement } from "@/types/stock-movement";
import { X } from "lucide-react";

const MOVEMENT_TYPES = [
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
  { value: "TRANSFER_IN", label: "Transfer In" },
  { value: "TRANSFER_OUT", label: "Transfer Out" },
  { value: "ADJUSTMENT_IN", label: "Adjustment In" },
  { value: "ADJUSTMENT_OUT", label: "Adjustment Out" },
];

function movementTypeLabel(type: string) {
  return MOVEMENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function movementTypeVariant(
  type: string
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  const map: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
    IN: "success",
    OUT: "destructive",
    TRANSFER_IN: "default",
    TRANSFER_OUT: "outline",
    ADJUSTMENT_IN: "success",
    ADJUSTMENT_OUT: "destructive",
  };
  return map[type] ?? "default";
}

export default function MovementHistoryPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: products = [] } = useProducts("all");
  const { data: warehouses = [] } = useWarehouses("all");
  const { data: users = [] } = useUsers();

  const [filters, setFilters] = useState<MovementHistoryFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useMovementHistory(filters);

  const hasActiveFilters =
    !!filters.productId ||
    !!filters.warehouseId ||
    !!filters.type ||
    !!filters.createdBy ||
    !!filters.date_from ||
    !!filters.date_to;

  function clearFilters() {
    setFilters({ page: 1, limit: 20 });
  }

  function updateFilter(key: keyof MovementHistoryFilters, value: string | undefined) {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  }

  if (!isAuthenticated) return null;

  const columns: DataTableColumn<StockMovement & Record<string, unknown>>[] = [
    {
      key: "product",
      header: "Product",
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.product.name}</div>
          <div className="text-xs text-muted-foreground">{row.product.sku}</div>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      cell: (row) => (
        <span className="text-foreground">{row.warehouse.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <StatusBadge
          label={movementTypeLabel(row.type)}
          variant={movementTypeVariant(row.type)}
        />
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (row) => {
        const isIn =
          row.type === "IN" ||
          row.type === "TRANSFER_IN" ||
          row.type === "ADJUSTMENT_IN";
        return (
          <span className={isIn ? "text-success font-medium" : "text-destructive font-medium"}>
            {isIn ? "+" : "-"}
            {row.quantity}
          </span>
        );
      },
    },
    {
      key: "referenceType",
      header: "Reference",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.referenceType ?? "—"}
          {row.referenceId && (
            <span className="ml-1 text-xs">
              ({row.referenceId.slice(0, 8)})
            </span>
          )}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "User",
      cell: (row) => (
        <span className="text-foreground">{row.creator.name}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Timestamp",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movement History"
        description="Audit all stock movements across the system."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={filters.productId ?? ""}
                onValueChange={(val) => updateFilter("productId", val ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select
                value={filters.warehouseId ?? ""}
                onValueChange={(val) => updateFilter("warehouseId", val ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All warehouses" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select
                value={filters.type ?? ""}
                onValueChange={(val) => updateFilter("type", val ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={filters.createdBy ?? ""}
                onValueChange={(val) => updateFilter("createdBy", val ?? undefined)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.date_from?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "date_from",
                    e.target.value ? new Date(e.target.value).toISOString() : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.date_to?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "date_to",
                    e.target.value
                      ? new Date(e.target.value + "T23:59:59.999Z").toISOString()
                      : undefined
                  )
                }
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="size-3.5" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.data as (StockMovement & Record<string, unknown>)[] ?? []}
        isLoading={isLoading}
        emptyMessage="No stock movements found."
        serverPagination={
          data?.pagination
            ? {
                pageCount: data.pagination.totalPages,
                currentPage: data.pagination.page,
                onPageChange: (page) => setFilters((prev) => ({ ...prev, page })),
              }
            : undefined
        }
      />
    </div>
  );
}
