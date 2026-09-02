"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardSummary, useRefreshDashboard } from "@/hooks/use-dashboard";
import { useProducts } from "@/hooks/use-products";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useSuggestedReorder } from "@/hooks/use-purchase-orders";
import {
  DollarSign,
  AlertTriangle,
  Package,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ClipboardCheck,
  RefreshCw,
  History,
  CheckCircle2,
} from "lucide-react";
import type { MovementType } from "@/types/stock-movement";

function movementTypeBadge(type: MovementType): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline";
} {
  switch (type) {
    case "IN":
      return { label: "Stock In", variant: "success" };
    case "OUT":
      return { label: "Stock Out", variant: "destructive" };
    case "TRANSFER_IN":
      return { label: "Transfer In", variant: "default" };
    case "TRANSFER_OUT":
      return { label: "Transfer Out", variant: "warning" };
    case "ADJUSTMENT_IN":
    case "ADJUSTMENT_OUT":
      return { label: "Opname Adj", variant: "secondary" };
    default:
      return { label: type, variant: "outline" };
  }
}

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const canViewSummary = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: summary, isLoading: isLoadingSummary } =
    useDashboardSummary(canViewSummary);
  const refreshDashboard = useRefreshDashboard();

  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts("active");
  const { data: warehouses = [], isLoading: isLoadingWarehouses } =
    useWarehouses("active");
  const { data: suggestedLowStock = [] } = useSuggestedReorder();

  async function handleRefresh() {
    try {
      await refreshDashboard.mutateAsync();
      toast.success("Dashboard metrics refreshed.");
    } catch {
      toast.error("Failed to refresh dashboard.");
    }
  }

  if (!isAuthenticated) return null;

  const lowStockCount =
    summary?.lowStockItemCount ?? suggestedLowStock.length;
  const recentMovements = summary?.recentMovements ?? [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of inventory valuation, stock alerts, and warehouse activity.
          </p>
        </div>

        {canViewSummary && (
          <div className="flex items-center gap-3">
            {summary?.cachedAt && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Cached at {new Date(summary.cachedAt).toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshDashboard.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={`size-3.5 ${
                  refreshDashboard.isPending ? "animate-spin" : ""
                }`}
              />
              Refresh Data
            </Button>
          </div>
        )}
      </div>

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Inventory Value */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory Value
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-7 w-28 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                ${(summary?.totalInventoryValue ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Derived from stock & PO unit prices
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Low Stock Alerts */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <div
              className={`rounded-full p-2 ${
                lowStockCount > 0
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success"
              }`}
            >
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div
                className={`text-2xl font-bold ${
                  lowStockCount > 0 ? "text-warning" : "text-foreground"
                }`}
              >
                {lowStockCount}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount > 0
                ? "At or below reorder threshold"
                : "All stock levels healthy"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active Products */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Package className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {products.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Managed in catalog
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Active Warehouses */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storage Locations
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingWarehouses ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {warehouses.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Active warehouses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Operations Bar */}
      <div className="rounded-lg border border-border bg-card/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Warehouse Operations
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/stock-movements">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-2.5 px-3"
            >
              <ArrowDownLeft className="size-4 text-success" />
              <div className="text-left">
                <div className="text-xs font-medium">Stock In</div>
                <div className="text-[10px] text-muted-foreground">
                  Receive supplier POs
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/stock-movements">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-2.5 px-3"
            >
              <ArrowUpRight className="size-4 text-destructive" />
              <div className="text-left">
                <div className="text-xs font-medium">Stock Out</div>
                <div className="text-[10px] text-muted-foreground">
                  Fulfill sales / usage
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/stock-movements">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-2.5 px-3"
            >
              <ArrowLeftRight className="size-4 text-primary" />
              <div className="text-left">
                <div className="text-xs font-medium">Transfer Stock</div>
                <div className="text-[10px] text-muted-foreground">
                  Move across warehouses
                </div>
              </div>
            </Button>
          </Link>

          <Link href="/stock-opnames">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-2.5 px-3"
            >
              <ClipboardCheck className="size-4 text-warning" />
              <div className="text-left">
                <div className="text-xs font-medium">Stock Opname</div>
                <div className="text-[10px] text-muted-foreground">
                  Physical stock audit
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Low-Stock Alerts & Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Left Column (3 cols): Low Stock Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                Low Stock Alerts
              </CardTitle>
              {canViewSummary && (
                <Link href="/purchase-orders">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary h-7 px-2"
                  >
                    Restock (PO)
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {suggestedLowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="size-8 text-success mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    All stock levels healthy
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[220px] mt-1">
                    No active products are currently below their reorder threshold.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedLowStock.slice(0, 5).map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 p-3"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-foreground">
                          {prod.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {prod.sku} • Reorder point: {prod.reorderPoint}{" "}
                          {prod.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-warning">
                          {prod.currentStock} {prod.unit}
                        </div>
                        <span className="text-[10px] text-destructive font-medium">
                          Restock needed
                        </span>
                      </div>
                    </div>
                  ))}

                  {suggestedLowStock.length > 5 && (
                    <div className="pt-2 text-center">
                      <Link href="/purchase-orders">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-muted-foreground"
                        >
                          + View {suggestedLowStock.length - 5} more items in
                          Purchase Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Recent Movement Activity */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" />
                Recent Movement Logs
              </CardTitle>
              <Link href="/movement-history">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              {recentMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <p className="text-sm">No recent stock movements found.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          Warehouse
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMovements.slice(0, 8).map((m) => {
                        const badge = movementTypeBadge(m.type);
                        const isPositive =
                          m.type === "IN" ||
                          m.type === "TRANSFER_IN" ||
                          m.type === "ADJUSTMENT_IN";

                        return (
                          <tr
                            key={m.id}
                            className="border-b border-border last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground truncate max-w-[130px]">
                                {m.product?.name ?? "Unknown"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {m.product?.sku}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge
                                label={badge.label}
                                variant={badge.variant}
                              />
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-medium ${
                                isPositive
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground truncate max-w-[100px]">
                              {m.warehouse?.name ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
