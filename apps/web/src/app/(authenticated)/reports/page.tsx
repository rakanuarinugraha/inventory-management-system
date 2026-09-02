"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useCategories } from "@/hooks/use-categories";
import {
  useMovingItemsReport,
  downloadStockReportCsv,
  downloadStockReportExcel,
} from "@/hooks/use-reports";
import type {
  ProductMovementItem,
  VelocityClassification,
} from "@/types/report";
import {
  TrendingUp,
  Activity,
  Flame,
  Turtle,
  Download,
  FileSpreadsheet,
  Search,
  Calendar,
} from "lucide-react";

type DatePreset = "7d" | "30d" | "this_month" | "90d" | "custom";

function getDateRangeForPreset(preset: DatePreset): {
  from: string;
  to: string;
} {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  if (preset === "7d") {
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString().split("T")[0], to };
  }
  if (preset === "this_month") {
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fromDate.toISOString().split("T")[0], to };
  }
  if (preset === "90d") {
    const fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString().split("T")[0], to };
  }
  // Default: 30d
  const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: fromDate.toISOString().split("T")[0], to };
}

function classificationBadge(cls: VelocityClassification): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "success" | "warning" | "outline";
} {
  switch (cls) {
    case "FAST":
      return { label: "Fast Moving", variant: "success" };
    case "MEDIUM":
      return { label: "Medium", variant: "default" };
    case "SLOW":
      return { label: "Slow Moving", variant: "warning" };
    default:
      return { label: cls, variant: "outline" };
  }
}

export default function ReportsPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const isAdmin = user?.role === "ADMIN";

  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [dateFrom, setDateFrom] = useState(() => getDateRangeForPreset("30d").from);
  const [dateTo, setDateTo] = useState(() => getDateRangeForPreset("30d").to);
  const [warehouseId, setWarehouseId] = useState<string>("ALL");
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const { data: warehouses = [] } = useWarehouses("active");
  const { data: categories = [] } = useCategories();

  const queryParams = useMemo(() => {
    return {
      date_from: dateFrom,
      date_to: dateTo,
      warehouseId: warehouseId !== "ALL" ? warehouseId : undefined,
      categoryId: categoryId !== "ALL" ? categoryId : undefined,
    };
  }, [dateFrom, dateTo, warehouseId, categoryId]);

  const { data: reportData, isLoading } = useMovingItemsReport(queryParams);

  function handlePresetChange(nextPreset: DatePreset) {
    setDatePreset(nextPreset);
    if (nextPreset !== "custom") {
      const range = getDateRangeForPreset(nextPreset);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  async function handleExportCsv() {
    try {
      setIsExportingCsv(true);
      await downloadStockReportCsv();
      toast.success("Stock report CSV downloaded.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export CSV."
      );
    } finally {
      setIsExportingCsv(false);
    }
  }

  async function handleExportExcel() {
    try {
      setIsExportingExcel(true);
      await downloadStockReportExcel();
      toast.success("Stock report Excel downloaded.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export Excel."
      );
    } finally {
      setIsExportingExcel(false);
    }
  }

  const summary = reportData?.summary ?? {
    totalProducts: 0,
    fastMovingCount: 0,
    mediumMovingCount: 0,
    slowMovingCount: 0,
  };

  const filteredItems = useMemo(() => {
    const rawItems = reportData?.items ?? [];
    if (!searchQuery.trim()) return rawItems;
    const q = searchQuery.toLowerCase();
    return rawItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.productSku.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q)
    );
  }, [reportData?.items, searchQuery]);

  if (!isAuthenticated) return null;

  const columns: DataTableColumn<
    ProductMovementItem & Record<string, unknown>
  >[] = [
    {
      key: "product",
      header: "Product",
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.productName}</div>
          <div className="text-xs text-muted-foreground">{row.productSku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => (
        <span className="text-sm text-foreground">
          {row.categoryName || "—"}
        </span>
      ),
    },
    {
      key: "totalQuantityOut",
      header: "Total Outbound Qty",
      cell: (row) => (
        <span className="font-semibold text-foreground">
          {row.totalQuantityOut.toLocaleString()}
        </span>
      ),
    },
    {
      key: "movementCount",
      header: "Outbound Orders",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.movementCount} transaction{row.movementCount > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "classification",
      header: "Velocity Class",
      cell: (row) => {
        const badge = classificationBadge(row.classification);
        return <StatusBadge label={badge.label} variant={badge.variant} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Page Header with Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Reports & Analytics"
          description="Analyze inventory turnover velocity and export stock audit valuations."
        />

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="gap-1.5"
            >
              <Download className="size-4" />
              {isExportingCsv ? "Exporting CSV..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="gap-1.5"
            >
              <FileSpreadsheet className="size-4" />
              {isExportingExcel ? "Exporting Excel..." : "Export Excel (.xlsx)"}
            </Button>
          </div>
        )}
      </div>

      {/* Date Range Presets and Filters Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
              <Calendar className="size-3.5" /> Date Range:
            </span>
            <Button
              type="button"
              variant={datePreset === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("7d")}
              className="h-7 text-xs px-2.5"
            >
              Last 7 Days
            </Button>
            <Button
              type="button"
              variant={datePreset === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("30d")}
              className="h-7 text-xs px-2.5"
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant={datePreset === "this_month" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("this_month")}
              className="h-7 text-xs px-2.5"
            >
              This Month
            </Button>
            <Button
              type="button"
              variant={datePreset === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("90d")}
              className="h-7 text-xs px-2.5"
            >
              Last 90 Days
            </Button>
            <Button
              type="button"
              variant={datePreset === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetChange("custom")}
              className="h-7 text-xs px-2.5"
            >
              Custom Range
            </Button>
          </div>

          {/* Filters Bar: Custom Date Pickers, Warehouse, Category, Search */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
            {datePreset === "custom" ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </>
            ) : null}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Warehouse</Label>
              <Select
                value={warehouseId}
                onValueChange={(val) => setWarehouseId(val ?? "ALL")}
                items={[
                  { value: "ALL", label: "All Warehouses" },
                  ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                ]}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Warehouses</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(val) => setCategoryId(val ?? "ALL")}
                items={[
                  { value: "ALL", label: "All Categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filter by SKU or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Velocity Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products Shipped
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products with outbound activity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fast Moving
            </CardTitle>
            <div className="rounded-full bg-success/10 p-2 text-success">
              <Flame className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {summary.fastMovingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Top 25% outbound volume (P75+)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medium Velocity
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary.mediumMovingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Steady turnover items (P25–P75)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slow Moving
            </CardTitle>
            <div className="rounded-full bg-warning/10 text-warning">
              <Turtle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {summary.slowMovingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bottom 25% outbound volume (P25-)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Moving Items Velocity Table */}
      <DataTable
        columns={
          columns as DataTableColumn<
            ProductMovementItem & Record<string, unknown>
          >[]
        }
        data={
          filteredItems as (ProductMovementItem & Record<string, unknown>)[]
        }
        isLoading={isLoading}
        emptyMessage="No outbound stock movements recorded for the selected period and filters."
      />
    </div>
  );
}
